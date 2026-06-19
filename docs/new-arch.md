# Finalized Architecture Plan: TanStack Start + Cloudinary + Sanity

**Summary**

- Target stack stays `TanStack Start + Cloudinary + Sanity`, hosted on Vercel.
- Cloudinary is the canonical photo system and image delivery layer.
- Sanity is the typed editorial CMS for site/page content and curated photo references.
- TanStack Start owns all runtime data access, caching, revalidation, and webhook handling.
- Contentful is fully removed.
- This revision makes explicit: layer contracts, failure behavior, pagination/query strategy, metadata evolution, observability, and image delivery rules.

**Layer Contracts**

- `cloudinaryProvider`
  - Exposes: `searchPhotos(filters)`, `getPhotoByPublicId(publicId)`, `getPhotoBySlug(slug)`, `listChangedPhotos(since)`, `verifyWebhook(request)`, `normalizeAsset(rawAsset)`.
  - Returns only provider-normalized photo records, never UI-ready view models.
  - Owns Cloudinary API details, search expressions, metadata mapping, signature verification, and rate-limit handling.
  - Forbidden from reading Sanity, applying page curation, building route URLs, or deciding public visibility beyond raw status rules.
- `sanityProvider`
  - Exposes: `getSiteSettings()`, `getHomePage()`, `getAboutPage()`, `getContactPage()`, `getCuratedPhotoRefs(pageId)`, `verifyWebhook(request)`, `listChangedDocuments(since)`.
  - Returns typed Sanity documents only.
  - Owns GROQ queries, schema typing, draft exclusion rules, and Sanity webhook verification.
  - Forbidden from querying Cloudinary, resolving image delivery URLs, or acting as the source of truth for photo metadata.
- `portfolioRepository`
  - Exposes: `getGalleryFeed(query)`, `getPhotoDetail(slug)`, `getHomeView()`, `getAboutView()`, `getContactView()`, `getSeoPayload(route)`, `reconcileFromWebhook(event)`, `reconcileSince(timestamp)`.
  - Merges Cloudinary photo data with Sanity editorial selections into domain/view models.
  - Owns publication filtering, fallback behavior, route-safe slug lookup, cache tag mapping, and canonical URL construction.
  - Forbidden from performing raw provider SDK calls outside the provider layer.
- UI/loaders/routes
  - Consume repository outputs only.
  - Forbidden from importing provider SDKs, env secrets, or raw CMS/API payload types.

**Data Models**

- `Photo`
  - `publicId`
  - `slug`
  - `status: 'draft' | 'published' | 'archived'`
  - `title`
  - `alt`
  - `caption`
  - `category`
  - `series`
  - `locationLabel`
  - `captureDate`
  - `sortOrder`
  - `metadataVersion`
  - extracted metadata: width, height, format, bytes, camera, lens, iso, shutterSpeed, aperture, gps, palette, createdAt
- `CloudinaryAssetRef`
  - `publicId`
  - `slug`
  - optional editorial override fields only if ever needed later
- Sanity documents stay typed and separate:
  - `siteSettings`
  - `homePage`
  - `aboutPage`
  - `contactPage`
  - reusable objects: `seo`, `socialLink`, `cta`, `cloudinaryAssetRef`

**Routing, Pagination, and Query Strategy**

- Public routes:
  - `/`
  - `/gallery`
  - `/photos/$slug`
  - `/about`
  - `/contact`
- Gallery URL contract:
  - `/gallery?category=street&series=monsoon&tag=night&after=cursor`
- Pagination:
  - Public API and loaders use cursor pagination, not page-number pagination.
  - Cursor is opaque and based on `(sortOrder desc, captureDate desc, publicId asc)`.
  - Default page size: `24`.
  - Max page size: `48`.
- Sorting:
  - Default sort order is `sortOrder desc`, then `captureDate desc`, then `publicId asc`.
  - No user-facing arbitrary sort options in v1 beyond curated/default ordering.
- Filters:
  - `category`: single value
  - `series`: single value
  - `tag`: repeatable query param allowed, interpreted as AND only if explicitly enabled later; v1 uses single tag filter
