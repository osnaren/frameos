# FrameOS — Pocket Worlds

Design and implementation reference for the public experience introduced in July 2026.
For the data/caching architecture underneath it, see [new-arch.md](./new-arch.md) — that
layer is unchanged by this redesign.

## Experience tiers (capability, not screen width)

`src/lib/capability.ts` selects the tier from real signals:

| Tier       | Who gets it                                                                                    | What it is                                                                        |
| ---------- | ---------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `animated` | SSR default, mobile, coarse pointers, reduced motion, low memory, save-data, no WebGL          | The complete DOM experience (2.5D opening, world scenes, Index, view transitions) |
| `spatial`  | Fine pointer + ≥1024px + WebGL + no reduced-motion/save-data + ≥4GB device memory (when known) | Adds the WebGL opening constellation on `/`                                       |

The canvas is always an enhancement: it is lazily chunked (~900 KB raw, loaded only
at this tier), wrapped in an error boundary that renders nothing on failure, and
`aria-hidden` — keyboard/screen-reader world selection is the DOM portal grid below
the fold. If the canvas never mounts, the page is complete.

## The spatial opening (`src/components/worlds/spatial/SpatialOpening.tsx`)

One continuous ~4s timeline, never blocking the DOM (headline and actions render
immediately; the canvas fades in when its six textures are ready):

1. Six torn fragments of “Leaf, After Rain” hang scattered in depth.
2. They align into the complete photograph, which separates into subtle depth
   layers answering the pointer.
3. The camera pulls back; the assembled leaf travels into place as the Small
   Wonders entrance while the other four world photographs arrive from depth —
   a constellation of mounted prints (each has an ivory matte plane behind it).
4. Focusing a world tints the scene background and fog toward that world's
   measured mood (wash in light theme, deep in dark), advances the print, dims
   the others, and drifts the camera; a DOM placard names the world.
5. Clicking flies the camera into the photograph, fades the headline, then the
   route changes to that world (whose header carries the same wash → continuity).

Composition rules: lower-left is reserved negative space for the DOM headline;
the sea horizon runs low across center; towers rise right; the parakeet hangs
deepest in the upper shade at slightly reduced opacity.

Engineering guarantees:

- intro plays once per session (module flag); back-navigation resumes directly
  in the constellation with the camera already pulled back;
- `frameloop` switches to `never` via IntersectionObserver + visibilitychange
  when the section is offscreen or the tab is hidden;
- textures are 768px local WebP variants (`getLocalVariantUrl`), sRGB, anisotropy 4;
- DPR capped at 1.75; no post-processing, no lights (photos are unlit basic materials);
- tile geometries are custom-UV planes over ONE shared texture (no duplicated uploads),
  disposed on unmount; R3F auto-disposes the rest;
- a focus-reticle cursor exists only inside the canvas section on fine pointers
  (native cursor hidden there only), and never replaces DOM focus states.

Measured on the dev build (Chromium, Intel Arc, 1360×850): the constellation
renders with a frame budget far below 16ms (~240 rAF/s uncapped), JS heap ~44 MB.
The spatial chunk is not requested at all on mobile/reduced-motion/fallback tiers.

## Creative intent

**"Things I noticed, photographed on a phone."**

The portfolio is a personal artistic space, not a client-acquisition site. Mobile-only
photography is the premise, never an apology: the phone is the camera that is present
when something worth noticing happens. Each photograph is treated as a small world the
visitor can step into; the site is the act of noticing, made navigable.

The recurring signature element is the **pocket frame** — a small rounded viewfinder
frame (`.pocket-frame` + `.frame-corners` focus marks) that carries every photograph:
the opening anchor, the drifting fragments, world portals, contact-sheet cells, and the
detail view. Ambient color always derives from the photographs themselves (measured
palettes in the manifest, world moods chosen from them), never from decoration.

Copy rules: minimal, poetic, honest. No invented locations, dates, equipment, or
stories. Photography clichés ("capturing timeless moments" etc.) are banned.

## World structure

Six worlds, defined in `src/content/worlds.ts`:

