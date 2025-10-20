"use strict";
(self["webpackChunkjb_toc"] = self["webpackChunkjb_toc"] || []).push([["lib_jbtoc_js"],{

/***/ "./lib/index.js":
/*!**********************!*\
  !*** ./lib/index.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__),
/* harmony export */   getJupyterAppInstance: () => (/* binding */ getJupyterAppInstance)
/* harmony export */ });
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/application */ "webpack/sharing/consume/default/@jupyterlab/application");
/* harmony import */ var _jupyterlab_application__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @lumino/widgets */ "webpack/sharing/consume/default/@lumino/widgets");
/* harmony import */ var _lumino_widgets__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_lumino_widgets__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var _jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! @jupyterlab/docmanager */ "webpack/sharing/consume/default/@jupyterlab/docmanager");
/* harmony import */ var _jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _jupyterlab_filebrowser__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! @jupyterlab/filebrowser */ "webpack/sharing/consume/default/@jupyterlab/filebrowser");
/* harmony import */ var _jupyterlab_filebrowser__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_filebrowser__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _jbtoc__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./jbtoc */ "./lib/jbtoc.js");





let appInstance = null;
function getJupyterAppInstance(app) {
    if (!appInstance && app) {
        appInstance = app;
    }
    if (!appInstance) {
        throw new Error('App instance has not been initialized yet');
    }
    return appInstance;
}
const plugin = {
    id: 'jb-toc:plugin',
    description: 'A JupyterLab extension that mimics jupyter-book chapter navigation on an un-built, cloned jupyter book in JupyterLab.',
    autoStart: true,
    requires: [_jupyterlab_application__WEBPACK_IMPORTED_MODULE_0__.ILabShell, _jupyterlab_filebrowser__WEBPACK_IMPORTED_MODULE_3__.IFileBrowserFactory, _jupyterlab_docmanager__WEBPACK_IMPORTED_MODULE_2__.IDocumentManager],
    activate: async (app, shell, fileBrowserFactory, docManager) => {
        getJupyterAppInstance(app);
        console.log('JupyterLab extension jb-toc is activated!');
        const widget = new _lumino_widgets__WEBPACK_IMPORTED_MODULE_1__.Widget();
        widget.id = '@jupyterlab-sidepanel/jb-toc';
        widget.title.iconClass = 'jbook-icon jp-SideBar-tabIcon';
        widget.title.className = 'jbook-tab';
        widget.title.caption = 'Jupyter-Book Table of Contents';
        const summary = document.createElement('p');
        widget.node.appendChild(summary);
        widget.activate = async () => {
            const fileBrowser = fileBrowserFactory.tracker.currentWidget;
            if (!fileBrowser) {
                console.debug('File browser widget is null.');
            }
            else {
                console.debug('Active file browser widget found.');
            }
            try {
                const cwd = fileBrowser?.model.path;
                if (typeof cwd === 'string') {
                    const toc = await _jbtoc__WEBPACK_IMPORTED_MODULE_4__.getTOC(cwd);
                    summary.innerHTML = toc;
                }
                addClickListenerToButtons(fileBrowser, docManager);
                addClickListenerToChevron();
            }
            catch (reason) {
                console.error(`jb_toc error: ${reason}`);
            }
        };
        shell.add(widget, 'left', { rank: 400 });
        widget.activate();
    }
};
/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (plugin);
function addClickListenerToChevron() {
    const buttons = document.querySelectorAll('.toc-chevron');
    buttons.forEach(buttonElement => {
        const button = buttonElement;
        button.addEventListener('click', (event) => {
            toggleList(button);
        });
    });
}
function toggleList(button) {
    const list = button.parentElement?.nextElementSibling;
    if (!list) {
        return;
    }
    const isHidden = list.hidden;
    list.hidden = !isHidden;
    button.setAttribute('aria-expanded', String(!isHidden));
    button.innerHTML = isHidden
        ? '<i class="fa fa-chevron-up toc-chevron"></i>'
        : '<i class="fa fa-chevron-down toc-chevron"></i>';
}
function addClickListenerToButtons(fileBrowser, docManager) {
    const buttons = document.querySelectorAll('.toc-button');
    buttons.forEach(button => {
        button.addEventListener('click', (event) => {
            if (!fileBrowser) {
                console.error('File browser not found');
                return;
            }
            const toc_div = button.closest('.jbook-toc');
            if (!toc_div) {
                console.error('jbook-toc div not found');
                return;
            }
            const toc_dir = toc_div.getAttribute('data-toc-dir');
            if (typeof toc_dir !== 'string') {
                console.error('data-toc-dir attribute loaded');
                return;
            }
            if (typeof fileBrowser.model.path !== 'string') {
                console.error(`Invalid path: The current path is either not set or not a string. Path: ${fileBrowser.model.path}`);
                return;
            }
            console.debug(`Current directory: ${fileBrowser.model.path}`);
            const filePath = button.getAttribute('data-file-path');
            if (typeof filePath === 'string') {
                if (filePath.includes('.md')) {
                    docManager.openOrReveal(filePath, 'Markdown Preview');
                }
                else {
                    docManager.openOrReveal(filePath);
                }
            }
        });
    });
}


