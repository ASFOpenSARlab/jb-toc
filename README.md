# jb_toc

[![Github Actions Status](https://github.com/ASFOpenSARlab/jb-toc/workflows/Build/badge.svg)](https://github.com/ASFOpenSARlab/jb-toc/actions/workflows/build.yml)[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/ASFOpenSARlab/jb-toc/main?urlpath=lab)
[![lite-badge](https://jupyterlite.rtfd.io/en/latest/_static/badge.svg)](https://alex-lewandowski.github.io/JupyterLite-demo/lab/index.html)

A JupyterLab extension that provides Jupyter Book navigation in a sidepanel widget with a Jupyter Book table of contents.

## Requirements

- JupyterLab >= 4.0.0 < 5

## Installation Options
This JupyterLab extension contains a frontend extension (`jb_toc_frontend`) as well as a server extension (`jb_toc`).

### Option 1 (Recommended)
**Install `jb_toc` (installs both the frontend and server extensions)**
- **When:** Anytime you have a Jupyter Server, which is most of the time, and anytime you are running Jupyter Lab.

- **Why:** When Jupyter Server is available, this is the reliably faster option for loading a Jupyter Book TOC.

- **Note:** If accidentally installed in a serverless environmnent, the extension will default to frontend-only mode and still work.

To install both `jb_toc` and `jb_frontend`, execute:
```bash
python -m pip install jb_toc
```

### Option 2:
**Install `jb_toc_frontend` (installs only the frontend extension)**

- **When:** When using JupyterLite. In a lightweight serverless environment where you want to avoid unessecarily installing the server extension.

- **Why:** If Jupyter Server is not available, `jb_toc_frontend` can still access the files it needs to build the TOC (but more slowly). 

- **Don't:** Have a frontend-only installation on a JupyterHub. It will take >3 seconds to load a TOC, and the hub has a Jupyter Server, so you should install `jb_toc` for a faster experience.

To install `jb_toc_frontend`, execute:
```bash
python -m pip install jb_toc_frontend
```

## Uninstall

To remove the `jb_toc` extension, execute:

```bash
python -m pip uninstall jb_toc
```
To remove the `jb_toc_frontend` extension, execute:

```bash
python -m pip uninstall jb_toc_frontend
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

```bash
# Clone the repo to your local environment
# Change directory to the jb-toc directory
# Install package in development mode
# Install `jb_toc_frontend` first, as it is a dependency of `jb_toc`
python -m pip install -e ./jb_toc_frontend
python -m pip install -e ./jb_toc
# Link your development version of the extension with JupyterLab
jupyter labextension develop --overwrite                    
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
python -m pip uninstall jb_toc
python -m pip uninstall jb_toc_frontend
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

More information are provided within the [ui-tests](./ui-tests/README.md) README.

### Packaging the extension

See [RELEASE](RELEASE.md)
