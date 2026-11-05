# Content Management (Sanity Studio)

Sanity Studio lives at `apps/studio` in this monorepo — its own deployable
package with its own `package.json`, separate from the web app. The web app
(`apps/web`) only reads content via `@sanity/client`.

## Running Studio

```bash
pnpm --filter @frameos/studio dev       # local Studio at http://localhost:3333
pnpm --filter @frameos/studio deploy    # deploy the hosted Studio
```

Or `cd apps/studio` and run `pnpm dev`/`pnpm deploy` directly. `pnpm dev:studio`
from the repo root also works (see root [package.json](../../package.json)).

The web app requires `SANITY_PROJECT_ID` and `SANITY_DATASET` in
`apps/web/.env` — see
[../reference/environment-variables.md](../reference/environment-variables.md).
The Studio package itself has `projectId`/`dataset` hardcoded in its own
`apps/studio/sanity.config.ts`/`sanity.cli.ts` (no `.env` needed there).

## Document types

| Document       | Purpose                                              | Singleton?                   |
| -------------- | ---------------------------------------------------- | ---------------------------- |
| `siteSettings` | Brand mark, title, description, socials, default SEO | Yes                          |
| `homePage`     | Home page copy + up to 6 featured photos             | Yes                          |
| `aboutPage`    | About/Field Notes copy + up to 6 highlighted photos  | Yes                          |
| `contactPage`  | Contact/Signal page copy                             | Yes                          |
| `world`        | A flexible photographic world and its visual mood    | No                           |
| `photo`        | The photo library — one document per photograph      | No (the actual content list) |

Singletons are pinned to a single fixed node in Studio's structure
(`apps/studio/structure.ts`) — there's always exactly one
`siteSettings`, `homePage`, `aboutPage`, `contactPage`, and their
delete/duplicate actions are disabled, so an editor can't accidentally
create a second copy or delete the only one.

## Worlds

Worlds are first-class documents rather than a hardcoded dropdown. Every active world
that has at least one published photograph appears, with no code change, in:

- the home page, as a **pocket planet** in the opening orrery and as its own chapter (see
  [../pocket-worlds.md](../pocket-worlds.md));
- the Index filters (`/archive?world=<slug>`);
- its own page at `/worlds/<slug>`, with previous/next world navigation;
- every photo page that belongs to it.

Set a world to **Hidden** to keep the document and its photo relationships without
exposing it anywhere public. Every photo references a world document, so renaming a
world or changing its colours happens once.

### Adding a world

1. **Worlds → Create**. Fill in **Name** (the slug is generated from it), the
   **One-line statement**, and optionally a **Description** (used for search and sharing).
2. **Organization**: keep **Visibility** on _Active_ and set **Navigation order**: lower
   numbers come first everywhere (home, Index filters, world navigation). The launch
   worlds use 10, 20, 30… so you can slot a new one in between.
3. **Atmosphere**: pick the three **Photographic atmosphere** colours (hex):
   - _Ambient wash_: a pale tint for backgrounds and the planet's halo;
   - _Depth tone_: a deep companion colour for overlays and the dark theme;
   - _Focus accent_: numbers, focus rings, and highlights.

   Sampling them from the world's best photograph works well.

4. Publish. Then move or upload photos into it (set each photo's **World**). The world
   appears on the site as soon as its first photo is published.
5. Optionally choose a **Lead photograph** (the representative frame for sharing and
   navigation) and tune its **Pocket planet** (below).

### Tuning a world's pocket planet

Under **Atmosphere → Pocket planet** (both optional):

| Field                 | Default             | Effect                                                                                                                                                                       |
| --------------------- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Planet photograph** | the lead photograph | The frame curled into the planet. The world's home chapter also unrolls into it and opens on it. Any published photo works, even one from another world.                     |
| **Horizon**           | 0.55                | How much of the frame becomes ground, 0.2–1.2. Lower gathers the bottom of the photo into a tight core and gives the sky most of the disc; higher gives a broad, flat world. |

Landscapes with ground at the bottom and sky at the top make the clearest planets.
Close-ups and top-down shots make kaleidoscopes, which also work. Very dark photos make
dark planets, so pick another frame for those worlds.

## The `photo` document

| Field                                                              | Notes                                                                                                                                                                                                                         |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `image`                                                            | The photograph itself. Drop an image in and Sanity automatically extracts dimensions, a color palette, a blur placeholder, EXIF, and GPS. Set a hotspot (drag the focal point) for better cropping on card/thumbnail presets. |
| `slug`                                                             | Auto-generated from `title`; this is the photo's public URL (`/photos/<slug>`).                                                                                                                                               |
| `title`, `alt`, `description`, `caption`                           | `alt` is required — Sanity blocks publishing without it.                                                                                                                                                                      |
| `worldRef`                                                         | Reference to a published `world` document. Create the world first, then select it here.                                                                                                                                       |
| `series`, `locationLabel`, `tags`                                  | Optional organization/filtering fields.                                                                                                                                                                                       |
| `archived`                                                         | Hide this photo from every public page without deleting it. Use this instead of unpublishing if you want to keep the document around.                                                                                         |
| `camera`, `lens`, `focalLength`, `iso`, `shutterSpeed`, `aperture` | Leave blank to use the image's auto-extracted EXIF, or fill in manually to override (e.g. for scanned film with no EXIF, or to correct a camera's wrong clock/date).                                                          |
| `captureDate`                                                      | Same override behavior as the capture-data fields above.                                                                                                                                                                      |
| `sortOrder`                                                        | Higher numbers sort first in the gallery.                                                                                                                                                                                     |