/***/ }),

/***/ "./lib/jb1.js":
/*!********************!*\
  !*** ./lib/jb1.js ***!
  \********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getJBook1Config: () => (/* binding */ getJBook1Config),
/* harmony export */   jBook1TOCToHtml: () => (/* binding */ jBook1TOCToHtml)
/* harmony export */ });
/* harmony import */ var js_yaml__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! js-yaml */ "webpack/sharing/consume/default/js-yaml/js-yaml");
/* harmony import */ var js_yaml__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(js_yaml__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jbtoc__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./jbtoc */ "./lib/jbtoc.js");


function isJBook1Config(obj) {
    return (obj &&
        typeof obj === 'object' &&
        typeof obj.title === 'string' &&
        typeof obj.author === 'string');
}
async function getJBook1Config(configPath) {
    try {
        const yamlStr = await _jbtoc__WEBPACK_IMPORTED_MODULE_1__.getFileContents(configPath);
        if (typeof yamlStr === 'string') {
            const config = js_yaml__WEBPACK_IMPORTED_MODULE_0__.load(yamlStr);
            if (isJBook1Config(config)) {
                const title = config.title || 'Untitled Jupyter Book';
                const author = config.author || 'Anonymous';
                return { title, author };
            }
            else {
                console.error('Error: Misconfigured Jupyter Book config.');
            }
        }
    }
    catch (error) {
        console.error('Error reading or parsing config:', error);
    }
    return { title: null, author: null };
}
async function getSubSection(parts, cwd, level = 1, html = '') {
    if (cwd && cwd.slice(-1) !== '/') {
        cwd = cwd + '/';
    }
    async function insertFile(file) {
        const parts = file.split('/');
        parts.pop();
        const k_dir = parts.join('/');
        const pth = await _jbtoc__WEBPACK_IMPORTED_MODULE_1__.getFullPath(file, `${cwd}${k_dir}`);
        let title;
        if (typeof pth === 'string') {
            title = await _jbtoc__WEBPACK_IMPORTED_MODULE_1__.getFileTitleFromHeader(pth);
        }
        if (!title) {
            title = file;
        }
        html += `<button class="jp-Button toc-button tb-level${level}" data-file-path="${_jbtoc__WEBPACK_IMPORTED_MODULE_1__.escAttr(encodeURI(String(pth)))}">${_jbtoc__WEBPACK_IMPORTED_MODULE_1__.escHtml(String(title))}</button>`;
    }
    for (const k of parts) {
        if (k.sections && k.file) {
            const parts = k.file.split('/');
            parts.pop();
            const k_dir = parts.join('/');
            const pth = await _jbtoc__WEBPACK_IMPORTED_MODULE_1__.getFullPath(k.file, `${cwd}${k_dir}`);
            let title;
            if (typeof pth === 'string') {
                title = await _jbtoc__WEBPACK_IMPORTED_MODULE_1__.getFileTitleFromHeader(pth);
            }
            if (!title) {
                title = k.file;
            }
            title = _jbtoc__WEBPACK_IMPORTED_MODULE_1__.escHtml(String(title));
            html += `
        <div class="toc-row">
            <button type="button" class="jp-Button toc-button 
              tb-level${level}" 
              data-file-path="${_jbtoc__WEBPACK_IMPORTED_MODULE_1__.escAttr(encodeURI(String(pth)))}"
              >${_jbtoc__WEBPACK_IMPORTED_MODULE_1__.escHtml(String(title))}</button>
            <button type="button" class="jp-Button toc-chevron"><i class="fa fa-chevron-down "></i></button>
        </div>
        <div class="toc-children" hidden>
        `;
            const html_cur = html;
            html = await getSubSection(k.sections, cwd, (level = level + 1), (html = html_cur));
            level = level - 1;
            html += '</div>';
        }
        else if (k.file) {
            await insertFile(k.file);
        }
        else if (k.url) {
            const url = String(_jbtoc__WEBPACK_IMPORTED_MODULE_1__.escAttr(encodeURI(k.url)));
            html += `<button class="jp-Button toc-button toc-link tb-level${level}">
        <a class="toc-link tb-level${level}" 
        href="${_jbtoc__WEBPACK_IMPORTED_MODULE_1__.escAttr(encodeURI(String(url)))}" 
        target="_blank" 
        rel="noopener noreferrer" 
        >${_jbtoc__WEBPACK_IMPORTED_MODULE_1__.escHtml(String(k.title))}</a></button>`;
        }
        else if (k.glob) {
            const files = await _jbtoc__WEBPACK_IMPORTED_MODULE_1__.globFiles(`${cwd}${k.glob}`);
            for (const file of files) {
                const relative = file.replace(`${cwd}`, '');
                await insertFile(relative);
            }
        }
    }
    return html;
}
async function jBook1TOCToHtml(toc, cwd) {
    let html = '\n<ul>';
    if (toc.parts) {
        for (const chapter of toc.parts) {
            html += `\n<p class="caption" role="heading"><span class="caption-text"><b>\n${_jbtoc__WEBPACK_IMPORTED_MODULE_1__.escHtml(String(chapter.caption))}\n</b></span>\n</p>`;
            const subSectionHtml = await getSubSection(chapter.chapters, cwd);
            html += `\n${subSectionHtml}`;
        }
    }
    else {
        if (toc.chapters) {
            const subSectionHtml = await getSubSection(toc.chapters, cwd);
            html += `\n${subSectionHtml}`;
        }
    }
    html += '\n</ul>';
    return html;
}


