import { ServerConnection } from '@jupyterlab/services';
import type { Contents } from '@jupyterlab/services';
import { URLExt } from '@jupyterlab/coreutils';
import picomatch from 'picomatch';

import * as yaml from 'js-yaml';
import { getJupyterAppInstance } from './index';

import * as jb1 from './jb1';
import * as jb2 from './jb2';
import type { JBook1TOC } from './jb1';
import type { MystProject } from './jb2';
import type { Myst } from './jb2';

// dependency bag makes non-exported functions and imports mockable for unit tests
export const deps = {
  findConfigInParents,
  getFileContents,
  applyTitles,
  fetchTitlesBackend,
  fetchTitlesFrontend,
  yamlLoad: yaml.load,
  ls,
  jb1,
  jb2
};

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

/**
 * Retreives the contents of a Jupyter Notebook or Markdown doc
 * using the Jupyter serviceManager
 * @param path - string path to a Jupyter Notebook or markdown doc
 * @returns - The contents of the notebook or markdown doc
 * @throws - If the filetype is not 'notebook' or 'file'
 * @throws - If file contents cannot be retreived for any other reason
 */
export async function getFileContents(
  path: string
): Promise<Notebook | string> {
  try {
    const app = getJupyterAppInstance();
    const data = await app.serviceManager.contents.get(path, { content: true });
    if (data.type === 'notebook' || data.type === 'file') {
      return data.content;
    } else {
      throw new Error(`Unsupported file type: ${data.type}`);
    }
  } catch (error) {
    console.error(`Failed to get file contents for ${path}:`, error);
    throw error;
  }
}

/**
 * Retreives the contents of a directory using the Jupyter serviceManager
 * @param path - String path to a directory
 * @returns - The contents of the directory
 * @throws - If contents cannot be retreived
 */
export async function ls(path: string): Promise<any> {
  if (path === '') {
    path = '/';
  }

  try {
    const app = getJupyterAppInstance();
    return await app.serviceManager.contents.get(path, { content: true });
  } catch (error) {
    console.error('Error listing directory contents:', error);
    return null;
  }
}

/**
 * Escapes HTML text content (not HTML attributes)
 * @param str - String to escape
 * @returns Escaped string
 */
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

/**
 * Escapes HTML attributes
 * @param str - String to escape
 * @returns Escaped string
 */
