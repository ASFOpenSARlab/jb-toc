# jb-toc

A JupyterLab extension that provides Jupyter Book navigation in a sidepanel widget with a Jupyter Book table of contents.

## Requirements

- JupyterLab >= 4.0.0 < 5

## Install

This installs both the `jb-toc` server extension and the `jb-toc-frontend` extension. If you are using JupyterLite and don't need a server extension, you can [install `jb-toc-frontend`](../jb_toc_frontend/README.md) without `jb-toc`.

To install `jb-toc`, execute:

```bash
python -m pip install jb-toc
```

## Uninstall

To remove the `jb-toc` extension, execute:

```bash
python -m pip uninstall jb-toc
```

## Contributing

### Development install

Note: You will need NodeJS to build the extension package.

```bash
# Clone the repo to your local environment
# Change directory to the jb-toc directory
# Install package in development mode
python -m pip install -e ./jb_toc
```

### Development uninstall

```bash
python -m pip uninstall jb-toc
```

### Packaging the extension

See [RELEASE](../RELEASE.md)
