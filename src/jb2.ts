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
  arxiv?: string;
  pmid?: string;
  open_access?: string;
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
}

export async function mystTOCToHtml(project: IMystProject, cwd: string): Promise<string> {
  let html = '\n<ul>';

  for (const item of project.toc) {
    console.log(item);
    if (item.title) {
        html += `\n<p class="caption" role="heading"><span class="caption-text"><b>\n${item.title}\n</b></span>\n</p>`;
    }
} 
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