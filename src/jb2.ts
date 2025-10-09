// import * as path from 'path';
// import * as yaml from 'js-yaml';
// import { getJupyterAppInstance } from './index';

import * as jbtoc from './jbtoc';
export interface IMyst {
  project?: IMystProject;
}

export interface IMystProject {
  title?: string;
  subtitle?: string;
  short_title?: string;
  description?: string;
  downloads?: IMystDownload[];
  authors?: IMystAuthors[];
  reviewers?: string[];
  editors?: string[];
  affliliations?: string[];
  doi?: string;
  github?: string;
  license?: string;
  copyright?: string;
  social?: string
  toc: IMystTOC[];
}

interface IMystAuthors {
    name?: string;
}

interface IMystDownload {
  file?: string;
  title?: string;
  url?: string;
  filename?: string;
}

export interface IMystTOC {
  file?: string;
  title?: string;
  children?: IMystTOC[];
  url?: string;
  glob?: string;
}

export async function mystTOCToHtml(
  toc: IMystTOC[],
  cwd: string,
  level: number = 1,
  html: string = ''
): Promise<string> {
  if (cwd && cwd.slice(-1) !== '/') {
    cwd = cwd + '/';
  }

  async function insert_one_file(file: string, chevron: boolean=false) {
    const parts = file.split('/');
    parts.pop();
    const k_dir = parts.join('/');
    const pth = await jbtoc.getFullPath(file, `${cwd}${k_dir}`);
    let title = await jbtoc.getTitle(pth);
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
    }
    else {
      html += `<button class="jp-Button toc-button tb-level${level}" style="display: block;" data-file-path="${pth}">${title}</button>`;
    }
  }

  async function insert_title(title: string) {

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
    console.log(item);
    if (item.title && item.children) {
      // If there are a title, children, and a file, use the file path as the title   
      if (item.file) {
        await insert_one_file(item.file, true);
      }
      else {
        insert_title(item.title);
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
       await insert_one_file(item.file); 
    } else if (item.url) {
      html += `<button class="jp-Button toc-button tb-level${level}" style="display:block;"><a class="toc-link tb-level${level}" href="${item.url}" target="_blank" rel="noopener noreferrer" style="display: block;">${item.title}</a></button>`;
    } else if (item.glob) {
      const files = await jbtoc.globFiles(`${cwd}${item.glob}`);
      for (const file of files) {
        const relative = file.replace(`${cwd}`, '');
        await insert_one_file(relative);
      }
    }
  }
  return html;
}

export async function getHtmlTop(
  project: IMystProject,
  configParent: string,
): Promise<string> {
  let html_top = `<div class="jbook-toc" data-toc-dir="${configParent}">`;

  if (project.title) {
    html_top += `<p id="toc-title">${project.title}</p>`;
  }
  if (project.subtitle) {
    html_top += `<p id="toc-subtitle">${project.subtitle}</p>`
  }
  html_top += `<br><hr class=toc-hr>`
  return html_top;
}

export async function getHtmlBottom(
  project: IMystProject
): Promise<string> {
  let html_bottom = `<br><hr class=toc-hr><br>`

   if (project.authors) {
    const authors = project.authors;
    if (authors.length == 1) {
      html_bottom += `<p id="toc-author">Author: `
    } else {
      html_bottom += `<p id="toc-author">Authors: `
    }
    authors.forEach((author, i) => {
      if (i < authors.length - 1) {
        html_bottom += `${author.name}, `
      } else {
        html_bottom += `${author.name}`
      }
    });
    html_bottom += `</p>`
  }

  if (project.github || project.license || project.doi) {
    html_bottom += `<div class=badges>`
  }
  if (project.github) {
    html_bottom += `
      <a href="https://github.com/${project.github}" target="_blank" rel="noopener">
        <img
          src="https://img.shields.io/badge/GitHub-5c5c5c?logo=github"
          alt="GitHub: ${project.github}"
        >
      </a>
    `
  }
  if (project.license) {
    html_bottom +=`
    <a href="https://opensource.org/licenses/${project.license}" target="_blank" rel="noopener">
      <img
        src="https://img.shields.io/badge/License-${project.license.replaceAll("-", "_")}--Clause-blue.svg"
        alt="License: ${project.license}"
      >
    </a>
    `
  }
  if (project.doi) {
    html_bottom += `
      <a href="https://doi.org/10.5281/zenodo.${project.doi}" target="_blank" rel="noopener">
        <img
          src="https://img.shields.io/badge/DOI-10.5281%2Fzenodo.${project.doi}-blue.svg"
          alt="DOI: 10.5281/zenodo.${project.doi}"
        >
      </a>
    `
  }
  if (project.github || project.license || project.doi) {
    html_bottom += `</div>`
  }
  if (project.copyright) {
    html_bottom += `
      <p style="padding-left: 15px">Copyright © ${project.copyright}</p>
    `
  }
  return html_bottom;
}