- Canonical URL rules:
  - Canonicalize query param order as `category`, `series`, `tag`, `after`.
  - Omit empty/default params from canonical URLs.
  - Paginated pages with `after` are indexable only if desired later; default is `noindex,follow` for cursor-paginated non-first pages.
  - Filtered first pages remain canonical to their exact filtered URL.
- Photo detail lookup:
  - Route resolves by `slug`.
  - If slug is unknown, return 404.
  - If asset exists but `status !== published`, return 404 publicly.

**Caching and Revalidation**

- Cache tags:
  - `site`
  - `page:home`
  - `page:about`
  - `page:contact`
  - `gallery`
  - `gallery:category:{value}`
  - `gallery:series:{value}`
  - `gallery:tag:{value}`
  - `photo:{slug}`
  - `photo-id:{publicId}`
- Vercel cache policy defaults:
  - Home/About/Contact/Photo detail: `max-age=60, s-maxage=3600, stale-while-revalidate=86400`
  - Gallery list/filter pages: `max-age=0, s-maxage=300, stale-while-revalidate=3600`
- TanStack loader cache defaults:
  - Page loaders `staleTime=60_000`, `gcTime=300_000`
  - Gallery loaders `staleTime=30_000`, `gcTime=300_000`
- Webhooks:
  - `POST /api/webhooks/cloudinary`
  - `POST /api/webhooks/sanity`
- Webhook handling steps:
  1. Verify signature
  2. Check idempotency
  3. Validate event freshness/order
  4. Map to affected tags
  5. Purge/invalidate tags
  6. Log outcome
- Sanity invalidation:
  - `siteSettings` invalidates `site` and page tags
  - page documents invalidate their own page tag
- Cloudinary invalidation:
  - photo asset changes invalidate `gallery`, relevant filter tags, `photo:{slug}`, and `photo-id:{publicId}`
  - curated page tags are also invalidated if Sanity references that asset

**Failure Behavior**

- Publication safety:
  - Always fail closed for unpublished content.
  - If provider state is ambiguous, never expose a `draft` or `archived` photo publicly.
- Cloudinary read failures:
  - If cached page data exists, serve stale and log provider failure.
  - If no cached data exists for gallery/detail, return a graceful error page or empty-safe state depending on route:
    - gallery: render error state with retry-safe message
    - photo detail: 503 if no cached published snapshot exists
- Sanity read failures:
  - Serve stale cached page content if available.
  - If unavailable, fall back to minimal safe defaults for `siteSettings` only.
  - Do not fabricate page bodies for Home/About/Contact if no cache exists; return 503-safe UI.
- Webhook failures:
  - If verification fails, reject with 401/403 and log security event.
  - If invalidation fails after verification, return non-2xx only when retry is useful.
  - If downstream purge fails but event is valid, log and queue retry.
- Redis/idempotency store failures:
  - Webhook endpoint remains available.
  - If dedupe store is down, process event in degraded mode with warning log and provider timestamp/order checks.
  - Handlers must remain side-effect-safe enough that duplicate invalidation is acceptable.
- Reconciliation:
  - Scheduled reconcile job runs hourly.
  - If a reconcile run fails, alert and retry next scheduled run.
  - Manual protected reconcile endpoint remains available for emergency catch-up.
- Out-of-order events:
  - Compare provider update timestamp against latest known timestamp.
  - Ignore older events for mutation decisions and invalidation decisions where a newer state is already known.

**Metadata Evolution**

- Add `metadataVersion` to normalized photo records.
- Current initial version: `v1`.
- Rules for schema evolution:
  - additive fields are allowed without route breakage
  - removed/renamed fields require a migration adapter in the repository
  - UI consumes repository shape, not raw provider metadata
- When adding a new field:
  - update provider normalization
  - bump `metadataVersion` only if backward compatibility needs explicit branching
  - add fallback defaults for older assets
- Backfill strategy:
  - use a repository-side default first so deployment is non-blocking
  - run a background reconciliation/backfill script against Cloudinary assets for permanent normalization if needed