/***/ }),

/***/ "./lib/jb2.js":
/*!********************!*\
  !*** ./lib/jb2.js ***!
  \********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   getHtmlBottom: () => (/* binding */ getHtmlBottom),
/* harmony export */   getHtmlTop: () => (/* binding */ getHtmlTop),
/* harmony export */   mystTOCToHtml: () => (/* binding */ mystTOCToHtml)
/* harmony export */ });
/* harmony import */ var _jbtoc__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./jbtoc */ "./lib/jbtoc.js");

async function mystTOCToHtml(toc, cwd, level = 1) {
    async function insertFile(file, chevron = false) {
        const pth = await _jbtoc__WEBPACK_IMPORTED_MODULE_0__.getFullPath(file, cwd);
        pathsSet.add(String(pth));
        const sectionId = `sec-${Math.random().toString(36).slice(2)}`;
        const tHTML = _jbtoc__WEBPACK_IMPORTED_MODULE_0__.htmlTok(pth);
        const tATTR = _jbtoc__WEBPACK_IMPORTED_MODULE_0__.attrTok(pth);
        let file_html;
        if (chevron) {
            file_html = `<div class="toc-row">
        <button
          type="button"
          class="jp-Button toc-button tb-level${level} toc-file"
          data-file-path="${pth}"
          aria-label="Open ${tATTR}"
        ><b>${tHTML}</b></button>

        <button
          type="button"
          class="jp-Button toc-chevron"
          aria-expanded="false"
          aria-controls="${sectionId}"
          aria-label="Toggle section for ${tATTR}"
        ><i class="fa fa-chevron-down"></i></button>
      </div>
      <div id="${sectionId}" class="toc-children" hidden>
    `;
        }
        else {
            file_html = `<button
        class="jp-Button toc-button tb-level${level}"
        data-file-path="${pth}"
        aria-label="Open ${tATTR}"
      >
        ${tHTML}
      </button>`;
        }
        return file_html;
    }
    async function insertMystTitle(htmlTitle, attrTitle) {
        const sectionId = `sec-${Math.random().toString(36).slice(2)}`;
        return `
      <div class="toc-row">
        <p class="caption tb-level${level}" role="heading" aria-level="${level}">
          <b>${htmlTitle}</b>
        </p>
        <button
          type="button"
          class="jp-Button toc-chevron"
          aria-expanded="false"
          aria-controls="${sectionId}"
          aria-label="Toggle section for ${attrTitle}"
        ><i class="fa fa-chevron-down"></i>
        </button>
      </div>
      <div id="${sectionId}" class="toc-children" hidden>
    `;
    }
    async function insertUrl(htmlTitle, attrTitle, url) {
        return `
    <div class="toc-row">
      <a
        class="jp-Button toc-button toc-link tb-level${level}"
        href="${url}"
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Open external link to ${attrTitle}"
      >
        ${htmlTitle}
      </a>
    </div>
    `;
    }
    if (cwd && cwd.slice(-1) !== '/') {
        cwd = cwd + '/';
    }
    const pathsSet = new Set();
    const html_snippets = [];
    for (const item of toc) {
        const htmlTitle = item.title ? _jbtoc__WEBPACK_IMPORTED_MODULE_0__.escHtml(String(item.title)) : '';
        const attrTitle = item.title ? _jbtoc__WEBPACK_IMPORTED_MODULE_0__.escAttr(String(item.title)) : '';
        const url = item.url ? _jbtoc__WEBPACK_IMPORTED_MODULE_0__.escAttr(encodeURI(String(item.url))) : '';
        if ((item.title || item.file) && item.children) {
            if (item.file) {
                html_snippets.push(await insertFile(item.file, true));
            }
            else if (item.title) {
                html_snippets.push(await insertMystTitle(htmlTitle, attrTitle));
            }
            const children = await mystTOCToHtml(item.children, cwd, level + 1);
            children.paths.forEach(p => pathsSet.add(p));
            html_snippets.push(children.html);
            html_snippets.push('</div>');
        }
        else if (item.file) {
            html_snippets.push(await insertFile(item.file));
        }
        else if (item.url && item.title) {
            html_snippets.push(await insertUrl(htmlTitle, attrTitle, url));
        }
        else if (item.glob) {
            const files = await _jbtoc__WEBPACK_IMPORTED_MODULE_0__.globFiles(`${cwd}${item.glob}`);
            for (const file of files) {
                const relative = file.replace(`${cwd}`, '');
                html_snippets.push(await insertFile(relative));
            }
        }
    }
    return { html: html_snippets.join(''), paths: Array.from(pathsSet) };
}
async function getHtmlTop(project, configParent) {
    let html_top = `<div class="jbook-toc" data-toc-dir="${configParent}">`;
    if (project.title) {
        html_top += `<p id="toc-title">${_jbtoc__WEBPACK_IMPORTED_MODULE_0__.escHtml(String(project.title))}</p>`;
    }
    if (project.subtitle) {
        html_top += `<p id="toc-subtitle">${_jbtoc__WEBPACK_IMPORTED_MODULE_0__.escHtml(String(project.subtitle))}</p>`;
    }
    html_top += '<br><hr class="toc-hr">';
    return html_top;
}
async function getHtmlBottom(project) {
    function getDOIHtml(doi) {
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
    function getGithubHtml(github) {
        let githubUrl;
        let githubLabel;
        const githubValue = String(github).trim();
        if (githubValue.startsWith('http://') ||
            githubValue.startsWith('https://')) {
            githubUrl = githubValue;
            const match = githubValue.match(/github\.com\/([^/]+\/[^/]+)/);
            githubLabel = match ? match[1] : githubValue;
        }
        else {
            githubLabel = githubValue;
            githubUrl = `https://github.com/${githubValue}`;
        }
        const githubEscaped = _jbtoc__WEBPACK_IMPORTED_MODULE_0__.escAttr(encodeURI(githubLabel));
        return `
      <a
        href="${githubUrl}"
        target="_blank"
        rel="noopener noreferrer"
        class="toc-link github-link"
        aria-label="Open GitHub repository ${githubEscaped} (opens in a new tab)"
      >
        <img
          src="https://img.shields.io/badge/GitHub-5c5c5c?logo=github"
          alt="GitHub badge for ${githubEscaped}"
          loading="lazy"
        >
      </a>
    `;
    }
    let html_bottom = '<br><hr class="toc-hr"><br>';
    if (Array.isArray(project.authors) && project.authors.length) {
        const names = project.authors
            .filter(a => a && a.name)
            .map(a => _jbtoc__WEBPACK_IMPORTED_MODULE_0__.escHtml(String(a.name)));
        if (names.length) {
            const label = names.length === 1 ? 'Author:' : 'Authors:';
            html_bottom += `<p id="toc-author">${label} ${names.join(', ')}</p>`;
        }
    }
    if (project.github || project.license || project.doi) {
        html_bottom += '<div class="badges">';
    }
    if (project.github) {
        html_bottom += getGithubHtml(project.github);
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
        html_bottom += getDOIHtml(project.doi);
    }
    if (project.github || project.license || project.doi) {
        html_bottom += '</div>';
    }
    if (project.copyright) {
        html_bottom += `
      <p style="padding-left: 15px">Copyright © ${_jbtoc__WEBPACK_IMPORTED_MODULE_0__.escHtml(String(project.copyright))}</p>
    `;
    }
    return html_bottom;
}


/***/ }),

