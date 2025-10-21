import { ServerConnection } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';

import * as yaml from 'js-yaml';
import { getJupyterAppInstance } from './index';

import * as jb1 from './jb1';
import * as jb2 from './jb2';

interface FileMetadata {
  path: string;
  name: string;
}

interface Notebook {
  cells: Cell[];
}

interface Cell {
  cell_type: 'markdown';
  metadata: { object: any };
  source: string;
}

export type TOCHTML = { html: string; paths: string[] };

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
    return await app.serviceManager.contents.get(pth, { content: true });
  } catch (error) {
    console.error('Error listing directory contents:', error);
    return null;
  }
}

export function escHtml(str: string): string {
  if (str === null) {
    return '';
  }
  const s = String(str);
  return s
    .replaceAll(/&/g, '&amp;')
    .replaceAll(/</g, '&lt;')
    .replaceAll(/>/g, '&gt;');
}

export function escAttr(str: string): string {
  if (str === null) {
    return '';
  }
  const s = String(str);
  return escHtml(s).replaceAll(/"/g, '&quot;').replaceAll(/'/g, '&#39;');
}

function encodePath(path: string) {
  return encodeURIComponent(path);
}
// Used to create placeholder tokens for titles on initial toc html generation.
// They will later be updated with titles effieicently retreived on the backend when possible.
export function htmlTok(path: string): string {
  return `[[TITLE_HTML::${encodePath(path)}]]`;
}
export function attrTok(path: string): string {
  return `[[TITLE_ATTR::${encodePath(path)}]]`;
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
        if (file.path.endsWith(configPattern)) {
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

export function normalize(p: string): string {
  return p.replace(/\\/g, '/').replace(/\/{2,}/g, '/');
}

export function extname(p: string): string {
  const match = /\.([^./\\]+)$/.exec(p);
  return match ? '.' + match[1] : '';
}

export function getFullPath(relFile: string, bookRoot: string): string {
  return normalize(
    (bookRoot.endsWith('/') ? bookRoot : bookRoot + '/') + relFile
  );
}

function isNotebook(obj: any): obj is Notebook {
  return obj && typeof obj === 'object' && Array.isArray(obj.cells);
}

export async function getFileTitleFromHeader(
  filePath: string
): Promise<string | null> {
  const suffix = extname(filePath);
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

let prettierModPromise:
  | Promise<typeof import('prettier/standalone')>
  | undefined;
let htmlPluginPromise: Promise<any> | undefined;

export async function formatHtmlForDev(html: string): Promise<string> {
  if (process.env.NODE_ENV !== 'development') {
    return html;
  }

  prettierModPromise ??= import('prettier/standalone').catch(err => {
    prettierModPromise = undefined;
    throw err;
  });

  htmlPluginPromise ??= import('prettier/plugins/html')
    .then(m => (m as any).default ?? m)
    .catch(err => {
      htmlPluginPromise = undefined;
      throw err;
    });

  const [prettierMod, htmlPlugin] = await Promise.all([
    prettierModPromise,
    htmlPluginPromise
  ]);

  const prettier: any = (prettierMod as any).default ?? prettierMod;
  const parserHtml = (htmlPlugin as any).default ?? htmlPlugin;

  return await prettier.format(html, {
    parser: 'html',
    plugins: [parserHtml]
  });
}

function replaceAll(haystack: string, needle: string, replacement: string) {
  return haystack.split(needle).join(replacement);
}

function stem(path: string) {
  const base = path.split('/').pop() ?? path;
  return base.replace(/\.[^.]+$/, '');
}

export async function fetchTitlesBackend(
  paths: string[]
): Promise<Record<string, { title: string; last_modified?: string }>> {
  const settings = ServerConnection.makeSettings();
  const url = URLExt.join(settings.baseUrl, 'jbtoc', 'titles');
  const resp = await ServerConnection.makeRequest(
    url,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paths })
    },
    settings
  );

  if (!resp.ok) {
    throw new Error(`${resp.status} ${resp.statusText}`);
  }

  const data = (await resp.json()) as {
    titles: Record<string, { title?: string; last_modified?: string }>;
  };

  const out: Record<string, { title: string; last_modified?: string }> = {};
  for (const [p, v] of Object.entries(data.titles)) {
    if (v?.title) {
      out[p] = { title: v.title, last_modified: v.last_modified };
    }
  }
  return out;
}

async function fetchTitlesFrontend(paths: string[]) {
  const out: Record<string, { title: string }> = {};
  for (const p of paths) {
    try {
      let t = await getFileTitleFromHeader(String(p));
      if (!t) {
        t = stem(p);
      }
      out[p] = { title: String(t) };
    } catch {
      out[p] = { title: stem(p) };
    }
  }
  return out;
}

function applyTitles(
  html: string,
  titleMap: Record<string, { title: string }>
) {
  for (const [path, { title }] of Object.entries(titleMap)) {
    const safeHtml = escHtml(String(title));
    const safeAttr = escAttr(String(title));
    html = replaceAll(html, htmlTok(path), safeHtml);
    html = replaceAll(html, attrTok(path), safeAttr);
  }
  return html;
}

export async function getTOC(cwd: string): Promise<string> {
  const tocPath = await findConfigInParents(cwd);
  let configPath = null;
  let configParent = null;
  let html: string | undefined | Error | any;
  if (tocPath) {
    const myst = tocPath.endsWith('myst.yml');
    const parts = tocPath.split('/');

    parts.pop();
    configParent = parts.join('/');

    if (!myst) {
      const files = await ls(configParent);
      const configPattern = '_config.yml';
      for (const value of Object.values(files.content)) {
        const file = value as FileMetadata;
        if (file.name === configPattern) {
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
            <p id="toc-title">${escHtml(String(config.title))}</p>
            <p id="toc-author">Author: ${escHtml(String(config.author))}</p>
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

          const { html: tocHtmlRaw, paths } = await jb2.mystTOCToHtml(
            project.toc,
            configParent
          );
          let map: Record<string, { title: string; last_modified?: string }>;
          try {
            map = await fetchTitlesBackend(paths);
          } catch {
            map = await fetchTitlesFrontend(paths);
          }
          const toc_html = applyTitles(tocHtmlRaw, map);

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
  } else {
    html = `
      <p id="toc-title">Not a Jupyter-Book</p>
      <p id="toc-author">Could not find a "_toc.yml", "_config.yml", or "myst.yml in or above the current directory:</p>
      <p id="toc-author">${cwd}</p>
      <p id="toc-author">Please navigate to a Jupyter-Book directory to view its Table of Contents</p>
      `;
  }

  if (typeof html === 'string') {
    html = await formatHtmlForDev(html); // no-op in prod
    console.debug(html);
    return html;
  } else {
    let errMsg = '';
    try {
      errMsg = JSON.stringify(html, null, 2);
    } catch {
      errMsg = String(html);
    }
    const stack =
      (html instanceof Error && html.stack) ||
      (typeof html === 'object' && 'stack' in (html ?? {}))
        ? (html as any).stack
        : '';

    const escaped = escHtml(errMsg + (stack ? `\n\n${stack}` : ''));

    return `
      <div class="jbook-toc-error" style="color: red; font-family: monospace; white-space: pre-wrap; padding: 1em;">
        <b>⚠️ TOC generation error:</b>
        <hr>
        ${escaped}
      </div>
    `;
  }
}
