# FrameOS Studio

Sanity Studio for FrameOS — the editorial UI for `siteSettings`, the three
singleton pages (`homePage`, `aboutPage`, `contactPage`), and the `photo`
document library. Part of the [FrameOS monorepo](../../README.md); see
[docs/guides/content-management.md](../../docs/guides/content-management.md)
for the full guide to the schema and curation workflow.

## Commands

Run from this directory, or from the repo root with
`pnpm --filter @frameos/studio <script>`:

| Script      | Purpose                                       |
| ----------- | --------------------------------------------- |
| `dev`       | Local Studio at `http://localhost:3333`       |
| `build`     | Production build (`dist/`)                    |
| `deploy`    | Deploy the hosted Studio to Sanity's free CDN |
| `lint`      | ESLint (`@sanity/eslint-config-studio`)       |
| `typecheck` | `tsc --noEmit`                                |

## Structure

- `schemaTypes/documents/` — `siteSettings`, `homePage`, `aboutPage`,
  `contactPage`, `photo`
- `schemaTypes/objects/` — reusable field groups: `seo`, `cta`, `socialLink`
- `structure.ts` — pins the four singletons to a single fixed node each and
  disables their delete/duplicate actions (wired in `sanity.config.ts`)
