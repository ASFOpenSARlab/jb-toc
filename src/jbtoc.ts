import * as path from 'path';
import * as yaml from 'js-yaml';
import { getJupyterAppInstance } from './index';

import * as jb1 from './jb1';
import * as jb2 from './jb2';
// import { PassThrough } from 'stream';

interface IFileMetadata {
  path: string;
}

interface INotebook {
  cells: ICell[];
}

interface ICell {
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

async function findConfigInParents(cwd: string): Promise<string | null> {
  const configPatterns: string[] = ['myst.yml', '_toc.yml'];
  for (const configPattern of configPatterns) {
    const dirs = cwd.split('/');
    let counter: number = 0;
    while (counter < 1) {
      const pth = dirs.join('/');
      const files = await ls(pth);
      for (const value of Object.values(files.content)) {
        const file = value as IFileMetadata;
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
    const file = value as IFileMetadata;
    if (file.path.includes(file_pattern)) {
      return file.path;
    }
  }
  return `Unable to locate ${file_pattern} in ${dir_pth}`;
}

function isNotebook(obj: any): obj is INotebook {
  return obj && typeof obj === 'object' && Array.isArray(obj.cells);
}

export async function getTitle(filePath: string): Promise<string | null> {
  const suffix = path.extname(filePath);
  if (suffix === '.ipynb') {
    try {
      const jsonData: INotebook | string = await getFileContents(filePath);
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
      const md: INotebook | string = await getFileContents(filePath);
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
  if (tocPath) {
    const myst = tocPath.includes("myst")
    const parts = tocPath.split('/');

    parts.pop();
    configParent = parts.join('/');
    
    if (!myst) {
      const files = await ls(configParent);
      const configPattern = '_config.yml';
      for (const value of Object.values(files.content)) {
        const file = value as IFileMetadata;
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
          const toc = tocYaml as jb1.IToc;
          const config = await jb1.getBookConfig(configPath);
          const toc_html = await jb1.tocToHtml(toc, configParent);
          return `
            <div class="jbook-toc" data-toc-dir="${configParent}"><p id="toc-title">${config.title}</p>
            <p id="toc-author">Author: ${config.author}</p>
            ${toc_html} </div>
              `;
        } else {
          console.error('Error: Misconfigured Jupyter Book _toc.yml.');
        }
      } catch (error) {
        console.error('Error reading or parsing _toc.yml:', error);
      }
    }
    else if (
      myst &&
      configParent !== null &&
      configParent !== undefined
    ) {
      try {
        const mystYAMLStr = await getFileContents(tocPath);
        if (typeof mystYAMLStr === 'string') {
          const mystYaml: unknown = yaml.load(mystYAMLStr);
          const yml = mystYaml as jb2.IMyst;
          const project = yml.project as jb2.IMystProject;

          let html_top = `<div class="jbook-toc" data-toc-dir="${configParent}">`;

          if (project.title) {
            html_top += `<p id="toc-title">${project.title}</p>`;
          }
          if (project.subtitle) {
            html_top += `<p id="toc-subtitle">${project.subtitle}</p>`
          }
          if (project.authors) {
            const authors = project.authors;
            if (authors.length == 1) {
              html_top += `<p id="toc-author">Author: `
            } else {
              html_top += `<p id="toc-author">Authors: `
            }
            authors.forEach((author, i) => {
              if (i < authors.length - 1) {
                html_top += `${author.name}, `
              } else {
                html_top += `${author.name}`
              }
            });
            html_top += `</p>`
          }
          if (project.github || project.license || project.doi) {
            html_top += `<div class=badges>`
          }
          if (project.github) {
            html_top += `
              <a href="https://github.com/${project.github}" target="_blank" rel="noopener">
                <img
                  src="https://img.shields.io/badge/GitHub-5c5c5c?logo=github"
                  alt="GitHub: ${project.github}"
                >
              </a>
            `
          }
          if (project.license) {
            html_top +=`
            <a href="https://opensource.org/licenses/${project.license}" target="_blank" rel="noopener">
              <img
                src="https://img.shields.io/badge/License-${project.license.replaceAll("-", "_")}--Clause-blue.svg"
                alt="License: ${project.license}"
              >
            </a>
            `
          }
          if (project.doi) {
            html_top += `
              <a href="https://doi.org/10.5281/zenodo.${project.doi}" target="_blank" rel="noopener">
                <img
                  src="https://img.shields.io/badge/DOI-10.5281%2Fzenodo.${project.doi}-blue.svg"
                  alt="DOI: 10.5281/zenodo.${project.doi}"
                >
              </a>
            `
          }
          if (project.github || project.license || project.doi) {
            html_top += `</div>`
          }
          html_top += `<br><hr class=toc-hr>`

          let toc_html = await jb2.mystTOCToHtml(project.toc, configParent);

          if (project.downloads) {
            {}
          }

          let html_bottom = `<br><hr class=toc-hr>`

          if (project.copyright) {
            html_bottom += `
              <p style="padding-left: 15px">Copyright © ${project.copyright}</p>
            `
          }

          return `
            ${html_top}
            <ul>${toc_html}</ul>
            ${html_bottom}
            </div>
              `;

        } else {
          console.error('Error: Misconfigured Jupyter Book _toc.yml.');
        }
      } catch (error) {
        console.error('Error reading or parsing _toc.yml:', error);
      }

    }
  }
  return `
    <p id="toc-title">Not a Jupyter-Book</p>
    <p id="toc-author">"_toc.yml" and/or "_config.yml" not found in or above:</p>
    <p id="toc-author">${cwd}</p>
    <p id="toc-author">Please navigate to a directory containing a Jupyter-Book to view its Table of Contents</p>
    `;
}
