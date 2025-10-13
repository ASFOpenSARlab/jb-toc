import * as jbtoc from './jbtoc';
export interface Myst {
  project?: MystProject;
}

export interface MystProject {
  title?: string;
  subtitle?: string;
  authors?: MystAuthors[];
  doi?: string;
  github?: string;
  license?: string;
  copyright?: string;
  toc: MystTOC[];
}

interface MystAuthors {
  name?: string;
}

export interface MystTOC {
  file?: string;
  title?: string;
  children?: MystTOC[];
  url?: string;
  glob?: string;
}

export async function mystTOCToHtml(
  toc: MystTOC[],
  cwd: string,
  level: number = 1
): Promise<string> {
  async function insertFile(file: string, chevron: boolean = false) {
    const parts = file.split('/');
    parts.pop();
    const k_dir = parts.join('/');
    let pth = await jbtoc.getFullPath(file, `${cwd}${k_dir}`);
    pth = jbtoc.escAttr(String(pth));
    let title = await jbtoc.getFileTitleFromHeader(pth);
    title = jbtoc.escHtml(String(title));
    const sectionId = `sec-${Math.random().toString(36).slice(2)}`;

    if (!title) {
      title = file;
    }
    let file_html;
    if (chevron) {
      file_html = `<div class="toc-row">
        <button
          type="button"
          class="jp-Button toc-button tb-level${level} toc-file"
          data-file-path="${pth}"
          aria-label="Open ${title}"
        ><b>${title}</b></button>

        <button
          type="button"
          class="jp-Button toc-chevron"
          aria-expanded="false"
          aria-controls="${sectionId}"
          aria-label="Toggle section for ${title}"
        ><i class="fa fa-chevron-down"></i></button>
      </div>
      <div id="${sectionId}" class="toc-children" hidden>
    `;
    } else {
      file_html = `<button
        class="jp-Button toc-button tb-level${level}"
        data-file-path="${pth}"
        aria-label="Open ${title}"
      >
        ${title}
      </button>`;
    }
    return file_html;
  }

  async function insertMystTitle(title: string) {
    const sectionId = `sec-${Math.random().toString(36).slice(2)}`;

    return `
      <div class="toc-row">
        <p class="caption tb-level${level}" role="heading" aria-level="${level}">
          <b>${title}</b>
        </p>
        <button
          type="button"
          class="jp-Button toc-chevron"
          aria-expanded="false"
          aria-controls="${sectionId}"
          aria-label="Toggle section for ${title}"
        ><i class="fa fa-chevron-down"></i>
        </button>
      </div>
      <div id="${sectionId}" class="toc-children" hidden>
    `;
  }

  async function insertUrl(title: string, url: string) {
    return `
    <div class="toc-row">
      <a
        class="jp-Button toc-button toc-link tb-level${level}"
        href="${url}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open external link to ${title}"
      >
        ${title}
      </a>
    </div>
    `;
  }

  if (cwd && cwd.slice(-1) !== '/') {
    cwd = cwd + '/';
  }

  const html_snippets: string[] = [];
  for (const item of toc) {
    const file = item.file ? jbtoc.escAttr(encodeURI(String(item.file))) : '';
    const title = item.title ? jbtoc.escHtml(String(item.title)) : '';
    const url = item.url ? jbtoc.escAttr(encodeURI(String(item.url))) : '';

    if ((item.title || item.file) && item.children) {
      if (item.file) {
        html_snippets.push(await insertFile(file, true));
      } else if (item.title) {
        html_snippets.push(await insertMystTitle(title));
      }
      html_snippets.push(await mystTOCToHtml(item.children, cwd, level + 1));
      html_snippets.push('</div>');
    } else if (item.file) {
      html_snippets.push(await insertFile(file));
    } else if (item.url && item.title) {
      html_snippets.push(await insertUrl(title, url));
    } else if (item.glob) {
      const files = await jbtoc.globFiles(`${cwd}${item.glob}`);
      for (const file of files) {
        const relative = file.replace(`${cwd}`, '');
        html_snippets.push(await insertFile(relative));
      }
    }
  }
  return html_snippets.join('');
}

export async function getHtmlTop(
  project: MystProject,
  configParent: string
): Promise<string> {
  let html_top = `<div class="jbook-toc" data-toc-dir="${configParent}">`;

  if (project.title) {
    html_top += `<p id="toc-title">${jbtoc.escHtml(String(project.title))}</p>`;
  }
  if (project.subtitle) {
    html_top += `<p id="toc-subtitle">${jbtoc.escHtml(String(project.subtitle))}</p>`;
  }
  html_top += '<br><hr class="toc-hr">';
  return html_top;
}

export async function getHtmlBottom(project: MystProject): Promise<string> {
  function getDOIUrl(doi: string) {
    if (!doi) {
      return '';
    }

    doi = String(doi).trim();
    const match = doi.match(/10\.\S+/);
    if (match) {
      doi = match[0];
    }

    const doiUrl = `https://doi.org/${doi}`;
    const encoded = encodeURIComponent(doi);

    return `
  <a
    href="${doiUrl}"
    target="_blank"
    rel="noopener noreferrer"
    class="toc-link badge-link"
    aria-label="Open DOI ${doi} (opens in a new tab)"
  >
    <img
      src="https://img.shields.io/static/v1?label=DOI&message=${encoded}&color=0A84FF"
      alt="DOI: ${doi}"
      loading="lazy"
    >
  </a>`;
  }

  let html_bottom = '<br><hr class="toc-hr"><br>';

  if (Array.isArray(project.authors) && project.authors.length) {
    const names = project.authors
      .filter(a => a && a.name)
      .map(a => jbtoc.escHtml(String(a.name)));

    if (names.length) {
      const label = names.length === 1 ? 'Author:' : 'Authors:';
      html_bottom += `<p id="toc-author">${label} ${names.join(', ')}</p>`;
    }
  }

  if (project.github || project.license || project.doi) {
    html_bottom += '<div class="badges">';
  }

  if (project.github) {
    const github = jbtoc.escAttr(encodeURI(String(project.github)));
    html_bottom += `
      <a
        href="https://github.com/${github}"
        target="_blank"
        rel="noopener noreferrer"
        class="toc-link github-link"
        aria-label="Open GitHub repository ${github} (opens in a new tab)"
      >
        <img
          src="https://img.shields.io/badge/GitHub-5c5c5c?logo=github"
          alt="GitHub badge for ${github}"
          loading="lazy"
        >
      </a>   
    `;
  }

  if (project.license) {
    const license = String(project.license);
    html_bottom += `
      <a
        href="https://opensource.org/licenses/${license}"
        target="_blank"
        rel="noopener noreferrer"
        class="toc-link badge-link"
        aria-label="Open ${license} license text (opens in a new tab)"
      >
        <img
          src="https://img.shields.io/static/v1?label=License&message=${encodeURIComponent(license)}&color=0A84FF"
          alt="License: ${license}"
          loading="lazy"
        >
      </a>
    `;
  }

  if (project.doi) {
    html_bottom += getDOIUrl(project.doi);
  }

  if (project.github || project.license || project.doi) {
    html_bottom += '</div>';
  }

  if (project.copyright) {
    html_bottom += `
      <p style="padding-left: 15px">Copyright © ${jbtoc.escHtml(String(project.copyright))}</p>
    `;
  }
  return html_bottom;
}
