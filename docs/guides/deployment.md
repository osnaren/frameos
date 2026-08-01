# Deployment

FrameOS is designed to run on **Vercel's Hobby (free) plan**, alongside
**Sanity's Free plan** and (optionally) **Upstash Redis's Free plan** — see
[../decisions/0002-remove-cloudinary.md](../decisions/0002-remove-cloudinary.md)
for the free-tier comparison that led to this architecture.

## Vercel setup

1. Import the repo into Vercel.
2. Set the environment variables from
   [../reference/environment-variables.md](../reference/environment-variables.md)
   in the project's Settings → Environment Variables.
3. Deploy. `vercel.json` already declares the reconcile cron job — no extra
   configuration needed.

### Cron jobs and the Hobby plan

`vercel.json`'s cron entry runs the reconcile endpoint **once a day**
(`0 3 * * *`), not hourly. This is a hard Vercel Hobby-plan constraint — cron
expressions that would run more than once a day fail deployment outright on
that plan. This is fine functionally: the Sanity webhook (below) is the
real-time invalidation path, and the cron job is only a drift-correcting
safety net. If the project ever moves to a paid Vercel plan, this can be
raised to hourly or more frequent in `vercel.json`.

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

Studio is a separate project (`../studio-frameos`) with its own deploy
target — it is **not** part of this app's Vercel deployment.

```bash
cd ../studio-frameos
pnpm deploy
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
