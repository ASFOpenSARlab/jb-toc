# Making a new release of jupyterlab_jupyterbook_navigation

The extension can be published to `PyPI` and `npm` manually or using the [Jupyter Releaser](https://github.com/jupyter-server/jupyter_releaser).

## Manual release

### Python package

This extension can be distributed as Python packages. All of the Python
packaging instructions are in the `pyproject.toml` file to wrap your extension in a
Python package. Before generating a package, you first need to install some tools:

```bash
pip install build twine hatch
```

Bump the version using `hatch`. By default this will create a tag.
See the docs on [hatch-nodejs-version](https://github.com/agoose77/hatch-nodejs-version#semver) for details.

```bash
hatch version <new-version>
```

Make sure to clean up all the development files before building the package:

```bash
jlpm clean:all
```

You could also clean up the local git repository:

```bash
git clean -dfX
```

To create a Python source package (`.tar.gz`) and the binary package (`.whl`) in the `dist/` directory, do:

```bash
python -m build
```

> `python setup.py sdist bdist_wheel` is deprecated and will not work for this package.

Then to upload the package to PyPI, do:

```bash
twine upload dist/*
```

### NPM package

To publish the frontend part of the extension as a NPM package, do:

```bash
npm login
npm publish --access public
```

## Automated releases with the Jupyter Releaser

### Prepare for automated releases

The `prep-release` and `publish-release` workflows in this repository use Jupyter Releaser.

Check out the [workflow documentation](https://jupyter-releaser.readthedocs.io/en/latest/get_started/making_release_from_repo.html) for more information.

These steps must be performed in order to release using the included GH workflows:

- Create a `publishing` environment for the repo if it does not yet exist.

- Add required [Github Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) to the `publishing` environment.
  - `PUBLISH_GITHUB_PAT`: A GitHub Personal-Access-Token. The PAT needs read permissions for metadata and read and write permissions for code and pull requests.
  - `NPM_TOKEN`: An NPM token that provides access to the NPM package `jupyterlab-jupyterbook-navigation`

- [Set up GitHub as a trusted publisher](https://docs.pypi.org/trusted-publishers) for the `jupyterlab-jupyterbook-navigation` project on PyPi.

### Release with workflows

- Merge a PR to main
  - Do not hatch a new version, create a new changelog, GitHub Tag, Draft Release, or Release (The workflows will handle it all) 
- Go to the Actions panel
- Run the "Step 1: Prep Release" workflow with the following paramaters:
  - `New Version Specifier`: "next"
    - "next" will bump the patch version number"
    - You can hardcode a version to bump major or minor version numbers
  - `The branch to target`: "main"
  - `Post Version Specifier`: leave blank
  - `Use PRs with activity since this date or git reference`: Leave blank or add date or git reference
  - `Use PRs with activity since the last stable git tag`: Leave blank or check if applicable  
- Check the draft release
  - Update the changelog in the draft release if needed/wanted
- Run the "Step 2: Publish Release" workflow with the following parameters:
  - `The target branch`: "main"
  - `The URL of the draft GitHub release`: The URL of the draft release (make sure to use the updated URL if you manually edited the draft release)
  - `Comma separated list of steps to skip`: leave blank
- Confirm release:
  - A GitHub tag was created for the new version
  - The draft release was published
  - The CHANGELOG was updated
  - `package.json` contains the updated version
  - An update was released to PyPi
  - AN update was released to NPM

## Publishing to `conda-forge`

If the package is not on conda forge yet, check the documentation to learn how to add it: https://conda-forge.org/docs/maintainer/adding_pkgs.html

Otherwise a bot should pick up the new version publish to PyPI, and open a new PR on the feedstock repository automatically.
