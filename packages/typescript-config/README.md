# @frameos/typescript-config

Shared base `tsconfig` for the workspace. Only holds compiler options that
are genuinely identical across every app today (`strict`, `skipLibCheck`,
`forceConsistentCasingInFileNames`) — each app's own `tsconfig.json` still
owns its target, module system, JSX mode, and lib list, since those
currently differ between `apps/web` (Vite/TanStack Start) and `apps/studio`
(Sanity Studio).

Usage:

```json
{
  "extends": "@frameos/typescript-config/base.json"
}
```
