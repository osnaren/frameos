# Getting Started

## Prerequisites

- Node `>=24.12.0` (see `engines` in `package.json`)
- pnpm — pinned via `packageManager` in `package.json`, run `corepack enable`
  if you don't have it yet

## Install and run

```bash
pnpm install
cp .env.example .env   # optional — see reference/environment-variables.md
pnpm dev
```

The dev server runs at `http://localhost:3000`.

## Fixture mode (no accounts needed)

With no Sanity credentials in `.env`, the app runs entirely on a bundled
fixture archive — the real "Pocket Worlds" launch photo set and editorial
copy (`src/server/providers/mock-data.ts` + `src/content/worlds.ts`). This is
fully functional out of the box: every page, the gallery, and photo detail
pages all work. Add Sanity credentials later (see
[content-management.md](./content-management.md)) and the data layer
switches to live data automatically — no code changes.

This is the default state of a fresh checkout, and intentionally so: it lets
you develop UI/layout work without needing a Sanity project at all.

## Adding your own photos to the fixture archive

The bundled archive is generated from local originals that are **never
committed** (`photo-source/` is git-ignored):

```bash
# put source photos in photo-source/, then:
node scripts/build-photo-assets.mjs
```

This script (`scripts/build-photo-assets.mjs`):

1. Reads each source image with `sharp`.
2. Emits responsive WebP variants to `public/photos/<id>/w<width>.webp`.
3. Generates a tiny base64 blur placeholder and a measured color palette.
4. Extracts real EXIF via `exifr` — camera, lens, focal length, ISO, shutter
   speed, aperture, GPS, and capture date — **when present in the source
   file**. Nothing is invented: a photo with no EXIF (e.g. a screenshot or a
   re-exported PNG) simply omits those fields.
5. Writes everything to `src/content/photo-manifest.json`.

| Extracted field                                  | Source                                                              |
| ------------------------------------------------ | ------------------------------------------------------------------- |
| `camera`                                         | EXIF `Make`/`Model`                                                 |
| `lens`                                           | EXIF `LensModel`                                                    |
| `focalLength`, `iso`, `shutterSpeed`, `aperture` | EXIF exposure tags, formatted for display (`f/1.8`, `1/200s`, etc.) |
| `gps`                                            | EXIF GPS latitude/longitude                                         |
| `captureDate`                                    | EXIF `DateTimeOriginal`                                             |
| `palette`, blur placeholder                      | Computed from the image itself, not EXIF                            |

This fixture pipeline is entirely independent of Sanity — it's a
zero-account way to run, demo, and develop the site.

## Validating your changes

```bash
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint .
pnpm test        # vitest run
pnpm build       # production build
```

`pnpm check` runs Prettier + ESLint's auto-fixers together.

## Next steps

- [content-management.md](./content-management.md) — connect a real Sanity project
  and run the standalone Studio (`../studio-frameos`) to add real photos and
  copy
- [deployment.md](./deployment.md) — deploy to Vercel
