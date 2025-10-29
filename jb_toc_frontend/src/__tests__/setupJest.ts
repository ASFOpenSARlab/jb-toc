import { jest, beforeEach, afterEach } from '@jest/globals';

type ContentsModel = {
  type: 'file' | 'notebook' | string;
  path: string;
  content?: unknown;
};
type ContentsGet = (path: string, opts: any) => Promise<ContentsModel>;

jest.mock('../index', () => ({ getJupyterAppInstance: jest.fn() }));

function defaultFakeApp() {
  const get: jest.MockedFunction<ContentsGet> = jest.fn();
  get.mockResolvedValue({
    type: 'file',
    path: 'dummy.txt',
    content: 'hello'
  });

  return {
    serviceManager: {
      contents: { get }
    }
  };
}

beforeEach(() => {
  const { getJupyterAppInstance } = require('../index');
  (getJupyterAppInstance as jest.Mock).mockReturnValue(defaultFakeApp());
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterEach(() => {
  jest.clearAllMocks();
});