### Adding a photo

1. **Photos → Create**, drop the image in. Sanity extracts dimensions, palette, blur
   placeholder, EXIF and GPS automatically.
2. Fill **Title** and **Alt text** (required: publishing is blocked without it), and
   optionally **Caption** / **Description**.
3. Pick its **World**. Add **Tags** (each becomes a filter link on the photo page and in
   the Index), a **Location label** and **Series** if useful.
4. Drag the **hotspot** onto the subject so square/portrait crops keep it in frame.
5. Leave the capture fields empty to use the camera's EXIF, or fill them to override.
6. Publish. The photo appears in its world, the Index, the home chapter's contact strip,
   and previous/next navigation, with no code changes.

All capture metadata (camera, lens, focal length, aperture, shutter, ISO, dimensions,
capture date, location) is shown in the photo page's capture-data panel. Fields without a
value are hidden, never guessed.

### Draft vs. published vs. archived

- **Draft**: the normal Sanity "unpublished changes" state. Draft photos are
  never returned by any public query — they're invisible to the site by
  construction, not by a status check.
- **Published**: visible everywhere once you hit Publish in Studio (subject
  to the free-tier caching/webhook delay described in
  [deployment.md](./deployment.md)).
- **Archived**: check the `archived` box on an already-published photo to
  retire it from public view while keeping the document (and its editorial
  history) around.

## Featuring photos on Home / About

The home page is built from worlds (above), not from a featured list.
`homePage` still supplies its **eyebrow**, **headline**, **intro** and **SEO**.
`homePage.featuredPhotos` is kept for sharing/SEO fallbacks, and
`aboutPage.photoHighlights` picks the Field Notes stills. Both are references to
existing `photo` documents (1–6 each), so a photo's title/alt/camera data only ever
lives in one place.

## Fixture mode: adding content without Sanity

Without Sanity credentials the site runs on `apps/web/src/content/worlds.ts`:

- **Worlds**: the `worlds` array (same fields as the Studio document, including
  `planet: { photo: { slug }, horizon }`).
- **Photos**: put the original in `apps/web/photo-source/<id>.<ext>`, run
  `pnpm photos:build` (see [getting-started.md](./getting-started.md)), then add an
  entry to the `editorial` array with its `id`, `world`, `title`, `alt`, optional
  `caption`, `tags` and `sortOrder`.

## Schema extraction and GROQ TypeGen

The Studio exports its schema to `apps/studio/schema.json`; Sanity TypeGen then
generates query result types at `apps/web/src/sanity.types.ts`. Regenerate both
after changing a schema field or a named `defineQuery` query:

```bash
pnpm --filter @frameos/studio schema:extract
pnpm --filter @frameos/studio typegen
```

The shared `packages/content-schema` package remains the UI-facing contract.
Generated Sanity types cover raw CMS query results at the provider boundary.

## Migrating legacy world strings

Older photo documents may still contain the original string `world` field.
The web provider deliberately reads both shapes during rollout. To complete
the migration:

1. Create and publish one `world` document for every legacy slug.
2. Preview the migration from `apps/studio`:
   `pnpm sanity migrations run legacy-world-string-to-reference --dry-run`.
3. Inspect the patches, export or back up the dataset, then apply with
   `--no-dry-run` when ready.

The migration is idempotent. It only removes a legacy string after it finds a
matching published world, so unmatched photos remain readable and can be
retried later.

## Seeding the curated launch archive

For a new production dataset, preview the idempotent launch seed from the
repository root with `pnpm --filter @frameos/studio seed:production`. After
reviewing the reported counts and exporting a dataset backup, apply it with
`pnpm --filter @frameos/studio seed:production:apply`. Existing documents are
preserved; the seed only creates missing worlds, photos, image assets, and
singleton pages.

The seed also gives each launch world its curated **pocket planet** (planet photograph +
horizon) if the world has none yet. A dataset seeded before planets existed can pick these
up by running the seed again; it never overwrites a planet an editor has already set.

## Real-time invalidation

If you want page/gallery changes to appear immediately (rather than waiting
for the daily reconcile job), configure a webhook in Sanity's project
settings — see
[deployment.md](./deployment.md#configuring-the-sanity-webhook).
