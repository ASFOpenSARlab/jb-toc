# jb-toc-frontend

A JupyterLab frontend extension that provides Jupyter Book navigation in a sidepanel widget with a Jupyter Book table of contents.

## Requirements

- JupyterLab >= 4.0.0 < 5

## Install

_Note: If you have a Jupyter server, for a performance boost, you should [install the server extension](../jb_toc/README.md), which automatically installs the frontend extension as well._

To install `jb-toc-frontend`, execute:

```bash
python -m pip install jb-toc-frontend
```

## Uninstall

To remove the `jb-toc-frontend` extension, execute:

```bash
python -m pip uninstall jb-toc-frontend
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

```bash
# Clone the repo to your local environment
# Change directory to the jb-toc directory
# Install package in development mode
python -m pip install -e ./jb_toc_frontend
# Rebuild `jb_toc_frontend` Typescript source after making changes
jlpm --cwd ./jb_toc_frontend build
```

You can watch the source directory and run JupyterLab at the same time in different terminals to watch for changes in the extension's source and automatically rebuild the extension.

```bash
# Watch the source directory in one terminal, automatically rebuilding when needed
jlpm --cwd ./jb_toc_frontend watch
# Run JupyterLab in another terminal
jupyter lab
```

With the watch command running, every saved change will immediately be built locally and available in your running JupyterLab. Refresh JupyterLab to load the change in your browser (you may need to wait several seconds for the extension to be rebuilt).

By default, the `jlpm build` command generates the source maps for this extension to make it easier to debug using the browser dev tools. To also generate source maps for the JupyterLab core extensions, you can run the following command:

```bash
jupyter lab build --minimize=False
```

### Development uninstall

```bash
python -m pip uninstall jb-toc-frontend
```

In development mode, you will also need to remove the symlink created by `jupyter labextension develop`
command. To find its location, you can run `jupyter labextension list` to figure out where the `labextensions`
folder is located. Then you can remove the symlink named `jb-toc-frontend` within that folder.

### Testing the extension

#### Frontend tests

This extension is using [Jest](https://jestjs.io/) for JavaScript code testing.

To execute them, execute:

```sh
jlpm --cwd ./jb_toc_frontend
jlpm --cwd ./jb_toc_frontend test
```

#### Integration tests

This extension uses [Playwright](https://playwright.dev/docs/intro) for the integration tests (aka user level tests).
More precisely, the JupyterLab helper [Galata](https://github.com/jupyterlab/jupyterlab/tree/master/galata) is used to handle testing the extension in JupyterLab.

More information are provided within the [ui-tests](../ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](../RELEASE.md)
