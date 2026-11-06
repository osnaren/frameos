# 0001: TanStack Start + a headless CMS, retire Contentful

## Status

Accepted (2026). Partially superseded by
[0002-remove-cloudinary.md](./0002-remove-cloudinary.md) (the photo-storage
half of this decision).

## Context

The original app was built around Contentful for content and a mix of ad-hoc
image handling. It needed:

- Server-rendered pages with good SEO (photo detail pages, galleries) —
  ruling out a client-only SPA.
- A typed, editor-friendly CMS for site copy and page content.
- A dedicated system for photo storage, responsive delivery, and metadata
  (EXIF, dimensions) at a personal-portfolio scale and budget.
- A caching/invalidation story that doesn't require redeploying on every
  content edit.

## Decision

- Adopt **TanStack Start** (React 19, Vite, SSR) as the app framework,
  deployed on **Vercel**.
- Adopt **Sanity** as the typed editorial CMS for site/page content.
- Adopt **Cloudinary** as the canonical photo system and image delivery
  layer (search API, on-the-fly transforms, EXIF extraction).
- Retire Contentful entirely.
- Build a strict provider/repository layering
  (`cloudinaryProvider`/`sanityProvider` → `portfolioRepository` → routes) so
  the two content sources could be swapped or merged later without touching
  UI code — see [../architecture/data-layer.md](../architecture/data-layer.md).
- Add cache tags, webhook-driven invalidation, idempotency (Upstash Redis),
  and a scheduled reconcile job as a safety net.

## Consequences

- Clean separation of concerns made it possible to later remove Cloudinary
  entirely (see 0002) by only rewriting the provider layer — the
  repository's public contract, routes, and UI were largely untouched.
- Cloudinary's free tier (25 combined credits/month across storage,
  bandwidth, and transforms) turned out to be the tightest constraint in the
  whole stack once real usage was considered, which is what prompted 0002.
