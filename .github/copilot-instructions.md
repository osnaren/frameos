# Project Guidelines

## Architecture

- Active application code lives in `src/` (frontend + routes), `src/server/` (BFF/server logic), and `src/sanity/` (Sanity schemas).
- Treat `legacy-src/` as **visual/reference material only** while migration continues.
- TanStack file-based routing is authoritative: page routes in `src/routes/*.tsx`, API handlers in `src/routes/api/**`.
- Server flow is `routes` -> `src/server/server-functions/portfolio.ts` -> `src/server/repository/portfolio.ts` -> provider implementations in `src/server/providers/*`.
- Contracts/interfaces belong in `src/server/contracts/*`. Keep providers/repository aligned with those contracts.
- Do not hand-edit generated route artifacts such as `src/routeTree.gen.ts`.

## Build and Test

- Use Node `>=24.12.0` (see `package.json` engines).
- Primary commands:
  - `npm run dev`
  - `npm run build`
  - `npm run test`
  - `npm run typecheck`
  - `npm run lint`
  - `npm run check` (auto-format + auto-fix lint)
  - `npm run sanity:dev` (Sanity Studio)
- Vitest test locations are `src/**/tests/**/*.test.ts(x)` and `tests/**/*.test.ts(x)`.
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
- Photo slug handling must use `createPhotoSlug` / `decodePhotoSlug` from `src/lib/photo-slug.ts`.
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
- `package.json`
- `eslint.config.js`
- `prettier.config.js`
- `src/styles.css`
- `src/routes/gallery.tsx`
- `src/routes/photos.$slug.tsx`
- `src/server/server-functions/portfolio.ts`
- `src/server/repository/portfolio.ts`
- `src/routes/api/webhooks/sanity.ts`
- `src/routes/api/webhooks/cloudinary.ts`
