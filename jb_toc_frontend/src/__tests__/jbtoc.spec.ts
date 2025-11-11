/**
 * Example of [Jest](https://jestjs.io/docs/getting-started) unit tests
 */
import { test, expect, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
const jbtoc = require('../jbtoc');
import { getJupyterAppInstance } from '../index';

const HEADER1_NB = path.resolve(__dirname, './fixtures/content/header1.ipynb');
const HEADER2_NB = path.resolve(__dirname, './fixtures/content/header2.ipynb');
const HEADER1_MD = path.resolve(__dirname, './fixtures/content/header1.md');
const HEADER2_MD = path.resolve(__dirname, './fixtures/content/header2.md');
const TXT = path.resolve(__dirname, './fixtures/content/text.txt');
const HEADER_PLACEMENT = path.resolve(
  __dirname,
  './fixtures/content/my_dir/header-placement.ipynb'
);

type ContentsModel = {
  type: 'file' | 'notebook' | 'directory' | string;
  path: string;
  name?: string;
  content?: unknown;
};
type ContentsGet = (path: string, opts: any) => Promise<ContentsModel>;

function file(path: string): ContentsModel {
  const name = path.split('/').pop() ?? path;
  return { type: 'file', path, name };
}

function dir(path: string, children: ContentsModel[]): ContentsModel {
  const name = path.split('/').pop() ?? path;
  return { type: 'directory', path, name, content: children };
}

const testString = `<div class="test" onclick="alert('xss')">Hello & 'world' © 💥 😈 <!--comment--></div>`;
const escHtmlTestString =
  '&lt;div class="test" onclick="alert(\'xss\')"&gt;Hello &amp; \'world\' © 💥 😈 &lt;!--comment--&gt;&lt;/div&gt;';
test('HTML escaping with jbtoc.escHtml', () => {
  expect(jbtoc.escHtml(testString)).toBe(escHtmlTestString);
});

const escAttrTestString = `&lt;div class=&quot;test&quot; onclick=&quot;alert(&#39;xss&#39;)&quot;&gt;Hello &amp; &#39;world&#39; © 💥 😈 &lt;!--comment--&gt;&lt;/div&gt;`;
test('HTML attribute escaping with jbtoc.escAttr', () => {
  expect(jbtoc.escAttr(testString)).toBe(escAttrTestString);
});

test('jbtoc.getFileContents on a notebook', async () => {
  const nbJSON = fs.readFileSync(HEADER1_NB, 'utf-8');

  const get: jest.MockedFunction<ContentsGet> = jest.fn();
  get.mockResolvedValue({
    type: 'notebook',
    path: HEADER1_NB,
    content: nbJSON
  });

  (getJupyterAppInstance as jest.Mock).mockReturnValue({
    serviceManager: { contents: { get } }
  });

  const got = await jbtoc.getFileContents(HEADER1_NB);

  expect(got).toBe(nbJSON);
});

test('jbtoc.getFileContents on markdown', async () => {
  const nbJSON = fs.readFileSync(HEADER1_MD, 'utf-8');

  const get: jest.MockedFunction<ContentsGet> = jest.fn();
  get.mockResolvedValue({
    type: 'file',
    path: HEADER1_MD,
    content: nbJSON
  });

  (getJupyterAppInstance as jest.Mock).mockReturnValue({
    serviceManager: { contents: { get } }
  });

  const got = await jbtoc.getFileContents(HEADER1_MD);

  expect(got).toBe(nbJSON);
});

test('jbtoc.getFileContents on unsupported file type', async () => {
  const get: jest.MockedFunction<ContentsGet> = jest.fn();
  get.mockResolvedValue({
    type: 'something_unexpected',
    path: './some/path.SAFE',
    content: '😈'
  });

  (getJupyterAppInstance as jest.Mock).mockReturnValue({
    serviceManager: { contents: { get } }
  });

  await expect(jbtoc.getFileContents(TXT)).rejects.toThrow(
    /Unsupported file type: something_unexpected/
  );
});

test('jbtoc.getFileContents on bad path', async () => {
  const get: jest.MockedFunction<ContentsGet> = jest.fn();
  get.mockRejectedValue(new Error('404 Not Found'));

  (getJupyterAppInstance as jest.Mock).mockReturnValue({
    serviceManager: { contents: { get } }
  });

  const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  await expect(jbtoc.getFileContents('bad/path.ipynb')).rejects.toThrow(
    '404 Not Found'
  );

  expect(consoleSpy).toHaveBeenCalledWith(
    expect.stringContaining('Failed to get file contents for bad/path.ipynb:'),
    expect.any(Error)
  );

  consoleSpy.mockRestore();
});

test('jbtoc.htmlTok', () => {
  expect(jbtoc.htmlTok(HEADER1_NB)).toBe(
    `[[TITLE_HTML::${encodeURIComponent(HEADER1_NB)}]]`
  );
});

test('jbtoc.attrTok', () => {
  expect(jbtoc.attrTok(HEADER1_NB)).toBe(
    `[[TITLE_ATTR::${encodeURIComponent(HEADER1_NB)}]]`
  );
});

test('jbtoc.normalize', () => {
  const result = jbtoc.normalize(
    'C:\\Users\\Windows_person//my_dir.notebook.ipynb'
  );
  expect(result).toBe('C:/Users/Windows_person/my_dir.notebook.ipynb');
});

test('jbtoc.getFileSuffix', () => {
  expect(jbtoc.getFileSuffix(HEADER1_NB)).toBe('.ipynb');
});

test('jbtoc.concatPath', () => {
  expect(jbtoc.concatPath('notebook.ipynb', 'my_book_root')).toBe(
    'my_book_root/notebook.ipynb'
  );
});

test('jbtoc.concatPath with /', () => {
  expect(jbtoc.concatPath('notebook.ipynb', 'my_book_root/')).toBe(
    'my_book_root/notebook.ipynb'
  );
});

//getFileTitleFromHeader
test('ipynb: returns first level-1 markdown header', async () => {
  const nbObj = JSON.parse(fs.readFileSync(HEADER1_NB, 'utf-8'));

  const get: jest.MockedFunction<ContentsGet> = jest.fn();
  get.mockResolvedValue({
    type: 'notebook',
    path: HEADER1_NB,
    content: nbObj
  });

  (getJupyterAppInstance as jest.Mock).mockReturnValue({
    serviceManager: {
      contents: { get }
    }
  });

  const title = await jbtoc.getFileTitleFromHeader(HEADER1_NB);
  expect(title).toBe('Level 1 Notebook Header, Markdown Cell # 1');
});

test('ipynb: returns first level-2 markdown header', async () => {
  const nbObj = JSON.parse(fs.readFileSync(HEADER2_NB, 'utf-8'));

  const get: jest.MockedFunction<ContentsGet> = jest.fn();
  get.mockResolvedValue({
    type: 'notebook',
    path: HEADER2_NB,
    content: nbObj
  });

  (getJupyterAppInstance as jest.Mock).mockReturnValue({
    serviceManager: {
      contents: { get }
    }
  });

  const title = await jbtoc.getFileTitleFromHeader(HEADER2_NB);
  expect(title).toBe('Level 2 Notebook Header, Markdown Cell # 1');
});

test('ipynb: returns first level-2 markdown header even if level-1 header appears later', async () => {
  const nbObj = JSON.parse(fs.readFileSync(HEADER_PLACEMENT, 'utf-8'));

  const get: jest.MockedFunction<ContentsGet> = jest.fn();
  get.mockResolvedValue({
    type: 'notebook',
    path: HEADER_PLACEMENT,
    content: nbObj
  });

  (getJupyterAppInstance as jest.Mock).mockReturnValue({
    serviceManager: {
      contents: { get }
    }
  });

  const title = await jbtoc.getFileTitleFromHeader(HEADER_PLACEMENT);
  expect(title).toBe('Level 2 Notebook Header, Markdown Cell # 1');
});

test('md: returns first level-1 markdown header', async () => {
  const mdStr = fs.readFileSync(HEADER1_MD, 'utf-8');

  const get: jest.MockedFunction<ContentsGet> = jest.fn();
  get.mockResolvedValue({
    type: 'file',
    path: HEADER1_MD,
    content: mdStr
  });

  (getJupyterAppInstance as jest.Mock).mockReturnValue({
    serviceManager: {
      contents: { get }
    }
  });

  const title = await jbtoc.getFileTitleFromHeader(HEADER1_MD);
  expect(title).toBe('Level 1 Header');
});

test('md: returns first markdown header even if followed by higher-level header', async () => {
  const mdStr = fs.readFileSync(HEADER2_MD, 'utf-8');

  const get: jest.MockedFunction<ContentsGet> = jest.fn();
  get.mockResolvedValue({
    type: 'file',
    path: HEADER2_MD,
    content: mdStr
  });

  (getJupyterAppInstance as jest.Mock).mockReturnValue({
    serviceManager: {
      contents: { get }
    }
  });

  const title = await jbtoc.getFileTitleFromHeader(HEADER2_MD);
  expect(title).toBe('Level 2 Header');
});

test('jbtoc.globFiles can find an exact path', async () => {
  const get: jest.MockedFunction<ContentsGet> = jest.fn();
  get.mockResolvedValue({
    type: 'file',
    path: HEADER2_MD,
    content: []
  });

  (getJupyterAppInstance as jest.Mock).mockReturnValue({
    serviceManager: {
      contents: { get }
    }
  });
  const config = await jbtoc.globFiles(HEADER2_MD);
  expect(config).toEqual([HEADER2_MD]);
});

test('jbtoc.globFiles can glob a wildcard with a shallow search', async () => {
  const get: jest.MockedFunction<ContentsGet> = jest.fn();
  get.mockResolvedValue({
    type: 'directory',
    path: './fixtures/content',
    content: [
      {
        name: 'header1.md',
        path: 'fixtures/content/header1.md',
        type: 'file',
        content: 'Level 1 Header\n====='
      },
      {
        name: 'header2.md',
        path: 'fixtures/content/header2.md',
        type: 'file',
        content: 'Level 2 Header\n====='
      }
    ]
  });

  (getJupyterAppInstance as jest.Mock).mockReturnValue({
    serviceManager: {
      contents: { get }
    }
  });
  const config = await jbtoc.globFiles('./fixtures/content/*.md');
  expect(config).toEqual([
    'fixtures/content/header1.md',
    'fixtures/content/header2.md'
  ]);
});

test('jbtoc.globFiles can glob a wildcard with a deep search', async () => {
  const get: jest.MockedFunction<ContentsGet> = jest.fn();
  (getJupyterAppInstance as jest.Mock).mockReturnValue({
    serviceManager: { contents: { get: get } }
  });

  get.mockImplementation(async (p: string, opts?: any) => {
    if ((p ?? '') === '') {
      return dir('', [dir('fixtures', []), dir('other_dir', [])]);
    }

    if (p === 'fixtures') {
      return dir('fixtures', [dir('fixtures/content', [])]);
    }

    if (p === 'fixtures/content') {
      return dir('fixtures/content', [
        file('fixtures/content/header1.md'),
        file('fixtures/content/header2.md'),
        file('fixtures/content/notes.txt')
      ]);
    }

    if (p === 'fixtures/content/header1.md') {
      return file('fixtures/content/header1.md');
    }
    if (p === 'fixtures/content/header2.md') {
      return file('fixtures/content/header2.md');
    }

    throw new Error(`404: ${p}`);
  });

  const result = await jbtoc.globFiles('./fixtures/**/*.md');
  expect(result).toEqual([
    'fixtures/content/header1.md',
    'fixtures/content/header2.md'
  ]);
});

test('getTOC: shows “Not a Jupyter-Book” message when no toc found, uses server extension', async () => {
  jest.spyOn(jbtoc.deps, 'findConfigInParents').mockResolvedValue(null);

  const html = await jbtoc.getTOC('/some/dir');
  expect(html).toMatch(/Not a Jupyter-Book/);
  expect(html).toMatch(/_toc\.yml.*_config\.yml.*myst\.yml/i);
  expect(html).toMatch(/some\/dir/);
});

test('getTOC: JB1 flow renders title, author, and TOC HTML', async () => {
  jest
    .spyOn(jbtoc.deps, 'findConfigInParents')
    .mockResolvedValue('book/_toc.yml');

  jest.spyOn(jbtoc.deps, 'ls').mockResolvedValue({
    type: 'directory',
    path: 'book',
    content: [{ name: '_config.yml', path: 'book/_config.yml', type: 'file' }]
  } as any);

  jest.spyOn(jbtoc.deps, 'getFileContents').mockResolvedValueOnce(`
    root: intro
    chapters:
      - file: chap1
      - file: chap2
`);

  jbtoc.deps.yamlLoad = () =>
    ({
      root: 'intro',
      chapters: [{ file: 'chap1' }, { file: 'chap2' }]
    }) as any;

  jest
    .spyOn(jbtoc.deps.jb1, 'getJBook1Config')
    .mockResolvedValue({ title: 'My Book', author: 'Ada' } as any);

  jest.spyOn(jbtoc.deps.jb1, 'jBook1TOCToHtml').mockResolvedValue({
    html: `<li><a href="chap1.md">${jbtoc.htmlTok('book/chap1.md')}</a></li>
           <li><a href="chap2.md">${jbtoc.htmlTok('book/chap2.md')}</a></li>`,
    paths: ['book/chap1.md', 'book/chap2.md']
  });

  jest.spyOn(jbtoc.deps, 'fetchTitlesBackend').mockResolvedValue({
    'book/chap1.md': { title: 'Chapter One' },
    'book/chap2.md': { title: 'Chapter Two' }
  });

  jest.spyOn(jbtoc.deps, 'applyTitles').mockReturnValue(
    `<li><a href="chap1.md">Chapter One</a></li>
     <li><a href="chap2.md">Chapter Two</a></li>`
  );

  jest.spyOn(jbtoc, 'escHtml').mockImplementation((s: any) => String(s));

  const html = await jbtoc.getTOC('/project/book');

  expect(html).toContain(`data-toc-dir="book"`);
  expect(html).toContain('<p id="toc-title">My Book</p>');
  expect(html).toContain('<p id="toc-author">Author: Ada</p>');
  expect(html).toContain('Chapter One');
  expect(html).toContain('Chapter Two');

  expect(jbtoc.deps.jb1.jBook1TOCToHtml).toHaveBeenCalled();
  expect(jbtoc.deps.applyTitles).toHaveBeenCalled();
});

test('getTOC: JB1 flow renders title, author, and TOC HTML, falls back to frontend', async () => {
  jest
    .spyOn(jbtoc.deps, 'findConfigInParents')
    .mockResolvedValue('book/_toc.yml');

  jest.spyOn(jbtoc.deps, 'ls').mockResolvedValue({
    type: 'directory',
    path: 'book',
    content: [{ name: '_config.yml', path: 'book/_config.yml', type: 'file' }]
  } as any);

  jest.spyOn(jbtoc.deps, 'getFileContents').mockResolvedValueOnce(`
    root: intro
    chapters:
      - file: chap1
      - file: chap2
    `);

  jbtoc.deps.yamlLoad = () =>
    ({
      root: 'intro',
      chapters: [{ file: 'chap1' }, { file: 'chap2' }]
    }) as any;

  jest
    .spyOn(jbtoc.deps.jb1, 'getJBook1Config')
    .mockResolvedValue({ title: 'My Book', author: 'Ada' } as any);

  jest.spyOn(jbtoc.deps.jb1, 'jBook1TOCToHtml').mockResolvedValue({
    html: `<li><a href="chap1.md">${jbtoc.htmlTok('book/chap1.md')}</a></li>
           <li><a href="chap2.md">${jbtoc.htmlTok('book/chap2.md')}</a></li>`,
    paths: ['book/chap1.md', 'book/chap2.md']
  });

  jest
    .spyOn(jbtoc.deps, 'fetchTitlesBackend')
    .mockRejectedValue(new Error('down'));
  jest.spyOn(jbtoc.deps, 'fetchTitlesFrontend').mockResolvedValue({
    'book/chap1.md': { title: 'Chapter One' },
    'book/chap2.md': { title: 'Chapter Two' }
  });

  jest.spyOn(jbtoc.deps, 'applyTitles').mockReturnValue(
    `<li><a href="chap1.md">Chapter One</a></li>
     <li><a href="chap2.md">Chapter Two</a></li>`
  );

  jest.spyOn(jbtoc, 'escHtml').mockImplementation((s: any) => String(s));

  const html = await jbtoc.getTOC('/project/book');

  expect(html).toContain(`data-toc-dir="book"`);
  expect(html).toContain('<p id="toc-title">My Book</p>');
  expect(html).toContain('<p id="toc-author">Author: Ada</p>');
  expect(html).toContain('Chapter One');
  expect(html).toContain('Chapter Two');

  expect(jbtoc.deps.jb1.jBook1TOCToHtml).toHaveBeenCalled();
  expect(jbtoc.deps.applyTitles).toHaveBeenCalled();
});

test('getTOC: JB2 flow (myst.yml) renders top, toc with titles, and bottom', async () => {
  jest
    .spyOn(jbtoc.deps, 'findConfigInParents')
    .mockResolvedValue('book/myst.yml');

  jest.spyOn(jbtoc.deps, 'getFileContents').mockResolvedValueOnce(`
format: jb-book
project:
  title: My JB2
  author: Babbage
  toc:
    - file: README
    - glob: "*.md"
`);

  jbtoc.deps.yamlLoad = () =>
    ({
      format: 'jb-book',
      project: {
        title: 'My JB2',
        author: 'Babbage',
        toc: [{ file: 'README' }, { glob: '*.md' }]
      }
    }) as any;

  jest
    .spyOn(jbtoc.deps.jb2, 'getHtmlTop')
    .mockResolvedValue('<div class="jbook2 top">top</div>');

  jest.spyOn(jbtoc.deps.jb2, 'mystTOCToHtml').mockResolvedValue({
    html: `<li><a href="README.md">[[TITLE_HTML::book/README.md]]</a></li>
           <li><a href="chap1.md">[[TITLE_HTML::book/chap1.md]]</a></li>`,
    paths: ['book/README.md', 'book/chap1.md']
  });

  jest
    .spyOn(jbtoc.deps, 'fetchTitlesBackend')
    .mockRejectedValue(new Error('down'));
  jest.spyOn(jbtoc.deps, 'fetchTitlesFrontend').mockResolvedValue({
    'book/README.md': { title: 'README' },
    'book/chap1.md': { title: 'Chapter One' }
  });

  jest
    .spyOn(jbtoc.deps, 'applyTitles')
    .mockReturnValue(
      `<li><a href="README.md">README</a></li><li><a href="chap1.md">Chapter One</a></li>`
    );

  jest
    .spyOn(jbtoc.deps.jb2, 'getHtmlBottom')
    .mockResolvedValue('<div class="jbook2 bottom">bottom</div>');

  const html = await jbtoc.getTOC('/project/book');

  expect(html).toContain('jbook2 top');
  expect(html).toContain('<ul>');
  expect(html).toContain('>README<');
  expect(html).toContain('>Chapter One<');
  expect(html).toContain('jbook2 bottom');

  expect(jbtoc.deps.fetchTitlesBackend).toHaveBeenCalledTimes(1);
  expect(jbtoc.deps.fetchTitlesFrontend).toHaveBeenCalledTimes(1);
  expect(jbtoc.deps.applyTitles).toHaveBeenCalledTimes(1);
});

test('getTOC: renders error block on malformed config', async () => {
  jest
    .spyOn(jbtoc.deps, 'findConfigInParents')
    .mockResolvedValue('book/_toc.yml');

  jest.spyOn(jbtoc.deps, 'ls').mockResolvedValue({
    type: 'directory',
    path: 'book',
    content: [{ name: '_config.yml', path: 'book/_config.yml', type: 'file' }]
  } as any);

  jest.spyOn(jbtoc.deps, 'getFileContents').mockResolvedValueOnce(`
    root: intro
    chapters: not-an-array
    `);

  // Bad TOC structure
  jbtoc.deps.yamlLoad = () => ({ root: 'intro', chapters: 'bad TOC' }) as any;

  jest
    .spyOn(jbtoc.deps.jb1, 'jBook1TOCToHtml')
    .mockRejectedValue(new Error('Invalid _toc.yml structure'));

  const errSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

  const html = await jbtoc.getTOC('/project/book');

  expect(html).toContain('jbook-toc-error');
  expect(html).toMatch(/TOC generation error/i);

  expect(errSpy).toHaveBeenCalledWith(
    'Error reading or parsing _toc.yml:',
    expect.any(Error)
  );
  errSpy.mockRestore();
});
