# Project Guidelines

## Architecture

- This is a pnpm + Turborepo monorepo: `apps/web` (the TanStack Start app) and `apps/studio` (the standalone Sanity Studio) are independent packages that share a single lockfile and root-level tooling. This app only queries Sanity via `@sanity/client`; it does not host or embed the Studio.
- Active application code lives in `apps/web/src/` (frontend + routes) and `apps/web/src/server/` (BFF/server logic).
- Shared packages live in `packages/`: `@frameos/typescript-config` (base tsconfig) and `@frameos/content-schema` (shared content/photo TypeScript types, types-only, no build step).
- Treat `legacy-src/` as **visual/reference material only** while migration continues.
- TanStack file-based routing is authoritative: page routes in `apps/web/src/routes/*.tsx`, API handlers in `apps/web/src/routes/api/**`.
- Server flow is `routes` -> `apps/web/src/server/server-functions/portfolio.ts` -> `apps/web/src/server/repository/portfolio.ts` -> provider implementations in `apps/web/src/server/providers/*`.
- Contracts/interfaces belong in `apps/web/src/server/contracts/*`. Keep providers/repository aligned with those contracts.
- Do not hand-edit generated route artifacts such as `apps/web/src/routeTree.gen.ts`.

## Build and Test

- Use Node `>=24.12.0` (see root `package.json` engines).
- Run everything from the repo root — Turborepo fans each script out to every package:
  - `npm run dev` (or `dev:web` / `dev:studio` to run just one app)
  - `npm run build`
  - `npm run test`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run check` (auto-format + auto-fix lint)
- Run a script for a single package directly with `pnpm --filter @frameos/web <script>` or `pnpm --filter @frameos/studio <script>`.
- Vitest test locations are `apps/web/src/**/tests/**/*.test.ts(x)` and `apps/web/tests/**/*.test.ts(x)`.
- `legacy-src/**` is excluded from tests/lint in current config and should not receive routine feature changes.

## Code Style and Imports

- TypeScript strict mode is enabled; prefer explicit typing and avoid `any`.
- Prefer `@/*` imports (and preserve existing `#/*` imports where present).
- Keep import ordering and grouping compatible with `eslint.config.js` (`import/order` is enforced).
- Preserve formatting conventions from `prettier.config.js` (single quotes, no semicolons, width 100).
- Naming:
  - Components: PascalCase files (e.g., `PhotoMasonry.tsx`)
  - Hooks: `use*.ts`
  - Route params follow TanStack route naming (e.g., `photos.$slug.tsx`)

## Data and Runtime Conventions

- Environment parsing is centralized in `src/server/env.ts`; add new server env vars there with zod validation.
- Provider fallbacks to fixtures can happen in development when config is missing; do not rely on that behavior for production logic.
- Gallery filtering/search normalization must use `src/lib/gallery-search.ts`.
- Photo slugs are Sanity's native `slug` field (`photo.slug.current`) — there is no separate slug-encoding utility.
- Keep caching and invalidation behavior consistent with `src/server/cache/*` and repository reconciliation flows.

## API, Webhook, and Reconciliation Rules

- Webhook endpoints (`src/routes/api/webhooks/*.ts`) must preserve:
  - signature verification
  - idempotency checks
  - stale-event protection
    before reconciliation.
- Reconcile endpoint (`src/routes/api/reconcile/content.ts`) requires token auth behavior compatible with `RECONCILE_SECRET` / `CRON_SECRET`.

## UI Guidance During Migration (legacy-src reference)

- New work should be implemented in `src/`, but visual direction can reference `legacy-src/` patterns:
  - warm editorial palette and typography
  - rounded, soft panel/card surfaces
  - restrained motion (subtle hover lift, smooth transitions)
  - theme-aware styling via CSS variables
- Prefer adapting patterns over reusing legacy modules directly.

## Key References (link, don’t embed)

- `README.md`
- `docs/README.md` (full architecture, guides, and decision records)
- `package.json`
- `eslint.config.js`
- `prettier.config.js`
- `src/styles.css`
- `src/routes/gallery.tsx`
- `src/routes/photos.$slug.tsx`
- `src/server/server-functions/portfolio.ts`
- `src/server/repository/portfolio.ts`
- `src/routes/api/webhooks/sanity.ts`
