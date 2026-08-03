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
| `photo`        | The photo library — one document per photograph      | No (the actual content list) |

Singletons are pinned to a single fixed node in Studio's structure
(`apps/studio/structure.ts`) — there's always exactly one
`siteSettings`, `homePage`, `aboutPage`, `contactPage`, and their
delete/duplicate actions are disabled, so an editor can't accidentally
create a second copy or delete the only one.

## The `photo` document

| Field                                                              | Notes                                                                                                                                                                                                                         |
| ------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `image`                                                            | The photograph itself. Drop an image in and Sanity automatically extracts dimensions, a color palette, a blur placeholder, EXIF, and GPS. Set a hotspot (drag the focal point) for better cropping on card/thumbnail presets. |
| `slug`                                                             | Auto-generated from `title`; this is the photo's public URL (`/photos/<slug>`).                                                                                                                                               |
| `title`, `alt`, `description`, `caption`                           | `alt` is required — Sanity blocks publishing without it.                                                                                                                                                                      |
| `world`                                                            | Which "world"/category the photo belongs to (radio select).                                                                                                                                                                   |
| `series`, `locationLabel`, `tags`                                  | Optional organization/filtering fields.                                                                                                                                                                                       |
| `archived`                                                         | Hide this photo from every public page without deleting it. Use this instead of unpublishing if you want to keep the document around.                                                                                         |
| `camera`, `lens`, `focalLength`, `iso`, `shutterSpeed`, `aperture` | Leave blank to use the image's auto-extracted EXIF, or fill in manually to override (e.g. for scanned film with no EXIF, or to correct a camera's wrong clock/date).                                                          |
| `captureDate`                                                      | Same override behavior as the capture-data fields above.                                                                                                                                                                      |
| `sortOrder`                                                        | Higher numbers sort first in the gallery.                                                                                                                                                                                     |

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

`homePage.featuredPhotos` and `aboutPage.photoHighlights` are references to
existing `photo` documents (1–6 each) — pick from the library rather than
uploading a new image. This means a photo's title/alt/camera data etc. only
ever lives in one place.

## Real-time invalidation

If you want page/gallery changes to appear immediately (rather than waiting
for the daily reconcile job), configure a webhook in Sanity's project
settings — see
[deployment.md](./deployment.md#configuring-the-sanity-webhook).
