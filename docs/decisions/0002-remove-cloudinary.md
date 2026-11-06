# 0002: Remove Cloudinary, consolidate photos onto Sanity

## Status

Accepted (August 2026).

## Context

The app had never actually gone live on Cloudinary — no `.env` in any
environment had real Cloudinary Admin API credentials configured, so the
site had only ever run in local-fixture mode. Before wiring up a live
Cloudinary account, it was worth asking whether a second photo-specific
provider was needed at all, given the project's explicit goal of running
comfortably within free tiers.

Three options were evaluated against current (2026) pricing and docs:

|                                   | Cloudinary Free                                    | R2 + Cloudflare Images                                                                  | Sanity-only                                                                  |
| --------------------------------- | -------------------------------------------------- | --------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Storage                           | 25 combined credits/mo (1 credit ≈ 1GB)            | 10GB free, zero egress ever                                                             | **100GB**                                                                    |
| Bandwidth                         | _shares the same 25-credit pool_                   | free (R2 egress is free)                                                                | **100GB/month**                                                              |
| Transforms                        | _shares the same 25-credit pool_ (~25k transforms) | 5,000 unique transforms/mo free, then new ones start failing                            | Included, effectively unlimited on-the-fly                                   |
| New accounts needed               | 1 (Cloudinary)                                     | 2 (Cloudflare + still need Sanity for content)                                          | **0** — already using Sanity                                                 |
| EXIF / palette / blur placeholder | Cloudinary extracts it                             | DIY — R2 is dumb storage, no extraction                                                 | **Automatic on upload**                                                      |
| New code required                 | None (already built)                               | A lot — R2 has no search/admin API; would need to build an ingest pipeline from scratch | Moderate — replace the Cloudinary provider with Sanity's native `image` type |

## Decision

Remove Cloudinary entirely. Consolidate photo storage, delivery, and
metadata extraction onto Sanity's native image asset pipeline:

- `photo` documents gain a real Sanity `image` field (hotspot cropping,
  auto EXIF/GPS/palette/blur-placeholder extraction) and a native `slug`
  field, replacing the old base64-encoded-Cloudinary-publicId slug scheme.
- `homePage.featuredPhotos`/`aboutPage.photoHighlights` become references to
  `photo` documents instead of raw Cloudinary asset refs.
- `sanityProvider` absorbs everything `cloudinaryProvider` used to do
  (search, pagination, per-photo lookup); `portfolioRepository` no longer
  merges two providers, since Sanity is now canonical for photos too.
- `image-policy.ts` builds Sanity CDN transform URLs
  (`?w=&h=&fit=crop|max&crop=focalpoint&fp-x=&fp-y=&auto=format&q=`) instead
  of Cloudinary transform strings; Sanity's own `lqip` is used directly as
  the blur placeholder (no separate request needed, unlike Cloudinary).
- Removed: `cloudinary`, `@cloudinary/url-gen`, `sanity-plugin-cloudinary`
  packages; the Cloudinary provider, its webhook route, and
  `src/lib/photo-slug.ts` (superseded by Sanity's native slug field).

## Consequences

- One fewer third-party account and dependency to manage; photos are edited
  in the same place as page content.
- Meaningfully more free-tier headroom on every axis (storage, bandwidth,
  transforms) than either alternative.
- `metadataVersion` bumped from `v1` to `v2` since the photo record's image
  identity changed shape (Cloudinary publicId → Sanity asset URL + rendering
  hints). No live data existed yet, so there was no migration to run.
- Trade-off: photo uploads happen through Sanity Studio's asset field rather
  than a purpose-built DAM UI or Cloudinary's dashboard. Acceptable for a
  single-editor personal portfolio; would need revisiting for a
  multi-contributor media-heavy site.
- Sanity's exact EXIF sub-field casing wasn't fully confirmed against a live
  project during this migration (no live Sanity project was available to
  test against) — the normalizer tries several plausible key spellings
  defensively, the same way the old Cloudinary normalizer did. Worth a smoke
  test the first time a real photo with EXIF is uploaded.
