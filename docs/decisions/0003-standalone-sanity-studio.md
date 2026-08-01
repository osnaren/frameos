# 0003: Move Sanity Studio into a standalone sibling project

## Status

Accepted (August 2026).

## Context

[0002](./0002-remove-cloudinary.md) added a Sanity schema and Studio
configuration (`sanity.config.ts`, `sanity.cli.ts`, `src/sanity/**`) directly
inside this app's repo. That's the quickest way to prototype a schema, but
the [Sanity best-practices guidance](https://www.sanity.io/docs) treats an
embedded Studio as legacy: it couples the Studio's dependency tree (`sanity`,
`@sanity/vision`, and everything they pull in — several hundred packages) to
the app's own `package.json`/lockfile, and risks a Vite-based app
accidentally bundling Studio-only code or environment variables into the
client.

The recommended pattern is a monorepo-style layout: the app and the Studio
are separate projects that each own their own dependencies, deploy
independently, and only share a live connection through the Content API
(`@sanity/client` on the app side).

## Decision

Move the schema and Studio config out of this repo into a standalone sibling
project, `../studio-frameos` (own git repo, own `package.json`, scaffolded
via `pnpm create sanity@latest`):

- `sanity.config.ts`, `sanity.cli.ts`, and `src/sanity/**` (schema documents,
  reusable objects, desk structure) are deleted from this repo.
- The same schema/structure content now lives at
  `studio-frameos/schemaTypes/**` and `studio-frameos/structure.ts`, with
  `studio-frameos/sanity.config.ts` wiring in the singleton document-actions
  filter exactly as before.
- This app keeps `@sanity/client` and `@sanity/webhook` (it only reads/
  verifies webhooks) and drops `sanity`/`@sanity/vision` entirely — neither
  package is needed to query content.
- `SANITY_PROJECT_ID`/`SANITY_DATASET` are still configured in this app's
  `.env` (read access only); the Studio project has its own copy of the
  same two values hardcoded in its config, since it needs them to know which
  project/dataset to edit.
- The dataset's `aclMode` is `public`, so no `SANITY_API_TOKEN` is required
  for this app to read published content in either project.

## Consequences

- This app's dependency tree and lockfile lose the Studio's entire
  dependency subtree (~600 packages) — faster installs, smaller attack
  surface, no risk of Studio-only code leaking into the app's Vite bundle.
- Running or deploying Studio is now `cd ../studio-frameos && pnpm dev` /
  `pnpm deploy` instead of `pnpm sanity:dev` / `pnpm sanity:deploy` from this
  repo. See [../guides/content-management.md](../guides/content-management.md).
- The two projects must be kept in the same parent directory
  (`frameos/` and `studio-frameos/` as siblings) for the relative-path
  instructions in the docs to hold; this isn't enforced by tooling, just a
  convention.
- Schema changes now require two steps instead of one: edit
  `studio-frameos/schemaTypes/**`, then `cd ../studio-frameos && pnpm deploy`
  to publish the schema to Sanity — this app's GROQ queries and TypeScript
  types must be kept in sync with that schema by hand, the same as before
  (there is no shared types package between the two projects).
- Trade-off accepted: one more top-level folder to keep track of, in
  exchange for matching the platform's recommended architecture and a
  meaningfully lighter app repo.
