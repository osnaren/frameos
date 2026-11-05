# Deployment

FrameOS is designed to run on **Vercel's Hobby (free) plan**, alongside
**Sanity's Free plan** and (optionally) **Upstash Redis's Free plan** — see
[../decisions/0002-remove-cloudinary.md](../decisions/0002-remove-cloudinary.md)
for the free-tier comparison that led to this architecture.

## Vercel setup

1. Import the repo into Vercel. Set the project's **Root Directory** (Project
   Settings → General) to `apps/web` — Vercel then auto-detects the
   Turborepo + pnpm workspace and builds only the web app. If this project
   was already deployed before the monorepo restructure, update this setting
   once by hand — it can't be set from a file in the repo.
2. Set the environment variables from
   [../reference/environment-variables.md](../reference/environment-variables.md)
   in the project's Settings → Environment Variables.
3. Deploy. `apps/web/vercel.json` already declares the reconcile cron job —
   no extra configuration needed.
4. Once a custom domain is attached, set `VITE_SITE_URL` to it so canonical
   links, social cards and the sitemap all use that one host (see
   [../reference/environment-variables.md](../reference/environment-variables.md#client-visible)).
5. Optional: in the Vercel project, enable **Analytics** (Web Analytics) and
   **Speed Insights**. The app already ships both components in production
   builds (`src/components/layout/VercelInsights.tsx`); they send nothing until
   enabled. Both are cookie-less.

### What the deployment serves

- **Headers.** Every response carries `X-Content-Type-Options: nosniff`,
  `Referrer-Policy: strict-origin-when-cross-origin`, `X-Frame-Options:
SAMEORIGIN` and a closed `Permissions-Policy`. Hashed build assets and fonts
  (`/assets/**`) are cached immutably; photos, icons and the default share
  image are cached for a day in browsers and a month at the edge, revalidating
  in the background. These are Nitro `routeRules` in `apps/web/vite.config.ts`,
  so they compile into Vercel's build output and also apply to the local Node
  server. Page and data responses keep their own cache-tag headers
  ([../architecture/caching-and-webhooks.md](../architecture/caching-and-webhooks.md)).
- **SEO.** Every route has a title, description, canonical, Open Graph and
  Twitter card (photo pages share the photo itself; worlds share their cover;
  other pages fall back to `public/og-default.jpg`), and JSON-LD (`WebSite` and
  `Person` on the home page (referenced from every other graph), `Photograph` on photo pages, `CollectionPage` on worlds
  and the Index). Logic lives in `src/lib/seo.ts`.
- **`/sitemap.xml` and `/robots.txt`** are generated from the repository: every
  public route, world and published photo. Hidden worlds, drafts and archived
  photos never appear; `/api/` is disallowed.
- **Fonts** are self-hosted (`@fontsource`), with the two above-the-fold files
  preloaded and metric-matched system fallbacks so the swap causes no layout
  shift. No requests go to Google Fonts.
- **Errors** are structured JSON logs in Vercel's Runtime Logs. `SENTRY_DSN` is
  not wired to an SDK yet.

### Cron jobs and the Hobby plan

`apps/web/vercel.json`'s cron entry runs the reconcile endpoint **once a
day** (`0 3 * * *`), not hourly. This is a hard Vercel Hobby-plan constraint —
cron expressions that would run more than once a day fail deployment
outright on that plan. This is fine functionally: the Sanity webhook (below)
is the real-time invalidation path, and the cron job is only a
drift-correcting safety net. If the project ever moves to a paid Vercel
plan, this can be raised to hourly or more frequent in `apps/web/vercel.json`.

## Configuring the Sanity webhook

In your Sanity project → API → Webhooks, create a webhook:

- **URL**: `https://<your-domain>/api/webhooks/sanity`
- **Dataset**: your production dataset
- **Trigger on**: Create, Update, Delete
- **Projection**:

  ```groq
  {"documentId": _type, "slug": slug.current, "_updatedAt": _updatedAt}
  ```

- **Secret**: generate one and set it as `SANITY_WEBHOOK_SECRET` in Vercel.

See [../architecture/caching-and-webhooks.md](../architecture/caching-and-webhooks.md)
for exactly what happens when this webhook fires.

## Deploying Sanity Studio

Studio (`apps/studio`) is a separate deployable package — it is **not** part
of the web app's Vercel deployment.

```bash
pnpm --filter @frameos/studio deploy
```

Sanity hosts the built Studio for free at `https://<project-id>.sanity.studio`
(or a custom hostname you choose on first deploy). This only needs to be
re-run when the schema changes; content edits in Studio don't require a
redeploy.

## Free-tier limits to be aware of

| Service            | Free tier                                                                      | Notes                                                                                                                                                                                                          |
| ------------------ | ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vercel Hobby       | Cron: 1×/day max. Function usage: generous for a personal portfolio's traffic. | CDN caching (`s-maxage`/`stale-while-revalidate`) works on all plans, including Hobby.                                                                                                                         |
| Sanity Free        | 100GB asset storage, 100GB bandwidth/month, included image transform pipeline  | Covers photo storage _and_ delivery — no separate image CDN needed.                                                                                                                                            |
| Upstash Redis Free | 10,000 commands/day                                                            | Comfortably covers webhook idempotency/ordering for a personal portfolio's webhook volume. Optional — the app degrades gracefully to an in-memory store without it (safe, just not shared across cold starts). |

## Keeping the dataset private

Set your Sanity dataset to **private** (not public) and configure
`SANITY_API_TOKEN` with read access. This ensures draft/archived photos can
never be fetched directly by anyone who discovers your project id — the
`published` perspective alone is not a substitute for this if the dataset is
public.
