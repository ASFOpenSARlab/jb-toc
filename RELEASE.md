# Making new releases of jb_toc and jb_toc_frontend

`jb_toc` and `jb_toc_frontend` will maintain version parity and always release simultaneously. When running release actions, versions are synced across both packages from a single source of truth (`jb-toc/package.json`)

## Automated releases with Jupyter Releaser

The extension repository is compatible with the Jupyter Releaser.

Check out the [workflow documentation](https://jupyter-releaser.readthedocs.io/en/latest/get_started/making_release_from_repo.html) for more information.

### Prepare the repo secrets and configure a PyPi trusted publisher:

1. Add tokens to the [Github Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets) in the repository:
   - `ADMIN_GITHUB_TOKEN` (with "public_repo" and "repo:status" permissions); see the [documentation](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
   - `NPM_TOKEN` (with "automation" permission); see the [documentation](https://docs.npmjs.com/creating-and-viewing-access-tokens)
2. Set up PyPI project by [adding a trusted publisher](https://docs.pypi.org/trusted-publishers/adding-a-publisher/)
   - The _workflow name_ is `publish-release.yml` and the _environment_ should be left blank unless you stored your secrets in an environment.
3. Ensure the publish release job as `permissions`: `id-token : write` (see the [documentation](https://docs.pypi.org/trusted-publishers/using-a-publisher/))

### Manually Set the Version
All pyproject.toml and package.json versions are synced with `jb-toc/pyproject.toml` during release actions.

1. Update the version in one place `jb-toc/pyproject.toml` 

### Run the Prep Release and Publish Release Workflows

1. Go to the GitHub Actions panel
2. Run the `Step 1: Prep Release` workflow
3. Check the draft changelog and update if necessary
4. Check the draft release and update if necessary
5. Run the `Step 2: Publish Release` workflow
