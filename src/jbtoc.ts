// import * as path from 'path';
import * as yaml from 'js-yaml';
import { getJupyterAppInstance } from './index';

import * as jb1 from './jb1';
import * as jb2 from './jb2';

interface IFileMetadata {
  path: string;
}

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
    const data = await app.serviceManager.contents.get(pth, { content: true });
    return data;
  } catch (error) {
    console.error('Error listing directory contents:', error);
    return null;
  }
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
        const file = value as IFileMetadata;
        if (file.path.includes(configPattern)) {
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

export async function getTOC(cwd: string): Promise<string> {
  const tocPath = await findConfigInParents(cwd);
  let configPath = null;
  let configParent = null;
  if (tocPath) {
    const myst = tocPath.includes("myst")
    const parts = tocPath.split('/');

    parts.pop();
    configParent = parts.join('/');
    
    if (!myst) {
      const files = await ls(configParent);
      const configPattern = '_config.yml';
      for (const value of Object.values(files.content)) {
        const file = value as IFileMetadata;
        if (file.path.includes(configPattern)) {
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
          const toc = tocYaml as jb1.IToc;
          const config = await jb1.getBookConfig(configPath);
          const toc_html = await jb1.tocToHtml(toc, configParent);
          return `
            <div class="jbook-toc" data-toc-dir="${configParent}"><p id="toc-title">${config.title}</p>
            <p id="toc-author">Author: ${config.author}</p>
            ${toc_html} </div>
              `;
        } else {
          console.error('Error: Misconfigured Jupyter Book _toc.yml.');
        }
      } catch (error) {
        console.error('Error reading or parsing _toc.yml:', error);
      }
    }
    else if (myst) {
      try {
        const mystYAMLStr = await getFileContents(tocPath);
        if (typeof mystYAMLStr === 'string') {
          const mystYaml: unknown = yaml.load(mystYAMLStr);
          const yml = mystYaml as jb2.IMyst;
          const project = yml.project as jb2.IMystProject;
          const toc = project.toc as jb2.IMystTOC;

          console.log(project);
          console.log(toc);
          const toc_html = await jb2.mystTOCToHtml(project, configParent);
          console.log(toc_html)
          // return `
          //   <div class="jbook-toc" data-toc-dir="${configParent}"><p id="toc-title">${config.title}</p>
          //   <p id="toc-author">Author: ${config.author}</p>
          //   ${toc_html} </div>
          //     `;
        } else {
          console.error('Error: Misconfigured Jupyter Book _toc.yml.');
        }
      } catch (error) {
        console.error('Error reading or parsing _toc.yml:', error);
      }

    }
  }
  return `
    <p id="toc-title">Not a Jupyter-Book</p>
    <p id="toc-author">"_toc.yml" and/or "_config.yml" not found in or above:</p>
    <p id="toc-author">${cwd}</p>
    <p id="toc-author">Please navigate to a directory containing a Jupyter-Book to view its Table of Contents</p>
    `;
}