| World           | Slug              | Signature | Frames | Hero                         |
| --------------- | ----------------- | --------- | ------ | ---------------------------- |
| Wander          | `wander`          | `drift`   | 3      | Where the Sea Keeps Going    |
| Sacred Geometry | `sacred-geometry` | `rise`    | 3      | Tower Against a Restless Sky |
| Small Wonders   | `small-wonders`   | `macro`   | 5      | Leaf, After Rain             |
| Living Things   | `living-things`   | `quiet`   | 3      | Parakeet in the Dark Canopy  |
| At the Table    | `at-the-table`    | `gather`  | 4      | On a Banana Leaf             |
| People          | `people`          | `quiet`   | 2      | — hidden                     |

Worlds are deliberately small (3–5 frames): a short strong vignette instead of an
underfilled gallery. **People is hidden**: its photos are `status: 'draft'` in the
content module, so the repository's existing fail-closed publication guards exclude
them from every feed, route, and sitemap surface. The asset pipeline additionally
generates **no public image files** for hidden photos, so nothing is fetchable even by
URL guessing. To publish later: flip `hidden` in `scripts/build-photo-assets.mjs` and
`src/content/worlds.ts`, re-run the pipeline, and confirm permission first.

## Motion principles

One vocabulary, defined in `src/lib/motion.ts`, drawn from photographic behaviour:

- `focusEase` `[0.16, 1, 0.3, 1]` — the settle of a focus pull; used everywhere.
- Reveals resolve from soft blur to sharp (`focusIn`), like an image finding focus.
- Staggering (`contactSheet`) sequences frames like a contact sheet.
- Motion is intentional, reversible, and stops: `viewport={{ once: true }}` everywhere,
  no ambient loops, no scroll hijacking.

Each world scene (`src/components/worlds/WorldScene.tsx`) applies exactly one or two
signature ideas:

- **drift** (Wander): the sea hero expands from a contained frame to full-bleed as you
  scroll toward it — the horizon becomes the environment. Remaining frames drift in
  from alternating sides with wide negative space.
- **rise** (Sacred Geometry): a single centered column with a vertical hairline; every
  frame rises monumentally into place.
- **macro** (Small Wonders): every frame arrives out of focus and slightly enlarged,
  then resolves — a focus pull. Sizes alternate to create scale shifts.
- **quiet** (Living Things): the page itself darkens into a deep-forest passage; frames
  fade in very slowly with generous stillness. The one deliberately dark section of an
  otherwise bright site.
- **gather** (At the Table): a warm clustered arrangement with slight rotations and
  tactile shadows.

Reduced motion: every variant has a fade-only replacement (`revealVariants`), the
pointer-parallax hook goes inert, and a global CSS `prefers-reduced-motion` rule
collapses all remaining animation to fades. Content and navigation are unaffected.

## Route behaviour

| Route                            | Purpose                                             | Data                                    |
| -------------------------------- | --------------------------------------------------- | --------------------------------------- |
| `/`                              | Opening constellation + world portals               | home view + full gallery feed           |
| `/worlds/$world`                 | One world's scene                                   | gallery feed filtered by `category`     |
| `/photos/$slug`                  | Photo detail (stable, shareable)                    | photo detail + world feed for prev/next |
| `/archive`                       | The Index: contact-sheet archive, `?world=` filter  | gallery feed                            |
| `/notes`                         | Field Notes (about)                                 | about view                              |
| `/signal`                        | Signal (contact)                                    | contact view                            |
| `/gallery`, `/about`, `/contact` | Legacy redirects to `/archive`, `/notes`, `/signal` | —                                       |

Photo slugs are clean ids (`/photos/leaf-after-rain`); the provider's slug lookup
falls back to exact slug matching, so no encoded slugs are needed for local photos.
Shared-element continuity between scene/index and detail uses the **View Transitions
API** (`defaultViewTransition: true` in the router + per-photo `view-transition-name`);
browsers without support get a normal instant navigation. The immersive layer never
traps anyone: the opening carries a permanent "Skip to the Index" link, every scene
links to the Index, and all content is reachable by keyboard.

## Content pipeline

- Source originals live in `photo-source/` (gitignored, never served — this also
  protects unpublished portraits from being fetchable).
- `node scripts/build-photo-assets.mjs` (requires the `sharp` devDependency) generates:
  - responsive WebP variants at 320/480/768/1024/1440(+native) widths under
    `public/photos/<id>/w<width>.webp` (~12 MB total for 18 photos),
  - a 24px inline blur placeholder per photo,
  - a measured 5-swatch palette per photo,
  - `src/content/photo-manifest.json` (generated — do not hand-edit).
