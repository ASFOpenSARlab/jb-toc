import * as path from 'path';
import * as yaml from 'js-yaml';
import { getJupyterAppInstance } from './index';
import prettier from 'prettier';
import parserHtml from 'prettier/plugins/html';

import * as jb1 from './jb1';
import * as jb2 from './jb2';

interface FileMetadata {
  path: string;
}

interface Notebook {
  cells: Cell[];
}

interface Cell {
  cell_type: 'markdown';
  metadata: { object: any };
  source: string;
}

export async function getFileContents(path: string): Promise<string> {
  try {
    const app = getJupyterAppInstance();
    const data = await app.serviceManager.contents.get(path, { content: true });
    if (data.type === 'notebook' || data.type === 'file') {
      return data.content as string;
    } else {
      throw new Error(`Unsupported file type: ${data.type}`);
    }
  } catch (error) {
    console.error(`Failed to get file contents for ${path}:`, error);
    throw error;
  }
}

export async function ls(pth: string): Promise<any> {
  if (pth === '') {
    pth = '/';
  }

  try {
    const app = getJupyterAppInstance();
    const data = await app.serviceManager.contents.get(pth, { content: true });
    return data;
  } catch (error) {
    console.error('Error listing directory contents:', error);
    return null;
  }
}

export function escapeHtml(str: string): string {
  console.log(str);
  return str
    .replaceAll(/&/g, "&amp;")
    .replaceAll(/</g, "&lt;")
    .replaceAll(/>/g, "&gt;")
    .replaceAll(/"/g, "&quot;")
    .replaceAll(/'/g, "&#39;");
}

async function findConfigInParents(cwd: string): Promise<string | null> {
  const configPatterns: string[] = ['myst.yml', '_toc.yml'];
  for (const configPattern of configPatterns) {
    const dirs = cwd.split('/');
    let counter: number = 0;
    while (counter < 1) {
      const pth = dirs.join('/');
      const files = await ls(pth);
      for (const value of Object.values(files.content)) {
        const file = value as FileMetadata;
        if (file.path.includes(configPattern)) {
          return file.path;
        }
      }
      if (dirs.length === 0) {
        counter += 1;
      } else {
        dirs.pop();
      }
    }
  }

  return null;
}

export async function getFullPath(file_pattern: string, dir_pth: string) {
  const files = await ls(dir_pth);
  for (const value of Object.values(files.content)) {
    const file = value as FileMetadata;
    if (file.path.includes(file_pattern)) {
      return file.path;
    }
  }
  return `Unable to locate ${file_pattern} in ${dir_pth}`;
}

function isNotebook(obj: any): obj is Notebook {
  return obj && typeof obj === 'object' && Array.isArray(obj.cells);
}

export async function getFileTitleFromHeader(
  filePath: string
): Promise<string | null> {
  const suffix = path.extname(filePath);
  if (suffix === '.ipynb') {
    try {
      const jsonData: Notebook | string = await getFileContents(filePath);
      if (isNotebook(jsonData)) {
        const headerCells = jsonData.cells.filter(cell => {
          if (cell.cell_type === 'markdown') {
            const source = Array.isArray(cell.source)
              ? cell.source.join('')
              : cell.source;
            return source.split('\n').some(line => line.startsWith('# '));
          }
          return false;
        });

        const firstHeaderCell = headerCells.length > 0 ? headerCells[0] : null;
        if (firstHeaderCell) {
          if (firstHeaderCell.source.split('\n')[0].slice(0, 2) === '# ') {
            const title: string = firstHeaderCell.source
              .split('\n')[0]
              .slice(2);
            return title;
          }
        }
      }
    } catch (error) {
      console.error('Error reading or parsing notebook:', error);
    }
  } else if (suffix === '.md') {
    try {
      const md: Notebook | string = await getFileContents(filePath);
      if (!isNotebook(md)) {
        const lines: string[] = md.split('\n');
        for (const line of lines) {
          if (line.slice(0, 2) === '# ') {
            return line.slice(2);
          }
        }
      }
    } catch (error) {
      console.error('Error reading or parsing Markdown:', error);
    }
  }
  return null;
}

export async function globFiles(pattern: string): Promise<string[]> {
  const baseDir = '';
  const result: string[] = [];

  try {
    const app = getJupyterAppInstance();
    const data = await app.serviceManager.contents.get(baseDir, {
      content: true
    });
    const regex = new RegExp(pattern);
    for (const item of data.content) {
      if (item.type === 'file' && regex.test(item.path)) {
        result.push(item.path);
      }
    }
  } catch (error) {
    console.error(`Error globbing pattern ${pattern}`, error);
  }

  return result;
}

export async function getTOC(cwd: string): Promise<string> {
  const tocPath = await findConfigInParents(cwd);
  let configPath = null;
  let configParent = null;
  let html;
  if (tocPath) {
    const myst = tocPath.includes('myst');
    const parts = tocPath.split('/');

    parts.pop();
    configParent = parts.join('/');

    if (!myst) {
      const files = await ls(configParent);
      const configPattern = '_config.yml';
      for (const value of Object.values(files.content)) {
        const file = value as FileMetadata;
        if (file.path.includes(configPattern)) {
          configPath = file.path;
          break;
        }
      }
    }

    if (
      !myst &&
      configParent !== null &&
      configParent !== undefined &&
      configPath
    ) {
      try {
        const tocYamlStr = await getFileContents(tocPath);
        if (typeof tocYamlStr === 'string') {
          const tocYaml: unknown = yaml.load(tocYamlStr);
          const toc = tocYaml as jb1.JBook1TOC;
          const config = await jb1.getJBook1Config(configPath);
          const toc_html = await jb1.jBook1TOCToHtml(toc, configParent);
          html = `
          <div class="jbook-toc" data-toc-dir="${configParent}">
            <p id="toc-title">${escapeHtml(String(config.title))}</p>
            <p id="toc-author">Author: ${escapeHtml(String(config.author))}</p>
            ${toc_html}
          </div>
          `;
        } else {
          console.error('Error: Misconfigured Jupyter Book _toc.yml.');
        }
      } catch (error) {
        console.error('Error reading or parsing _toc.yml:', error);
      }
    } else if (myst && configParent !== null && configParent !== undefined) {
      try {
        const mystYAMLStr = await getFileContents(tocPath);
        if (typeof mystYAMLStr === 'string') {
          const mystYaml: unknown = yaml.load(mystYAMLStr);
          const yml = mystYaml as jb2.Myst;
          const project = yml.project as jb2.MystProject;

          const html_top = await jb2.getHtmlTop(project, configParent);
          const toc_html = await jb2.mystTOCToHtml(project.toc, configParent);
          const html_bottom = await jb2.getHtmlBottom(project);

          html = `
            ${html_top}
            <ul>${toc_html}</ul>
            </div>
            ${html_bottom}
            `;
        } else {
          console.error('Error: Misconfigured Jupyter Book _toc.yml.');
        }
      } catch (error) {
        console.error('Error reading or parsing _toc.yml:', error);
      }
    }
  }

  if (typeof html !== 'string') {
    html = `
      <p id="toc-title">Not a Jupyter-Book</p>
      <p id="toc-author">Could not find a "_toc.yml", "_config.yml", or "myst.yml in or above the current directory:</p>
      <p id="toc-author">${cwd}</p>
      <p id="toc-author">Please navigate to a Jupyter-Book directory to view its Table of Contents</p>
      `;
  }

  html = await prettier.format(html, {
    parser: 'html',
    plugins: [parserHtml]
  });
  console.debug(html);
  return html;
}
