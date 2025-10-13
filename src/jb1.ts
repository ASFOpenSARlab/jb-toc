import * as yaml from 'js-yaml';

import * as jbtoc from './jbtoc';

interface JBook1Config {
  title: string;
  author: string;
  logo: string;
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

function isJBook1Config(obj: any): obj is JBook1Config {
  return obj && typeof obj === 'object' && obj.title && obj.author;
}

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

async function getSubSection(
  parts: Section[],
  cwd: string,
  level: number = 1,
  html: string = ''
): Promise<string> {
  if (cwd && cwd.slice(-1) !== '/') {
    cwd = cwd + '/';
  }

  async function insertFile(file: string) {
    const parts = file.split('/');
    parts.pop();
    const k_dir = parts.join('/');
    const pth = await jbtoc.getFullPath(file, `${cwd}${k_dir}`);
    let title;
    if (typeof(pth) === 'string') {
      title = await jbtoc.getFileTitleFromHeader(pth);
    }
    if (!title) {
      title = file;
    }
    html += `<button class="jp-Button toc-button tb-level${level}" style="display: block;" data-file-path="${jbtoc.escAttr(encodeURI(String(pth)))}">${jbtoc.escHtml(String(title))}</button>`;
  }
  for (const k of parts) {
    if (k.sections && k.file) {
      const parts = k.file.split('/');
      parts.pop();
      const k_dir = parts.join('/');
      const pth = await jbtoc.getFullPath(k.file, `${cwd}${k_dir}`);
      let title;
      if (typeof(pth) === 'string') {
        title = await jbtoc.getFileTitleFromHeader(pth);
      }
      if (!title) {
        title = k.file;
      }
      title = jbtoc.escHtml(String(title));
      html += `
        <div>
            <button class="jp-Button toc-button 
              tb-level${level}"style="display: inline-block;" 
              data-file-path="${jbtoc.escAttr(encodeURI(String(pth)))}"
              >${jbtoc.escHtml(String(title))}</button>
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
      await insertFile(k.file);
    } else if (k.url) {
      const url = String(jbtoc.escAttr(encodeURI(k.url)));
      html += `<button class="jp-Button toc-button tb-level${level}" style="display:block;">
        <a class="toc-link tb-level${level}" 
        href="${jbtoc.escAttr(encodeURI(String(url)))}" 
        target="_blank" 
        rel="noopener noreferrer" 
        style="display: block;"
        >${jbtoc.escHtml(String(k.title))}</a></button>`;
    } else if (k.glob) {
      const files = await jbtoc.globFiles(`${cwd}${k.glob}`);
      for (const file of files) {
        const relative = file.replace(`${cwd}`, '');
        await insertFile(relative);
      }
    }
  }
  return html;
}

export async function jBook1TOCToHtml(
  toc: JBook1TOC,
  cwd: string
): Promise<string> {
  let html = '\n<ul>';
  if (toc.parts) {
    for (const chapter of toc.parts) {
      html += `\n<p class="caption" role="heading"><span class="caption-text"><b>\n${jbtoc.escHtml(String(chapter.caption))}\n</b></span>\n</p>`;
      const subSectionHtml = await getSubSection(chapter.chapters, cwd);
      html += `\n${subSectionHtml}`;
    }
  } else {
    if (toc.chapters) {
      const subSectionHtml = await getSubSection(toc.chapters, cwd);
      html += `\n${subSectionHtml}`;
    }
  }
  html += '\n</ul>';
  return html;
}
