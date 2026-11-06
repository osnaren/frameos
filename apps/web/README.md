# FrameOS Web

The TanStack Start app — routes, the Sanity-backed data layer, and UI. Part
of the [FrameOS monorepo](../../README.md); see [docs/](../../docs/README.md)
for architecture, guides, and decision records.

## Commands

Run from this directory, or from the repo root with
`pnpm --filter @frameos/web <script>`:

| Script              | Purpose                               |
| ------------------- | ------------------------------------- |
| `dev`               | Dev server at `http://localhost:3000` |
| `build`             | Production build                      |
| `preview`           | Preview a production build locally    |
| `test`              | vitest run                            |
| `typecheck`         | `tsc --noEmit`                        |
| `lint` / `lint:fix` | ESLint                                |

See [docs/guides/getting-started.md](../../docs/guides/getting-started.md)
for fixture mode and adding your own photos, and
[docs/guides/content-management.md](../../docs/guides/content-management.md)
for connecting this app to the Sanity Studio at [`../studio`](../studio).