export function escAttr(str: string): string {
  if (str === null) {
    return '';
  }
  const s = String(str);
  return escHtml(s).replaceAll(/"/g, '&quot;').replaceAll(/'/g, '&#39;');
}

/**
 * URL encodes a path with encodeURIComponent
 * This wrapper exists to allow us to change the encoding
 * method accross all scripts in one place, if ever needed
 * @param path - String path to encode
 * @returns Encoded path
 */
function encodePath(path: string) {
  return encodeURIComponent(path);
}

/**
 * Creates a TOC title placeholder token to be inserted in the TOC HTML.
 * It includes the path to the file and will be replaced
 * with a title after retreival, which may occur server-side.
 * @param path - String path to a file
 * @returns placeholder for the file's title
 */
export function htmlTok(path: string): string {
  return `[[TITLE_HTML::${encodePath(path)}]]`;
}

/**
 * Creates a TOC title attribute placeholder token to be inserted in the TOC HTML.
 * It includes the path to the file and will be replaced
 * with a title after retreival, which may occur server-side.
 * @param path - String path to a file
 * @returns placeholder for the file's title
 */
export function attrTok(path: string): string {
  return `[[TITLE_ATTR::${encodePath(path)}]]`;
}

/**
 * Searches cwd and its parents until it finds a Jupyter Book 1 or 2 config file
 * This allows the TOC to be discovered if a user is in a subdirectory of a Jupyter Book
 * @param cwd : String path to the current working directory
 * @returns The path to a config file or null
 */
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

/**
 * Normalizes file system paths (not URLs):
 * converts backslashes to forward slashes and removes duplicate slashes
 * @param path - String path to normalize
 * @returns Normalized path
 */
export function normalize(path: string): string {
  return path.replace(/\\/g, '/').replace(/\/+/g, '/');
}

/**
 * Gets the suffix of a file path
 * @param path
 * @returns The file suffix, prepended with '.'
 */
export function getFileSuffix(path: string): string {
  const match = /\.([^./\\]+)$/.exec(path);
  return match ? '.' + match[1] : '';
}

/**
 * Concatenates a relative path to its root, and normalizes result
 * @param relPath - String relative path
 * @param rootPath - String root path
 * @returns Normalized concatenation of rootPath + relPath
 */
export function concatPath(relPath: string, rootPath: string): string {
  return normalize(
    (rootPath.endsWith('/') ? rootPath : rootPath + '/') + relPath
  );
}

/**
 * Checks if an object is a Notebook interface
 * @param obj - The object to check
 * @returns true if the object is a Notebook interface
 */
function isNotebook(obj: any): obj is Notebook {
  return obj && typeof obj === 'object' && Array.isArray(obj.cells);
}

/**
 * Concatenates a string array into a single string.
 * @param src - a string or an array of strings
 * @returns the string or a joined array string
 */
function joinStringArray(src: string | string[]): string {
  return Array.isArray(src) ? src.join('') : src;
}

/**
 * Retreives a notebook or markdown doc's TOC title
 * from the first markdown header (any level) contained in the file
 * @param path - String path to notebook or markdown doc
 * @returns The first header found in the file or null
 */
export async function getFileTitleFromHeader(
  path: string
): Promise<string | null> {
  const atx = /^(#{1,6})\s+(.+?)\s*#*\s*$/;
  const suffix = getFileSuffix(path);
  if (suffix === '.ipynb') {
    try {
      const jsonData: Notebook | string = await getFileContents(path);
      if (isNotebook(jsonData)) {
        // Scan markdown cells in order; return the first header line found
        for (const cell of jsonData.cells) {
          if (cell.cell_type !== 'markdown') {
            continue;
          }
          const src = joinStringArray(cell.source);
          for (const line of src.split('\n')) {
            const m = line.match(atx);
            if (m) {
              return m[2];
            }
          }
        }
      }
    } catch (error) {
      console.error('Error reading or parsing notebook:', error);
    }
  } else if (suffix === '.md') {
    try {
      const md: Notebook | string = await getFileContents(path);
      if (!isNotebook(md)) {
        for (const line of (md as string).split('\n')) {
          const m = line.match(atx);
          if (m) {
            return m[2];
          }
        }
      }
    } catch (error) {
      console.error('Error reading or parsing Markdown:', error);
    }
  }
  return null;
}

/**
 * Checks if glob string includes only the current working directory.
 * Used to determine whether to use a shallow or deep search when globbing.
 * @param globString - The glob string
 * @returns true if globbing only inside cwd
 */
function isSimpleBasenameGlob(globString: string): boolean {
  // allow * ? [] {} etc., but not ** or any path separator
  return !globString.includes('**') && !/[\\/]/.test(globString);
}

/**
 * Globs for files with a wildcard glob string
 * @param globString - A glob string
 * @returns A list of path matching the glob pattern
 */
export async function globFiles(globString: string): Promise<string[]> {
  const { serviceManager } = getJupyterAppInstance();
  const contents = serviceManager.contents;

  // if no glob chars, fetch directly
  const globChars = /[*?[\]{}()!+@]/;
  if (!globChars.test(globString)) {
    try {
      const model = await contents.get(globString, { content: false });
      if (model.type === 'file') {
        return [normalize(model.path)];
      }
    } catch {
      return [];
    }
  }

  const scan = picomatch.scan(globString);
  const start = normalize(scan.base ?? '');
  const shallow = isSimpleBasenameGlob(globString);

  const isMatch = picomatch(globString, { basename: shallow, dot: true });

  const out: string[] = [];

  // Shallow search
  async function listOnce(dir: string): Promise<void> {
    const model = await contents.get(dir || '', { content: true });
    if (model.type !== 'directory' || !Array.isArray(model.content)) {
      return;
    }

    for (const entry of model.content as Contents.IModel[]) {
      if (entry.type !== 'file') {
        continue;
      }
      const name = entry.name ?? entry.path.split('/').pop() ?? '';
      if (isMatch(name)) {
        out.push(normalize(entry.path));
      }
    }
  }

  // Recursive search
  async function walk(path: string): Promise<void> {
    const model = await contents.get(path || '', { content: true });

    if (model.type === 'directory' && Array.isArray(model.content)) {
      for (const entry of model.content as Contents.IModel[]) {
        if (entry.type === 'directory') {
          await walk(entry.path);
        } else if (entry.type === 'file' || entry.type === 'notebook') {
          const p = normalize(entry.path);
          if (isMatch(p)) {
            out.push(p);
          }
        }
      }
    } else if (model.type === 'file' || model.type === 'notebook') {
      const p = normalize(model.path);
      if (isMatch(p)) {
        out.push(p);
      }
    }
  }

  if (shallow) {
    await listOnce(start);
  } else {
    await walk(start || '');
  }

  return out;
}

/**
 * Replaces all instances of a substring with another substring
 * @param myString - The string containing substrings to replace
 * @param target - The substring to replace
 * @param replacement - The string to replace target with
 * @returns myString with all instances of target swapped with the replacement string
 */
function replaceAll(myString: string, target: string, replacement: string) {
  return myString.split(target).join(replacement);
}

/**
 * Retreives a filename from the end of a path, including the file suffix
 * @param path - String path to a file
 * @returns - The filename
 */
function getFilename(path: string) {
  return path.split('/').pop() ?? path;
}

/**
 * Passes a list of paths to the 'jb_toc' backend server extension,
 * which responds with a mapping of paths to titles
 * @param paths - list of string paths for which to fetch titles
 * @returns a Record mapping each path to its title
 */
async function fetchTitlesBackend(
  paths: string[]
): Promise<Record<string, string>> {
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
    titles: Record<string, string>;
  };

  const out: Record<string, string> = {};
  for (const [p, v] of Object.entries(data.titles)) {
    out[p] = v;
  }
  return out;
}

/**
 * Calls getFileTitleFromHeader on every path in a list and outputs
 * a Record mapping of paths to titles. This is the frontend backup
 * for retreiving titles when a Jupyter Server is not available.
 * It supports JupyterLite but runs slowly on a Jupyter Hub.
 * @param paths - list of string paths for which to fetch titles
 * @returns a Record mapping each path to its title
 */
async function fetchTitlesFrontend(paths: string[]) {
  const out: Record<string, string> = {};
  for (const p of paths) {
    try {
      let t = await getFileTitleFromHeader(String(p));
      if (!t) {
        t = getFilename(p);
      }
      out[p] = String(t);
    } catch {
      out[p] = getFilename(p);
    }
  }
  return out;
}

/**
 * Replaces all title placeholder text and attributes in the TOC HTML
 * with their real titles or fallback filename
 * @param html - String HTML of the TOC with placeholder titles
 * @param titleMap - The Record mapping file paths to titles
 * @returns The TOC HTML in which placeholder titles have been replaced
 */
function applyTitles(html: string, titleMap: Record<string, string>) {
  for (const [path, title] of Object.entries(titleMap)) {
    const safeHtml = escHtml(String(title));
    const safeAttr = escAttr(String(title));
    html = replaceAll(html, htmlTok(path), safeHtml);
    html = replaceAll(html, attrTok(path), safeAttr);
  }
  return html;
}

/**
 * If inside of a Jupyter Book (v1 or v2), creates the TOC HTML for the
 * jb-toc-frontend extension to display
 * @param cwd - The current working directory of the Jupyter fileBrowser
 * @returns - The TOC HTML or an HTML error message indicating that either the
 *            user is not in a Jupyter Book or the TOC config is malformed
 */
export async function getTOC(cwd: string): Promise<string> {
  const tocPath = await deps.findConfigInParents(cwd);
  let configPath = null;
  let configParent = null;
  let html: string | undefined | Error | any;
  if (tocPath) {
    const myst = tocPath.endsWith('myst.yml');
    const parts = tocPath.split('/');

    parts.pop();
    configParent = parts.join('/');

    if (!myst) {
      const files = await deps.ls(configParent);
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
        const tocYamlStr = await deps.getFileContents(tocPath);
        if (typeof tocYamlStr === 'string') {
          const tocYaml: unknown = deps.yamlLoad(tocYamlStr);
          const toc = tocYaml as JBook1TOC;
          const config = await deps.jb1.getJBook1Config(configPath);

          const { html: tocHtmlRaw, paths } = await deps.jb1.jBook1TOCToHtml(
            toc,
            configParent
          );
          let map: Record<string, string>;
          try {
            map = await deps.fetchTitlesBackend(paths);
          } catch {
            map = await deps.fetchTitlesFrontend(paths);
          }
          const toc_html = deps.applyTitles(tocHtmlRaw, map);
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
          const mystYaml: unknown = deps.yamlLoad(mystYAMLStr);
          const yml = mystYaml as Myst;
          const project = yml.project as MystProject;

          const html_top = await deps.jb2.getHtmlTop(project, configParent);

          const { html: tocHtmlRaw, paths } = await deps.jb2.mystTOCToHtml(
            project.toc,
            configParent
          );
          let map: Record<string, string>;
          try {
            map = await deps.fetchTitlesBackend(paths);
          } catch {
            map = await deps.fetchTitlesFrontend(paths);
          }
          const toc_html = deps.applyTitles(tocHtmlRaw, map);

          const html_bottom = await deps.jb2.getHtmlBottom(project);

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
      <p id="toc-author">${escHtml(cwd)}</p>
      <p id="toc-author">Please navigate to a Jupyter-Book directory to view its Table of Contents</p>
      `;
  }

  if (typeof html === 'string') {
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
