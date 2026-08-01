# FrameOS — Pocket Worlds

A photography portfolio built with TanStack Start (React 19 + Vite), Tailwind
CSS v4, and Sanity for both editorial content (site copy, pages) and photo
storage/delivery (native image assets, on-the-fly transforms, EXIF/palette
extraction). Deployed on Vercel.

Without any Sanity credentials configured, the app runs entirely on a bundled
fixture archive — the real "Pocket Worlds" launch photo set and editorial
copy — so it's fully functional out of the box. Add credentials later and the
data layer switches to live Sanity data automatically, with no code changes.

## Stack

- **App**: TanStack Start, React 19, TypeScript (strict), Tailwind CSS v4
- **Content + photos**: Sanity (site settings, Home/About/Contact pages, the photo library — one provider for everything)
- **Caching/invalidation**: Vercel CDN cache tags + webhooks + a scheduled reconcile job
- **Idempotency**: Upstash Redis (optional; degrades gracefully to in-memory)
- **Hosting**: Vercel

📖 **Full documentation lives in [`docs/`](docs/README.md)** — architecture,
guides for local setup/content/deployment, decision records, and an
environment variable reference.

## Quick start

```bash
pnpm install
cp .env.example .env   # fill in whatever integrations you have — all optional
pnpm dev
```

Requires Node `>=24.12.0` and pnpm (pinned via `packageManager` in
`package.json`). The dev server runs at `http://localhost:3000`.

See [docs/guides/getting-started.md](docs/guides/getting-started.md) for
fixture mode, adding your own photos, and validation commands, and
[docs/guides/content-management.md](docs/guides/content-management.md) for
connecting a real Sanity project.

## Scripts

| Script                   | Purpose                                 |
| ------------------------ | --------------------------------------- |
| `pnpm dev`               | Start the app dev server                |
| `pnpm build`             | Production build                        |
| `pnpm preview`           | Preview a production build locally      |
| `pnpm test`              | Run the vitest suite                    |
| `pnpm typecheck`         | `tsc --noEmit` across the whole project |
| `pnpm lint` / `lint:fix` | ESLint                                  |
| `pnpm check`             | Prettier write + ESLint fix             |

Sanity Studio is a separate project — see
[docs/guides/content-management.md](docs/guides/content-management.md).

## Project structure

- `src/routes/` — TanStack Start file-based routes (pages + `api/**` handlers)
- `src/server/` — the Sanity provider, the `portfolioRepository` that turns it
  into view models, caching, webhooks, reconcile, observability
- `src/components/`, `src/content/`, `src/lib/` — UI, editorial/local fixture
  content, and shared utilities (image policy, gallery search, etc.)
- `docs/` — architecture, guides, decision records (see [docs/README.md](docs/README.md))
- `legacy-src/` — visual/reference material only from the pre-migration app;
  not built, tested, or linted
- `../studio-frameos` — the standalone Sanity Studio (sibling project, own
  repo) that owns the schema/structure; not part of this repo