- Migration assets:
  - create versioned scripts under a dedicated migration folder
  - record migration run timestamp and summary in logs
- Old assets:
  - remain readable even if missing newer fields
  - never block rendering because a newly introduced optional field is absent

**Observability**

- Add structured logs for:
  - webhook receipt
  - webhook verification result
  - dedupe decision
  - cache invalidation target list
  - reconcile start/end/result
  - provider API failures
  - degraded-mode fallbacks
- Log fields should include:
  - `provider`
  - `eventType`
  - `publicId`
  - `slug`
  - `documentId`
  - `cacheTags`
  - `idempotencyKey`
  - `requestId`
  - `durationMs`
  - `outcome`
- Error tracking:
  - add centralized error reporting for provider failures, webhook failures, reconcile failures, and route loader exceptions
  - capture enough context to replay/debug without leaking secrets
- Alerting:
  - repeated webhook verification failures
  - repeated provider 5xx/rate-limit failures
  - reconcile failures
  - idempotency store downtime
- Metrics:
  - webhook success/failure counts
  - cache invalidation counts
  - reconcile duration and drift
  - provider latency
  - stale-response fallback count

**Image Delivery Policy**

- Define named transformation presets in one shared image policy module:
  - `thumb`
  - `card`
  - `hero`
  - `detail`
  - `og`
- Default delivery rules:
  - auto format with AVIF/WebP capable negotiation
  - auto quality
  - DPR-aware responsive sizing
  - strip unnecessary metadata in delivery unless specifically needed
- Responsive breakpoints:
  - `320`, `480`, `640`, `768`, `1024`, `1280`, `1536`, `1920`
- Placeholder strategy:
  - use blurred low-quality placeholder derived from Cloudinary transform for gallery cards and detail views
  - dominant-color placeholder allowed as enhancement later
- Max dimensions per route:
  - gallery card: max rendered width `640`
  - home featured/slider: `1280`
  - hero panoramic background: `1920`
  - photo detail modal/page: `1600`
  - OG image: `1200x630`
- Rendering rules:
  - every rendered image goes through the shared Cloudinary image helper/component
  - no component may use raw `original_url`
  - background images must use transformed delivery URLs as well, not source originals
- Accessibility:
  - `alt` required for all published photos
  - if missing, photo cannot become `published`

**Security and Operational Rules**

- Secrets:
  - no provider secrets in browser env
  - webhook secrets stored server-side only
  - signed upload configuration stays server-controlled
- Sanity Studio access:
  - editor access restricted to authenticated project members
- Cloudinary upload preset:
  - locked preset with folder and allowed formats rules
- Public exposure:
  - only published photos are queryable through public loaders/routes
  - draft/archived assets are excluded before caching

**Migration and Verification**

- Migration sequence:
  1. Introduce TanStack Start app shell and route structure
  2. Build provider and repository layers
  3. Add Sanity Studio with typed schemas
  4. Add Cloudinary normalization and image policy
  5. Add cache tags, webhooks, idempotency, reconciliation
  6. Migrate pages and gallery/detail routes
  7. Remove Contentful
  8. Add tests, observability, and deployment config
- Acceptance criteria:
  1. A newly uploaded Cloudinary asset remains invisible until `status=published`.
  2. Publishing a photo updates gallery/detail pages without redeploy.
  3. Editing Sanity page content invalidates only the relevant cache tags.
  4. Duplicate webhook delivery does not cause repeated unsafe work.
  5. Provider downtime serves stale content where safe and never leaks unpublished content.
  6. Gallery pagination is cursor-based, stable, and canonicalized.
  7. Older assets continue rendering after schema additions.
  8. All image delivery uses policy-based Cloudinary transforms.
  9. Structured logs and error tracking are present for all critical flows.
  10. `typecheck`, `lint`, and tests pass.

**Assumptions**

- Vercel remains the primary hosting target.
- Upstash Redis is the default low-cost idempotency store.
- v1 does not include a custom in-site photo admin.
- `slug` is derived from stable Cloudinary identity unless an editorial override is explicitly added later.
