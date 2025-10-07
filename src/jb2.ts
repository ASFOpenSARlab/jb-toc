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
  authors?: string[];
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

async function getSubSection(
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
        <div>
            <button class="jp-Button toc-button tb-level${level}"style="display: inline-block;" data-file-path="${pth}">${title}</button>
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
    <div style="display: flex; align-items: center; justify-content: space-between;">
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
      // If there are a title, children, and a file, use the file as the title   
      if (item.file) {
        await insert_one_file(item.file, true);
      }
      else {
        insert_title(item.title);
      }
      const html_cur = html;
      html = await getSubSection(
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

export async function mystTOCToHtml(project: IMystProject, cwd: string): Promise<string> {
  let html = '\n<ul>';

//   for (const item of project.toc) {
//     console.log(item);
//     if (item.title) {
//         // html += `\n<p class="caption" role="heading"><span class="caption-text"><b>\n${item.title}\n</b></span>\n</p>`;
//         console.log(item.title);
//     }
//     if (item.children) {
//         console.log(item.children);
//     }
//   }
  const subISectionHtml = await getSubSection(project.toc, cwd);
  html += `\n${subISectionHtml}`;

//   if (toc.parts) {
//     for (const chapter of toc.parts) {
//       html += `\n<p class="caption" role="heading"><span class="caption-text"><b>\n${chapter.caption}\n</b></span>\n</p>`;
//       const subISectionHtml = await getSubSection(chapter.chapters, cwd);
//       html += `\n${subISectionHtml}`;
//     }
//   } else {
//     if (toc.chapters) {
//       const subISectionHtml = await getSubSection(toc.chapters, cwd);
//       html += `\n${subISectionHtml}`;
//     }
//   }
//   html += '\n</ul>';
  return html;
}