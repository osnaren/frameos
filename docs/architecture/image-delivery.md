# Image Delivery

Every photograph on the site renders through one component,
`src/components/photo/PhotoImage.tsx`, which picks one of two paths:

- **Local fixture photos** (`publicId` starts with `local/`) resolve to
  pre-generated static WebP variants under `public/photos/` — see
  [../guides/getting-started.md](../guides/getting-started.md).
- **Everything else** is treated as a Sanity asset CDN base URL and run
  through the policy in `src/lib/image-policy.ts` below.

No component may build an image URL by hand — always go through
`PhotoImage` (or the `buildSanityImageUrl`/`buildSanitySrcSet` helpers it
uses) so presets, formats, and caching stay consistent.

## Presets

| Preset    | Width | Height | Fit  | Used for                                          |
| --------- | ----- | ------ | ---- | ------------------------------------------------- |
| `thumb`   | 320   | 320    | crop | Small square thumbnails                           |
| `card`    | 640   | 800    | crop | Portrait cards (world tiles, featured highlights) |
| `gallery` | 960   | —      | max  | Archive/index contact-sheet grid                  |
| `hero`    | 1920  | 1200   | crop | Full-bleed hero backgrounds                       |
| `detail`  | 1600  | —      | max  | Photo detail page                                 |
| `spatial` | 768   | —      | max  | WebGL/3D texture loads                            |
| `og`      | 1200  | 630    | crop | Social share images                               |

Responsive breakpoints (used to build `srcset`): `320, 480, 640, 768, 1024,
1280, 1536, 1920`.

## Sanity CDN transform URLs

Sanity's asset documents expose a ready delivery URL
(`asset->url`, e.g. `https://cdn.sanity.io/images/<project>/<dataset>/<hash>-<w>x<h>.<ext>`)
that query params are appended to directly — no `@sanity/image-url` builder
or manual `_ref` parsing needed on our side.

```
{baseUrl}?w={width}&h={height}&fit=crop&crop=focalpoint&fp-x={x}&fp-y={y}&auto=format&q=75
```

| Param                       | Meaning                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| `w`, `h`                    | Target width/height in pixels                                                                                                                    |
| `fit=crop`                  | Crop to the exact `w`×`h`, respecting the focal point                                                                                            |
| `fit=max`                   | Preserve aspect ratio, cap the longest side at `w`                                                                                               |
| `crop=focalpoint&fp-x&fp-y` | Crop around the editor-set hotspot (`Photo.image.hotspot`) rather than a naive center crop; defaults to `0.5, 0.5` (center) if no hotspot is set |
| `auto=format`               | Negotiate AVIF/WebP automatically                                                                                                                |
| `q`                         | Quality (75 for normal delivery)                                                                                                                 |

Full reference: <https://www.sanity.io/docs/apis-and-sdks/asset-cdn>.

## Placeholders

Sanity auto-generates a base64 blur placeholder (`metadata.lqip`) for every
uploaded image — this is used **directly** as the `<img>`'s
`background-image` while it loads. Unlike the previous Cloudinary setup,
this needs no separate blurred-transform request.

## Accessibility

`alt` text is required by Sanity schema validation (`rule.required()` on the
`photo.alt` field) — a photo cannot be published without it.
