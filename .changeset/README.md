# Changesets

Every publishable package change must include a Changeset. Pushes to `main`
update the release pull request; merging that pull request publishes through
`.github/workflows/release.yml`.

The first release of a new npm package name cannot use trusted publishing
because npm requires the package to exist before an OIDC publisher can be
configured. For that one release, configure a short-lived repository
`NPM_TOKEN`; remove it after publication and configure each package to trust
the GitHub Actions `release.yml` workflow.
