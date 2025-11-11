import { test, expect, jest } from '@jest/globals';
import * as fs from 'fs';
import * as path from 'path';
import yaml from 'js-yaml';
const jbtoc = require('../jbtoc');
const jb2 = require('../jb2.ts');
import type { MystProject } from '../jb2';

const MYST_CONFIG = path.resolve(__dirname, './fixtures/jb-v2/myst.yml');

test('getHtmlTop', async () => {
  jest
    .spyOn(jbtoc, 'escHtml')
    .mockImplementation(((s: string) => s) as (...args: unknown[]) => any);

  const content = fs.readFileSync(MYST_CONFIG, 'utf-8');
  const raw = yaml.load(content) as { project?: MystProject } | null;
  expect(raw && raw.project).toBeTruthy();
  const project = raw!.project as MystProject;
  const configParent = path.dirname(MYST_CONFIG);

  const html = await jb2.getHtmlTop(project, configParent);

  expect(html).toContain('jb_toc Testing (v2)');
  expect(html).toContain('jb_toc test Jupyter Book 2');
  expect(html).toContain(`data-toc-dir="${configParent}"`);

  jest.restoreAllMocks();
});

test('getHtmlBottom', async () => {
  jest
    .spyOn(jbtoc, 'escHtml')
    .mockImplementation(((s: string) => s) as (...args: unknown[]) => any);

  const content = fs.readFileSync(MYST_CONFIG, 'utf-8');
  const raw = yaml.load(content) as { project?: MystProject } | null;
  expect(raw && raw.project).toBeTruthy();
  const project = raw!.project as MystProject;

  const html = await jb2.getHtmlBottom(project);

  expect(html).toContain('href="https://github.com/ASFOpenSARlab/jb-toc"');
  expect(html).toContain('"https://opensource.org/licenses/BSD-3"');
  expect(html).toContain('"https://doi.org/10.5281/zenodo.10093077"');
  expect(html).toContain(
    '<p id="toc-author">Authors: The ASF Services Team, John Doe, 12345</p><div class="badges">'
  );

  jest.restoreAllMocks();
});

describe('mystTOCToHtml', () => {
  beforeEach(() => {
    jest
      .spyOn(jbtoc, 'escHtml')
      .mockImplementation(((s: string) => s) as (...a: unknown[]) => any);
    jest
      .spyOn(jbtoc, 'escAttr')
      .mockImplementation(((s: string) => s) as (...a: unknown[]) => any);

    jest
      .spyOn(jbtoc, 'concatPath')
      .mockImplementation(
        ((file: string, cwd: string) => `${cwd}${file}`) as unknown as (
          ...args: unknown[]
        ) => any
      );

    jest
      .spyOn(jbtoc, 'htmlTok')
      .mockImplementation(
        ((p: string) => `HTML(${p})`) as unknown as (...args: unknown[]) => any
      );

    jest
      .spyOn(jbtoc, 'attrTok')
      .mockImplementation(
        ((p: string) => `ATTR(${p})`) as unknown as (...args: unknown[]) => any
      );

    jest.spyOn(global.Math, 'random').mockReturnValue(0.123456); // sec-4fzyo82mvyq
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('mystTOCToHtml', async () => {
    const content = fs.readFileSync(MYST_CONFIG, 'utf-8');
    const raw = yaml.load(content) as { project?: MystProject } | null;
    expect(raw?.project?.toc).toBeTruthy();
    const toc = raw!.project!.toc;

    const cwd = '';

    jest
      .spyOn(jbtoc, 'globFiles')
      .mockResolvedValue(['../content/alpha.md', '../content/beta.md']);

    const { html, paths } = await jb2.mystTOCToHtml(toc, cwd);

    // Non-chapter header files are inserted
    expect(html).toContain(
      `<button
        class="jp-Button toc-button tb-level1"
        data-file-path="../content/header1.md"
        aria-label="Open ATTR(../content/header1.md)"`
    );

    // Titles are inserted
    expect(html).toContain(
      `<p class="caption tb-level1" role="heading" aria-level="1">
          <b>Title 1</b>
        </p>`
    );

    // Chapter header chevron's children should be hidden
    expect(html).toContain(
      `<div id="sec-4fzyo82mvyq" class="toc-children" hidden>`
    );

    // Nested children should advance the level
    expect(html).toContain('tb-level2');
    expect(html).toContain('tb-level3');

    // URL insert
    expect(html).toContain('https://github.com/ASFOpenSARlab');
    expect(html).toContain('My URL');

    // Path set includes explicit file inserts plus those from the glob
    expect(new Set(paths)).toEqual(
      new Set([
        '../content/header1.md',
        '../content/header1.ipynb',
        '../content/header2.md',
        '../content/header2.ipynb',
        '../content/my_dir/header_placement.ipynb',
        '../content/bad_path.ipynb',
        '../content/text.txt',
        '../content/alpha.md',
        '../content/beta.md'
      ])
    );
  });
});
