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
  level: number = 1,
  html: string = ''
): Promise<string> {
  if (cwd && cwd.slice(-1) !== '/') {
    cwd = cwd + '/';
  }

  async function insertFile(file: string, chevron: boolean = false) {
    const parts = file.split('/');
    parts.pop();
    const k_dir = parts.join('/');
    const pth = await jbtoc.getFullPath(file, `${cwd}${k_dir}`);
    let title = await jbtoc.getFileTitleFromHeader(pth);
    if (!title) {
      title = file;
    }
    if (chevron) {
      html += `
        <div style="display: flex; align-items: center;">
            <button class="jp-Button toc-button tb-level${level}"
                    style="display: inline-block; font-weight: bold"
                    data-file-path="${pth}">
              ${title}
            </button>
            <button class="jp-Button toc-chevron" style="display: inline-block;"><i class="fa fa-chevron-down "></i></button>
        </div>
        <div style="display: none;">
        `;
    } else {
      html += `<button class="jp-Button toc-button tb-level${level}" style="display: block;" data-file-path="${pth}">${title}</button>`;
    }
  }

  async function insertMystTitle(title: string) {
    html += `
    <div style="display: flex; align-items: center;">
        <p class="caption tb-level${level}" role="heading" style="margin: 0;">
        <span class="caption-text"><b>${title}</b></span></p>
        <button class="jp-Button toc-chevron" style="display: inline-block;"><i class="fa fa-chevron-down "></i></button>
    </div>
    <div style="display: none;">
    `;
  }

  for (const item of toc) {
    let file = '';
    if (item.file) {
      file = jbtoc.escapeHtml(String(item.file));
    }
    let title = '';
    if (item.title) {
      title = jbtoc.escapeHtml(String(item.title));
    }
    let url = '';
    if (item.url) {
      url = jbtoc.escapeHtml(String(item.url));
    }

    if ((item.title || item.file) && item.children) {
      // If there are a title, children, and a file, use the file path as the title
      if (item.file) {
        await insertFile(file, true);
      } else if (item.title) {
        insertMystTitle(title);
      }
      const html_cur = html;
      html = await mystTOCToHtml(
        item.children,
        cwd,
        (level = level + 1),
        (html = html_cur)
      );
      level = level - 1;
      html += '</div>';
    } else if (item.file) {
      await insertFile(file);
    } else if (item.url && item.title) {
      html += `<button class="jp-Button toc-button tb-level${level}" style="display:block;"><a class="toc-link tb-level${level}" 
      href="${url}" target="_blank" rel="noopener noreferrer" style="display: block;">${title}</a></button>`;
    } else if (item.glob) {
      const files = await jbtoc.globFiles(`${cwd}${item.glob}`);
      for (const file of files) {
        const relative = file.replace(`${cwd}`, '');
        await insertFile(relative);
      }
    }
  }
  return html;
}

export async function getHtmlTop(
  project: MystProject,
  configParent: string
): Promise<string> {
  let html_top = `<div class="jbook-toc" data-toc-dir="${configParent}">`;

  if (project.title) {
    html_top += `<p id="toc-title">${jbtoc.escapeHtml(String(project.title))}</p>`;
  }
  if (project.subtitle) {
    html_top += `<p id="toc-subtitle">${jbtoc.escapeHtml(String(project.subtitle))}</p>`;
  }
  html_top += '<br><hr class="toc-hr">';
  return html_top;
}

export async function getHtmlBottom(project: MystProject): Promise<string> {
  let html_bottom = '<br><hr class="toc-hr"><br>';

  if (project.authors) {
    const authors = project.authors;
    if (authors.length === 1) {
      html_bottom += '<p id="toc-author">Author: ';
    } else {
      html_bottom += '<p id="toc-author">Authors: ';
    }
    authors.forEach((author, i) => {
      if (i < authors.length - 1 && author.name) {
        html_bottom += `${jbtoc.escapeHtml(String(author.name))}, `;
      } else if (author.name) {
        html_bottom += `${jbtoc.escapeHtml(String(author.name))}`;
      }
    });
    html_bottom += '</p>';
  }

  if (project.github || project.license || project.doi) {
    html_bottom += '<div class="badges">';
  }
  if (project.github) {
    const github = jbtoc.escapeHtml(String(project.github));
    html_bottom += `
      <a href="https://github.com/${github}" target="_blank" rel="noopener">
        <img
          src="https://img.shields.io/badge/GitHub-5c5c5c?logo=github"
          alt="GitHub: ${github}"
        >
      </a>
    `;
  }
  if (project.license) {
    const license = jbtoc.escapeHtml(String(project.license));
    html_bottom += `
    <a href="https://opensource.org/licenses/${license}" target="_blank" rel="noopener">
      <img
        src="https://img.shields.io/badge/License-${license.replaceAll('-', '_')}--Clause-blue.svg"
        alt="License: ${license}"
      >
    </a>
    `;
  }
  if (project.doi) {
    const doi = jbtoc.escapeHtml(String(project.doi));
    html_bottom += `
      <a href="https://doi.org/10.5281/zenodo.${doi}" target="_blank" rel="noopener">
        <img
          src="https://img.shields.io/badge/DOI-10.5281%2Fzenodo.${doi}-blue.svg"
          alt="DOI: 10.5281/zenodo.${doi}"
        >
      </a>
    `;
  }
  if (project.github || project.license || project.doi) {
    html_bottom += '</div>';
  }
  if (project.copyright) {
    html_bottom += `
      <p style="padding-left: 15px">Copyright © ${jbtoc.escapeHtml(String(project.copyright))}</p>
    `;
  }
  return html_bottom;
}
