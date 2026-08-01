# Environment Variables

Copy `.env.example` to `.env` and fill in whatever integrations you have —
every variable below is optional. With nothing set, the app runs entirely on
the bundled fixture archive (see
[../guides/getting-started.md](../guides/getting-started.md)).

## Sanity — content and photos

| Variable                      | Required for live data?                      | Purpose                                                                                                 |
| ----------------------------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `SANITY_PROJECT_ID`           | Yes                                          | Your Sanity project id (manage.sanity.io)                                                               |
| `SANITY_DATASET`              | Yes                                          | Dataset name, typically `production`                                                                    |
| `SANITY_API_TOKEN`            | Only if the dataset is private (recommended) | Read token — Settings → API → Tokens                                                                    |
| `SANITY_API_VERSION`          | No (defaults to `2025-02-19`)                | GROQ API version pin                                                                                    |
| `SANITY_STUDIO_PROJECT_TITLE` | No                                           | Studio display title                                                                                    |
| `SANITY_WEBHOOK_SECRET`       | Only if using the webhook                    | Shared secret configured on the Sanity webhook — see [../guides/deployment.md](../guides/deployment.md) |

## Upstash Redis — webhook idempotency (optional)

| Variable                   | Purpose                                |
| -------------------------- | -------------------------------------- |
| `UPSTASH_REDIS_REST_URL`   | REST endpoint from the Upstash console |
| `UPSTASH_REDIS_REST_TOKEN` | REST token from the Upstash console    |

Without these, idempotency/ordering falls back to a degraded in-memory store
scoped to a single warm serverless instance.

## Vercel — cache invalidation REST fallback (optional)

| Variable            | Purpose                                                                                |
| ------------------- | -------------------------------------------------------------------------------------- |
| `VERCEL_API_TOKEN`  | Token with cache-purge access, used only if the runtime `invalidateByTag()` call fails |
| `VERCEL_PROJECT_ID` | Project id for the REST fallback call                                                  |
| `VERCEL_TEAM_ID`    | Team id, if the project belongs to a team                                              |

## Reconcile / cron auth

| Variable           | Purpose                                                                                       |
| ------------------ | --------------------------------------------------------------------------------------------- |
| `CRON_SECRET`      | Auto-sent by Vercel Cron as `Authorization: Bearer <value>` once set — no extra wiring needed |
| `RECONCILE_SECRET` | A second accepted token for manual/emergency reconcile calls                                  |

## Observability (optional)

| Variable     | Purpose                                                                                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `SENTRY_DSN` | Not wired to a real Sentry client today — structured JSON logs already go to Vercel Runtime Logs for free. Only set this after adding `@sentry/*` yourself. |

## Client-visible

| Variable        | Purpose                                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------------------- |
| `VITE_SITE_URL` | Absolute site URL for canonical links/SEO when it can't be inferred from request headers (e.g. local dev) |
