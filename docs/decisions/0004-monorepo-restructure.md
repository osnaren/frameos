# 0004: Restructure into a pnpm + Turborepo monorepo

## Status

Accepted (August 2026).

## Context

[0003](./0003-standalone-sanity-studio.md) moved Sanity Studio out of this
repo into a standalone sibling project, `studio-frameos`, specifically to
avoid coupling the Studio's dependency tree to the app's. That solved the
dependency-leakage problem, but introduced a different one: two separate git
repositories for one project, with no shared tooling, no single install step,
and — the gap 0003 explicitly flagged as a trade-off — no shared types
between the app and the content it renders.

A monorepo (one repository, multiple independently-versioned packages)
solves both without reintroducing the original coupling problem, as long as
each app still owns its own dependencies:

- pnpm workspaces give every package its own `package.json`/dependency graph
  while resolving internal cross-package imports (`workspace:*`) and sharing
  one lockfile.
- Turborepo fans a single command (`turbo run build`) out to every package
  that defines it, running independent packages in parallel and skipping
  ones that don't define that script — no per-package tsconfig/eslint
  coupling required.

## Decision

Fold `studio-frameos` back into this repository as `apps/studio`, alongside
the existing app moved to `apps/web`:

- **History preserved**: `studio-frameos`'s commits were brought in via
  `git subtree add --prefix=apps/studio --squash`, not a plain file copy.
- **pnpm workspace** (`pnpm-workspace.yaml`): `packages: [apps/*, packages/*]`,
  plus a `catalog:` for versions that must stay in sync across packages
  (`react`, `react-dom`, `typescript`, `eslint`, `prettier`, `@types/react`).
- **Turborepo** (`turbo.json`): `build`, `dev`, `lint`, `lint:fix`,
  `typecheck`, `test` tasks. `dev` is `persistent`/uncached (long-running
  servers); the others cache normally.
- **Two new shared packages**:
  - `packages/typescript-config` — a tiny base `tsconfig` holding only the
    compiler options genuinely identical across both apps today (`strict`,
    `skipLibCheck`, `forceConsistentCasingInFileNames`). Deliberately
    minimal — `apps/web` and `apps/studio` target different module systems
    and JSX modes, so those stay app-specific rather than being forced into
    a shared config that doesn't fit either cleanly.
  - `packages/content-schema` — closes the gap 0003 flagged: the
    `SiteSettings`/`HomePageContent`/`AboutPageContent`/`ContactPageContent`/
    `Photo` shapes now live in one place. No build step — it's TypeScript
    source consumed directly (bundler module resolution). `apps/web`'s
    `src/types/{content,photo}.ts` re-export from it instead of redefining
    the same interfaces, so no call site elsewhere in the app had to change.
    `apps/studio`'s schema remains hand-written and is still the upstream
    source of truth for field shape — this package documents that, it
    doesn't generate from it.
- **Root-level tooling** (prettier, cspell, husky, lint-staged) moved to the
  repo root and now runs across the whole workspace in one pass;
  `apps/studio` keeps its own embedded `"prettier"` override (Sanity's
  ecosystem convention is `bracketSpacing: false`, unlike this project's
  default) since Prettier resolves the nearest config per file.
- Package names are scoped (`@frameos/web`, `@frameos/studio`,
  `@frameos/typescript-config`, `@frameos/content-schema`) to avoid the
  name collision both apps previously had (both were literally named
  `"frameos"`).

## Consequences

- One `pnpm install`, one lockfile, one `git clone` for the whole project —
  the two-separate-repos friction from 0003 is gone.
- `apps/web` and `apps/studio` still fully own their own dependency trees;
  Turborepo tasks are opt-in per package (a package with no `lint` script is
  just skipped), so this doesn't reintroduce the coupling 0003 removed.
- Deploy targets are unchanged in kind, just in path: the Vercel project's
  Root Directory must point at `apps/web` (a one-time manual dashboard
  change, documented in [../guides/deployment.md](../guides/deployment.md));
  Studio still deploys independently via `pnpm --filter @frameos/studio deploy`.
- `packages/content-schema` is hand-maintained, not generated from
  `apps/studio`'s schema — adding a field in Studio still requires a manual,
  matching edit here. A future improvement would be generating this package
  from Sanity's schema (`sanity schema extract` + typegen) instead; not done
  now to keep this change scoped to structure, not tooling.
- The original standalone `studio-frameos` checkout (and its git history)
  remains on disk as a local fallback but is no longer the source of truth —
  `apps/studio` in this repo is.
