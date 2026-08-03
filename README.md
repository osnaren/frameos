# FrameOS — Pocket Worlds

A photography portfolio built with TanStack Start (React 19 + Vite), Tailwind
CSS v4, and Sanity for both editorial content (site copy, pages) and photo
storage/delivery (native image assets, on-the-fly transforms, EXIF/palette
extraction). Deployed on Vercel.

This is a **pnpm + Turborepo monorepo**: the app and its Sanity Studio are
separate, independently deployable packages that share tooling and a single
lockfile — see [Project structure](#project-structure) below and
[docs/architecture/overview.md](docs/architecture/overview.md) for why.

Without any Sanity credentials configured, the app runs entirely on a bundled
fixture archive — the real "Pocket Worlds" launch photo set and editorial
copy — so it's fully functional out of the box. Add credentials later and the
data layer switches to live Sanity data automatically, with no code changes.

## Stack

- **App**: TanStack Start, React 19, TypeScript (strict), Tailwind CSS v4
- **Content + photos**: Sanity (site settings, Home/About/Contact pages, the photo library — one provider for everything)
- **Caching/invalidation**: Vercel CDN cache tags + webhooks + a scheduled reconcile job
- **Idempotency**: Upstash Redis (optional; degrades gracefully to in-memory)
- **Hosting**: Vercel (app), Sanity (Studio)
- **Monorepo**: pnpm workspaces + Turborepo

📖 **Full documentation lives in [`docs/`](docs/README.md)** — architecture,
guides for local setup/content/deployment, decision records, and an
environment variable reference.

## Quick start

```bash
pnpm install
cp apps/web/.env.example apps/web/.env   # fill in whatever integrations you have — all optional
pnpm dev
```

Requires Node `>=24.12.0` and pnpm (pinned via `packageManager` in
`package.json`). `pnpm dev` starts every app in the workspace (the web app at
`http://localhost:3000`, Studio at `http://localhost:3333`) — use
`pnpm dev:web` or `pnpm dev:studio` to run just one.

See [docs/guides/getting-started.md](docs/guides/getting-started.md) for
fixture mode, adding your own photos, and validation commands, and
[docs/guides/content-management.md](docs/guides/content-management.md) for
connecting a real Sanity project.

## Scripts

Root scripts fan out to every package in the workspace via Turborepo (see
[turbo.json](turbo.json)):

| Script                         | Purpose                                            |
| ------------------------------ | -------------------------------------------------- |
| `pnpm dev`                     | Start every app's dev server                       |
| `pnpm dev:web` / `dev:studio`  | Start just the web app or just Studio              |
| `pnpm build`                   | Production build of every app                      |
| `pnpm test`                    | Run the web app's vitest suite                     |
| `pnpm typecheck`               | `tsc --noEmit` in every package                    |
| `pnpm lint` / `lint:fix`       | ESLint in every package                            |
| `pnpm format` / `format:check` | Prettier, across the whole repo                    |
| `pnpm check`                   | Prettier write + ESLint fix, across the whole repo |
| `pnpm spellcheck`              | cspell, across the whole repo                      |

Run a script for a single package directly with pnpm's filter flag, e.g.
`pnpm --filter @frameos/web test`.

## Project structure

```
apps/
  web/          TanStack Start app — see apps/web
  studio/       Sanity Studio — see apps/studio
packages/
  typescript-config/  Shared tsconfig base
  content-schema/      Shared content/photo TypeScript types (types-only, no build step)
docs/           Architecture, guides, decision records (see docs/README.md)
media-production/  Creative-production inputs/outputs for the Pocket Worlds photo/video set
```

- `apps/web/src/routes/` — TanStack Start file-based routes (pages + `api/**` handlers)
- `apps/web/src/server/` — the Sanity provider, the `portfolioRepository` that
  turns it into view models, caching, webhooks, reconcile, observability
- `apps/web/src/components/`, `src/content/`, `src/lib/` — UI, editorial/local
  fixture content, and shared utilities (image policy, gallery search, etc.)
- `apps/studio/schemaTypes/` — Sanity schema (documents + reusable objects);
  `apps/studio/structure.ts` — the desk structure pinning singleton pages
