import * as path from 'path';
import * as yaml from 'js-yaml';
import { getJupyterAppInstance } from './index';

import * as jbtoc from './jbtoc';

interface IFileMetadata {
  path: string;
}

interface IJbookConfig {
  title: string;
  author: string;
  logo: string;
}

export interface IToc {
  parts?: IPart[];
  chapters?: ISection[];
  caption?: string;
}

interface ISection {
  sections?: ISection[];
  file?: string;
  url?: string;
  title?: string;
  glob?: string;
}

interface IPart {
  caption: string;
  chapters: ISection[];
}

interface INotebook {
  cells: ICell[];
}

interface ICell {
  cell_type: 'markdown';
  metadata: { object: any };
  source: string;
}

function isNotebook(obj: any): obj is INotebook {
  return obj && typeof obj === 'object' && Array.isArray(obj.cells);
}

async function getTitle(filePath: string): Promise<string | null> {
  const suffix = path.extname(filePath);
  if (suffix === '.ipynb') {
    try {
      const jsonData: INotebook | string = await jbtoc.getFileContents(filePath);
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
      const md: INotebook | string = await jbtoc.getFileContents(filePath);
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

function isIJbookConfig(obj: any): obj is IJbookConfig {
  return obj && typeof obj === 'object' && obj.title && obj.author;
}

export async function getBookConfig(
  configPath: string
): Promise<{ title: string | null; author: string | null }> {
  try {
    const yamlStr = await jbtoc.getFileContents(configPath);
    if (typeof yamlStr === 'string') {
      const config: unknown = yaml.load(yamlStr);
      if (isIJbookConfig(config)) {
        const title = config.title || 'Untitled Jupyter Book';
        const author = config.author || 'Anonymous';
        return { title, author };
      } else {
        console.error('Error: Misconfigured Jupyter Book config.');
      }
    }
  } catch (error) {
    console.error('Error reading or parsing config:', error);
  }
  return { title: null, author: null };
}


async function globFiles(pattern: string): Promise<string[]> {
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

async function getFullPath(file_pattern: string, dir_pth: string) {
  const files = await jbtoc.ls(dir_pth);
  for (const value of Object.values(files.content)) {
    const file = value as IFileMetadata;
    if (file.path.includes(file_pattern)) {
      return file.path;
    }
  }
  return `Unable to locate ${file_pattern} in ${dir_pth}`;
}

async function getSubSection(
  parts: ISection[],
  cwd: string,
  level: number = 1,
  html: string = ''
): Promise<string> {
  if (cwd && cwd.slice(-1) !== '/') {
    cwd = cwd + '/';
  }

  async function insert_one_file(file: string) {
    const parts = file.split('/');
    parts.pop();
    const k_dir = parts.join('/');
    const pth = await getFullPath(file, `${cwd}${k_dir}`);
    let title = await getTitle(pth);
    if (!title) {
      title = file;
    }
    html += `<button class="jp-Button toc-button tb-level${level}" style="display: block;" data-file-path="${pth}">${title}</button>`;
  }
  for (const k of parts) {
    if (k.sections && k.file) {
      const parts = k.file.split('/');
      parts.pop();
      const k_dir = parts.join('/');
      const pth = await getFullPath(k.file, `${cwd}${k_dir}`);
      let title = await getTitle(pth);
      if (!title) {
        title = k.file;
      }
      html += `
        <div>
            <button class="jp-Button toc-button tb-level${level}"style="display: inline-block;" data-file-path="${pth}">${title}</button>
            <button class="jp-Button toc-chevron" style="display: inline-block;"><i class="fa fa-chevron-down "></i></button>
        </div>
        <div style="display: none;">
        `;
      const html_cur = html;
      html = await getSubSection(
        k.sections,
        cwd,
        (level = level + 1),
        (html = html_cur)
      );
      level = level - 1;
      html += '</div>';
    } else if (k.file) {
      await insert_one_file(k.file);
    } else if (k.url) {
      html += `<button class="jp-Button toc-button tb-level${level}" style="display:block;"><a class="toc-link tb-level${level}" href="${k.url}" target="_blank" rel="noopener noreferrer" style="display: block;">${k.title}</a></button>`;
    } else if (k.glob) {
      const files = await globFiles(`${cwd}${k.glob}`);
      for (const file of files) {
        const relative = file.replace(`${cwd}`, '');
        await insert_one_file(relative);
      }
    }
  }
  return html;
}

export async function tocToHtml(toc: IToc, cwd: string): Promise<string> {
  let html = '\n<ul>';
  if (toc.parts) {
    for (const chapter of toc.parts) {
      html += `\n<p class="caption" role="heading"><span class="caption-text"><b>\n${chapter.caption}\n</b></span>\n</p>`;
      const subISectionHtml = await getSubSection(chapter.chapters, cwd);
      html += `\n${subISectionHtml}`;
    }
  } else {
    if (toc.chapters) {
      const subISectionHtml = await getSubSection(toc.chapters, cwd);
      html += `\n${subISectionHtml}`;
    }
  }
  html += '\n</ul>';
  return html;
}