- `src/content/worlds.ts` holds the editorial layer (titles, alt, captions, ordering,
  world moods) and builds `Photo` domain records from the manifest.
- **Local archive mode**: when Cloudinary/Sanity credentials are absent (any
  environment), the providers serve this bundled curated set through the existing
  repository contract. When credentials exist, Cloudinary/Sanity become canonical again
  and this module is ignored. Publication guards, caching, and webhooks are untouched.
- `PhotoImage` (`src/components/photo/PhotoImage.tsx`) is the single rendering path:
  `local/<id>` publicIds resolve to bundled variants; anything else flows through the
  Cloudinary image policy. No component may render a raw image URL.

## Visual system

- Base: bright warm ivory (`#f8f5ee`) with a pale mist cast; charcoal ink; restrained
  grain overlay. **The default theme is light** — the bright adaptive-surreal
  direction is the artwork's home key. Dark is an explicit visitor choice (or
  stored auto mode); the toggle shows current state (○ Light / ● Dark / ◐ Auto)
  with the next action in its label. Darkness also appears deliberately inside
  the experience (Living Things' forest passage, dark-theme night gallery).
- World moods (`--world-wash/--world-deep/--world-accent`) tint scenes; wash strength
  is theme-aware (`--wash-strength`: 80% light, 16% dark) so pale washes never fight
  dark-mode text.
- Type: **Fraunces** (variable, optical sizes; italic for captions and world lines) for
  the editorial voice; **IBM Plex Sans** for UI; **IBM Plex Mono** for the photographic
  interface layer (frame numbers `№ 03`, counters, filters, breadcrumbs).
- Photographic interface references stay subtle: focus-mark corners on hover/focus,
  frame counters, contact-sheet labels. The interface is not a fake camera UI.

## Accessibility

- Semantic landmarks (`main`, `nav` with labels, `figure`/`figcaption`, `dl` metadata).
- Full keyboard access: visible focus rings (`:focus-visible` uses the world accent),
  arrow-key prev/next on photo detail, arrow-key roving on the Index sheet.
- Alt text is authored per photo in the content module and required by the publication
  guard (photos without alt cannot publish — pre-existing rule, kept).
- Reduced motion handled at three levels (variants, hook, global CSS).
- No hover-only essentials, no autoplay audio, no scroll hijacking.

## Performance strategy

- No WebGL in v1 — a deliberate boundary. The spatial feel comes from CSS depth,
  blur-as-depth-of-field, pointer parallax, and scroll-linked transforms, which work on
  every device and cost nothing when idle. If a future world genuinely needs shader
  work (e.g. rain refraction), add it as an optional enhancement layer behind a
  capability check; never render primary content in a canvas.
- Images: responsive `srcset` + `sizes` on every photo, lazy loading below the fold,
  eager + `fetchpriority=high` for heroes, inline blur placeholders, intrinsic
  width/height everywhere (no layout shift).
- Animations run once per element (`once: true`) and are driven by
  IntersectionObserver via framer-motion; the parallax listener is passive and single.
- SSR delivers full readable content (verified via curl — headline, captions, and meta
  present in initial HTML).

## Technical boundaries

- UI consumes repository outputs (server functions) only — unchanged.
- The presentation layer may import `src/content/worlds.ts` for world definitions and
  moods (static editorial config, equivalent to code).
- `framer-motion` + View Transitions API are the only animation systems. Do not add
  GSAP/Three/etc. without removing something.
- Every photograph renders through `PhotoImage`.
- Portraits stay unpublished until permission is confirmed (see World structure).

## Known limitations / future work

- Cloudinary/Sanity credentials are not configured locally; live-CMS mode is untested
  against real accounts (the provider code paths are unchanged from the previous
  verified architecture).
- View-transition morphs are Chromium/Safari only; Firefox falls back to instant
  navigation by design.
- The legacy `CloudinaryImage` component and `PhotoCard`/`PhotoMasonry` remain for
  reference but are no longer routed; remove once the new system is considered stable.
- `/loop`-style device-tilt response on mobile was consciously skipped (permission
  prompts outweigh the payoff at this archive size).
