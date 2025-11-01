import * as yaml from 'js-yaml';

import * as jbtoc from './jbtoc';

interface JBook1Config {
  title: string;
  author: string;
}

export interface JBook1TOC {
  parts?: Part[];
  chapters?: Section[];
  caption?: string;
}

interface Section {
  sections?: Section[];
  file?: string;
  url?: string;
  title?: string;
  glob?: string;
}

interface Part {
  caption: string;
  chapters: Section[];
}

/**
 * Checks if an object meets the criteria to be a JBook1Config object
 * @param obj An object to check
 * @returns true if object has a string author and title
 */
function isJBook1Config(obj: any): obj is JBook1Config {
  return (
    obj &&
    typeof obj === 'object' &&
    typeof obj.title === 'string' &&
    typeof obj.author === 'string'
  );
}

/**
 * Reads the title and author from a _config.yml and returns them in a dictionary.
 * Supplies placeholders if a value is empty.
 * @param configPath - String path to the _config.yml
 * @returns a mapping of title and author to their values or placeholders
 */
export async function getJBook1Config(
  configPath: string
): Promise<{ title: string | null; author: string | null }> {
  try {
    const yamlStr = await jbtoc.getFileContents(configPath);
    if (typeof yamlStr === 'string') {
      const config: unknown = yaml.load(yamlStr);
      if (isJBook1Config(config)) {
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

/**
 * Creates the TOC chapter structure, adding placeholder titles and lists of paths
 * for title retreival.
 * @param parts - A Section object
 * @param cwd - String path of the current working directory
 * of the Jupyter FileBrowser
 * @param level - The current level of indentation. This is
 * incremented recursivly and should not be set explicitly when
 * called by another client.
 * @returns A TOCHTML object for a chapter subsection containing HTML with
 * title placeholders and a list of paths, which will be used for looking up titles
 */
async function getSubSection(
  parts: Section[],
  cwd: string,
  level: number = 1
): Promise<jbtoc.TOCHTML> {
  if (cwd && cwd.slice(-1) !== '/') {
    cwd = cwd + '/';
  }

  /**
   * Provide the TOC button for a file with a placeholder title
   * @param file - String path to a file to insert
   * @returns TOC button for a file with a placeholder title
   */
  async function insertFile(file: string) {
    const pth = jbtoc.concatPath(file, `${cwd}`);
    if (typeof pth === 'string') {
      pathsSet.add(jbtoc.normalize(pth));
    }
    let tHTML;
    if (typeof pth === 'string') {
      tHTML = jbtoc.htmlTok(pth);
    }
    return `<button class="jp-Button toc-button tb-level${level}" data-file-path="${jbtoc.escAttr(encodeURI(String(pth)))}">${tHTML}</button>`;
  }

  const pathsSet = new Set<string>();
  const html_snippets: string[] = [];
  for (const k of parts) {
    if (k.sections && k.file) {
      const parts = k.file.split('/');
      parts.pop();
      const k_dir = parts.join('/');
      const pth = jbtoc.concatPath(k.file, `${cwd}${k_dir}`);
      let title;
      if (typeof pth === 'string') {
        title = await jbtoc.getFileTitleFromHeader(pth);
      }
      if (!title) {
        title = k.file;
      }
      title = jbtoc.escHtml(String(title));
      html_snippets.push(`
        <div class="toc-row">
            <button type="button" class="jp-Button toc-button 
              tb-level${level}" 
              data-file-path="${jbtoc.escAttr(encodeURI(String(pth)))}"
              >${jbtoc.escHtml(String(title))}</button>
            <button type="button" class="jp-Button toc-chevron"><i class="fa fa-chevron-down "></i></button>
        </div>
        <div class="toc-children" hidden>
        `);
      const children = await getSubSection(
        k.sections,
        cwd,
        (level = level + 1)
      );
      children.paths.forEach(p => pathsSet.add(p));
      html_snippets.push(children.html);
      level = level - 1;
      html_snippets.push('</div>');
    } else if (k.file) {
      html_snippets.push(await insertFile(k.file));
    } else if (k.url) {
      const url = String(jbtoc.escAttr(encodeURI(k.url)));
      html_snippets.push(`<button class="jp-Button toc-button toc-link tb-level${level}">
        <a class="toc-link tb-level${level}" 
        href="${jbtoc.escAttr(encodeURI(String(url)))}" 
        target="_blank" 
        rel="noopener noreferrer" 
        >${jbtoc.escHtml(String(k.title))}</a></button>`);
    } else if (k.glob) {
      const files = await jbtoc.globFiles(`${cwd}${k.glob}`);
      for (const file of files) {
        const relative = file.replace(`${cwd}`, '');
        html_snippets.push(await insertFile(relative));
      }
    }
  }
  return { html: html_snippets.join(''), paths: Array.from(pathsSet) };
}

/**
 * Provides a list of paths to files whose titles need to be
 * retreived, and the HTML for the chapter structure of the
 * TOC with placeholder titles. It does not add the Book
 * title, authors, or other book metadata.
 * @param toc - A JBook1TOC object
 * @param cwd - String path of the current working directory
 * of the Jupyter FileBrowser
 * @returns A TOCHTML object containing TOC HTML with title placeholders
 * and a list of paths, which will be used for looking up titles
 */
export async function jBook1TOCToHtml(
  toc: JBook1TOC,
  cwd: string
): Promise<jbtoc.TOCHTML> {
  const pathsSet = new Set<string>();

  const html_snippets: string[] = [];
  html_snippets.push('\n<ul>');
  if (toc.parts) {
    for (const chapter of toc.parts) {
      html_snippets.push(
        `\n<p class="caption" role="heading"><span class="caption-text"><b>\n${jbtoc.escHtml(String(chapter.caption))}\n</b></span>\n</p>`
      );
      const subSectionHtml = await getSubSection(chapter.chapters, cwd);
      html_snippets.push(`\n${subSectionHtml.html}`);
      subSectionHtml.paths.forEach(p => pathsSet.add(p));
    }
  } else {
    if (toc.chapters) {
      const subSectionHtml = await getSubSection(toc.chapters, cwd);
      html_snippets.push(`\n${subSectionHtml}`);
      subSectionHtml.paths.forEach(p => pathsSet.add(p));
    }
  }
  html_snippets.push('\n</ul>');
  return { html: html_snippets.join(''), paths: Array.from(pathsSet) };
}
