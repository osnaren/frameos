# @frameos/content-schema

Type-only package: the shared shape of Sanity content (site settings, the
three pages, and a photo) consumed by `apps/web`. No build step — consumers
resolve `./src/index.ts` directly (bundler module resolution), so editing a
type here is picked up immediately with no publish/build cycle.

`apps/studio`'s schema (`schemaTypes/**`) is the upstream source of truth for
these shapes — Sanity schema fields aren't derived from TypeScript types, so
if you add/rename/remove a field in the schema, update the matching
interface here by hand. This package exists to give `apps/web` ONE place to
import these types from, instead of redefining them per-consumer.