/***/ "./lib/jbtoc.js":
/*!**********************!*\
  !*** ./lib/jbtoc.js ***!
  \**********************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   attrTok: () => (/* binding */ attrTok),
/* harmony export */   escAttr: () => (/* binding */ escAttr),
/* harmony export */   escHtml: () => (/* binding */ escHtml),
/* harmony export */   fetchTitlesBackend: () => (/* binding */ fetchTitlesBackend),
/* harmony export */   formatHtmlForDev: () => (/* binding */ formatHtmlForDev),
/* harmony export */   getFileContents: () => (/* binding */ getFileContents),
/* harmony export */   getFileTitleFromHeader: () => (/* binding */ getFileTitleFromHeader),
/* harmony export */   getFullPath: () => (/* binding */ getFullPath),
/* harmony export */   getTOC: () => (/* binding */ getTOC),
/* harmony export */   globFiles: () => (/* binding */ globFiles),
/* harmony export */   htmlTok: () => (/* binding */ htmlTok),
/* harmony export */   ls: () => (/* binding */ ls)
/* harmony export */ });
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! @jupyterlab/services */ "webpack/sharing/consume/default/@jupyterlab/services");
/* harmony import */ var _jupyterlab_services__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_services__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @jupyterlab/coreutils */ "webpack/sharing/consume/default/@jupyterlab/coreutils");
/* harmony import */ var _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(_jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! path */ "./node_modules/path-browserify/index.js");
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var js_yaml__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! js-yaml */ "webpack/sharing/consume/default/js-yaml/js-yaml");
/* harmony import */ var js_yaml__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(js_yaml__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var _index__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(/*! ./index */ "./lib/index.js");
/* harmony import */ var _jb1__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(/*! ./jb1 */ "./lib/jb1.js");
/* harmony import */ var _jb2__WEBPACK_IMPORTED_MODULE_6__ = __webpack_require__(/*! ./jb2 */ "./lib/jb2.js");







async function getFileContents(path) {
    try {
        const app = (0,_index__WEBPACK_IMPORTED_MODULE_4__.getJupyterAppInstance)();
        const data = await app.serviceManager.contents.get(path, { content: true });
        if (data.type === 'notebook' || data.type === 'file') {
            return data.content;
        }
        else {
            throw new Error(`Unsupported file type: ${data.type}`);
        }
    }
    catch (error) {
        console.error(`Failed to get file contents for ${path}:`, error);
        throw error;
    }
}
async function ls(pth) {
    if (pth === '') {
        pth = '/';
    }
    try {
        const app = (0,_index__WEBPACK_IMPORTED_MODULE_4__.getJupyterAppInstance)();
        return await app.serviceManager.contents.get(pth, { content: true });
    }
    catch (error) {
        console.error('Error listing directory contents:', error);
        return null;
    }
}
function escHtml(str) {
    if (str === null) {
        return '';
    }
    const s = String(str);
    return s
        .replaceAll(/&/g, '&amp;')
        .replaceAll(/</g, '&lt;')
        .replaceAll(/>/g, '&gt;');
}
function escAttr(str) {
    if (str === null) {
        return '';
    }
    const s = String(str);
    return escHtml(s).replaceAll(/"/g, '&quot;').replaceAll(/'/g, '&#39;');
}
function encodePath(path) {
    return encodeURIComponent(path);
}
// Used to create placeholder tokens for titles on initial toc html generation.
// They will later be updated with titles effieicently retreived on the backend when possible.
function htmlTok(path) {
    return `[[TITLE_HTML::${encodePath(path)}]]`;
}
function attrTok(path) {
    return `[[TITLE_ATTR::${encodePath(path)}]]`;
}
async function findConfigInParents(cwd) {
    const configPatterns = ['myst.yml', '_toc.yml'];
    for (const configPattern of configPatterns) {
        const dirs = cwd.split('/');
        let counter = 0;
        while (counter < 1) {
            const pth = dirs.join('/');
            const files = await ls(pth);
            for (const value of Object.values(files.content)) {
                const file = value;
                if (file.path.endsWith(configPattern)) {
                    return file.path;
                }
            }
            if (dirs.length === 0) {
                counter += 1;
            }
            else {
                dirs.pop();
            }
        }
    }
    return null;
}
function getFullPath(relFile, bookRoot) {
    // const fullPath = new URL(relFile, bookRoot + '/').pathname;
    // console.log(fullPath);
    return path__WEBPACK_IMPORTED_MODULE_2__.posix.normalize((bookRoot.endsWith('/') ? bookRoot : bookRoot + '/') + relFile);
}
function isNotebook(obj) {
    return obj && typeof obj === 'object' && Array.isArray(obj.cells);
}
async function getFileTitleFromHeader(filePath) {
    const suffix = path__WEBPACK_IMPORTED_MODULE_2__.extname(filePath);
    if (suffix === '.ipynb') {
        try {
            const jsonData = await getFileContents(filePath);
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
                        const title = firstHeaderCell.source
                            .split('\n')[0]
                            .slice(2);
                        return title;
                    }
                }
            }
        }
        catch (error) {
            console.error('Error reading or parsing notebook:', error);
        }
    }
    else if (suffix === '.md') {
        try {
            const md = await getFileContents(filePath);
            if (!isNotebook(md)) {
                const lines = md.split('\n');
                for (const line of lines) {
                    if (line.slice(0, 2) === '# ') {
                        return line.slice(2);
                    }
                }
            }
        }
        catch (error) {
            console.error('Error reading or parsing Markdown:', error);
        }
    }
    return null;
}
async function globFiles(pattern) {
    const baseDir = '';
    const result = [];
    try {
        const app = (0,_index__WEBPACK_IMPORTED_MODULE_4__.getJupyterAppInstance)();
        const data = await app.serviceManager.contents.get(baseDir, {
            content: true
        });
        const regex = new RegExp(pattern);
        for (const item of data.content) {
            if (item.type === 'file' && regex.test(item.path)) {
                result.push(item.path);
            }
        }
    }
    catch (error) {
        console.error(`Error globbing pattern ${pattern}`, error);
    }
    return result;
}
let prettierModPromise;
let htmlPluginPromise;
async function formatHtmlForDev(html) {
    if (false) {}
    prettierModPromise ??= __webpack_require__.e(/*! import() */ "vendors-node_modules_prettier_standalone_mjs").then(__webpack_require__.bind(__webpack_require__, /*! prettier/standalone */ "./node_modules/prettier/standalone.mjs")).catch(err => {
        prettierModPromise = undefined;
        throw err;
    });
    htmlPluginPromise ??= __webpack_require__.e(/*! import() */ "vendors-node_modules_prettier_plugins_html_mjs").then(__webpack_require__.bind(__webpack_require__, /*! prettier/plugins/html */ "./node_modules/prettier/plugins/html.mjs"))
        .then(m => m.default ?? m)
        .catch(err => {
        htmlPluginPromise = undefined;
        throw err;
    });
    const [prettierMod, htmlPlugin] = await Promise.all([
        prettierModPromise,
        htmlPluginPromise
    ]);
    const prettier = prettierMod.default ?? prettierMod;
    const parserHtml = htmlPlugin.default ?? htmlPlugin;
    return await prettier.format(html, {
        parser: 'html',
        plugins: [parserHtml]
    });
}
function replaceAll(haystack, needle, replacement) {
    return haystack.split(needle).join(replacement);
}
function stem(path) {
    const base = path.split('/').pop() ?? path;
    return base.replace(/\.[^.]+$/, '');
}
async function fetchTitlesBackend(paths) {
    const settings = _jupyterlab_services__WEBPACK_IMPORTED_MODULE_0__.ServerConnection.makeSettings();
    const url = _jupyterlab_coreutils__WEBPACK_IMPORTED_MODULE_1__.URLExt.join(settings.baseUrl, 'jbtoc', 'titles');
    const resp = await _jupyterlab_services__WEBPACK_IMPORTED_MODULE_0__.ServerConnection.makeRequest(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paths })
    }, settings);
    if (!resp.ok) {
        throw new Error(`${resp.status} ${resp.statusText}`);
    }
    const data = (await resp.json());
    const out = {};
    for (const [p, v] of Object.entries(data.titles)) {
        if (v?.title) {
            out[p] = { title: v.title, last_modified: v.last_modified };
        }
    }
    return out;
}
async function fetchTitlesFrontend(paths) {
    const out = {};
    for (const p of paths) {
        try {
            let t = await getFileTitleFromHeader(String(p));
            if (!t) {
                t = stem(p);
            }
            out[p] = { title: String(t) };
        }
        catch {
            out[p] = { title: stem(p) };
        }
    }
    return out;
}
function applyTitles(html, titleMap) {
    for (const [path, { title }] of Object.entries(titleMap)) {
        const safeHtml = escHtml(String(title));
        const safeAttr = escAttr(String(title));
        html = replaceAll(html, htmlTok(path), safeHtml);
        html = replaceAll(html, attrTok(path), safeAttr);
    }
    return html;
}
async function getTOC(cwd) {
    const tocPath = await findConfigInParents(cwd);
    let configPath = null;
    let configParent = null;
    let html;
    if (tocPath) {
        const myst = tocPath.endsWith('myst.yml');
        const parts = tocPath.split('/');
        parts.pop();
        configParent = parts.join('/');
        if (!myst) {
            const files = await ls(configParent);
            const configPattern = '_config.yml';
            for (const value of Object.values(files.content)) {
                const file = value;
                if (file.name === configPattern) {
                    configPath = file.path;
                    break;
                }
            }
        }
        if (!myst &&
            configParent !== null &&
            configParent !== undefined &&
            configPath) {
            try {
                const tocYamlStr = await getFileContents(tocPath);
                if (typeof tocYamlStr === 'string') {
                    const tocYaml = js_yaml__WEBPACK_IMPORTED_MODULE_3__.load(tocYamlStr);
                    const toc = tocYaml;
                    const config = await _jb1__WEBPACK_IMPORTED_MODULE_5__.getJBook1Config(configPath);
                    const toc_html = await _jb1__WEBPACK_IMPORTED_MODULE_5__.jBook1TOCToHtml(toc, configParent);
                    html = `
          <div class="jbook-toc" data-toc-dir="${configParent}">
            <p id="toc-title">${escHtml(String(config.title))}</p>
            <p id="toc-author">Author: ${escHtml(String(config.author))}</p>
            ${toc_html}
          </div>
          `;
                }
                else {
                    console.error('Error: Misconfigured Jupyter Book _toc.yml.');
                }
            }
            catch (error) {
                console.error('Error reading or parsing _toc.yml:', error);
            }
        }
        else if (myst && configParent !== null && configParent !== undefined) {
            try {
                const mystYAMLStr = await getFileContents(tocPath);
                if (typeof mystYAMLStr === 'string') {
                    const mystYaml = js_yaml__WEBPACK_IMPORTED_MODULE_3__.load(mystYAMLStr);
                    const yml = mystYaml;
                    const project = yml.project;
                    const html_top = await _jb2__WEBPACK_IMPORTED_MODULE_6__.getHtmlTop(project, configParent);
                    const { html: tocHtmlRaw, paths } = await _jb2__WEBPACK_IMPORTED_MODULE_6__.mystTOCToHtml(project.toc, configParent);
                    let map;
                    try {
                        map = await fetchTitlesBackend(paths);
                    }
                    catch {
                        map = await fetchTitlesFrontend(paths);
                    }
                    const toc_html = applyTitles(tocHtmlRaw, map);
                    const html_bottom = await _jb2__WEBPACK_IMPORTED_MODULE_6__.getHtmlBottom(project);
                    html = `
            ${html_top}
            <ul>${toc_html}</ul>
            </div>
            ${html_bottom}
            `;
                }
                else {
                    console.error('Error: Misconfigured Jupyter Book _toc.yml.');
                }
            }
            catch (error) {
                console.error('Error reading or parsing _toc.yml:', error);
            }
        }
    }
    else {
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
    }
    else {
        let errMsg = '';
        try {
            errMsg = JSON.stringify(html, null, 2);
        }
        catch {
            errMsg = String(html);
        }
        const stack = (html instanceof Error && html.stack) ||
            (typeof html === 'object' && 'stack' in (html ?? {}))
            ? html.stack
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


/***/ })

}]);
//# sourceMappingURL=lib_jbtoc_js.b5fafae563e7d60b810a.js.map