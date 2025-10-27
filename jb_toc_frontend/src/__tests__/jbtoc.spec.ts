/**
 * Example of [Jest](https://jestjs.io/docs/getting-started) unit tests
 */
import { test, expect, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
const jbtoc = require('../jbtoc');
import { getJupyterAppInstance } from '../index';

const HEADER1_NB = path.resolve(__dirname, './fixtures/content/header1.ipynb');
// const HEADER2_NB = path.resolve(__dirname, './fixtures/content/header2.ipynb');
const HEADER1_MD = path.resolve(__dirname, './fixtures/content/header1.md');
// const HEADER2_MD = path.resolve(__dirname, './fixtures/content/header2.md');
const TXT = path.resolve(__dirname, './fixtures/content/text.txt');
// const HEADER_PLACEMENT = path.resolve(__dirname, './fixtures/content/my_dir/header-placement.ipynb');
// const CONFIG = path.resolve(__dirname, './fixtures/conent/jb-v1/_config.yml')
// const TOC = path.resolve(__dirname, './fixtures/conent/jb-v1/_toc.yml')
// const MYST = path.resolve(__dirname, './fixtures/conent/jb-v2/myst.yml')

type ContentsModel = {
  type: 'file' | 'notebook' | string;
  path: string;
  content?: unknown;
};
type ContentsGet = (path: string, opts: any) => Promise<ContentsModel>;

// Test HTML escaping
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

// Test jbtoc.getFileContents
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

// Test jbtoc.htmlTok and jbtoc.attrToc
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

// jbtoc.normalize
// test('jbtoc.normalize', () => {
//   const result = jbtoc.normalize('./fixtures/content/my_dir');
//   expect(result.toBe(`[[TITLE_HTML::${encodeURIComponent(HEADER1_NB)}]]`));
// });
