# FrameOS — Pocket Worlds

Production reference for the cinematic Pocket Worlds homepage introduced in July 2026.
The server, cache, Sanity, Cloudinary, and publication architecture is unchanged; see
[new-arch.md](./new-arch.md). The original creative brief remains in
[video-pocket-worlds.md](./video-pocket-worlds.md).

## Current status

The connected visual world, semantic fallback, responsive stills journey, scroll
controller, media manifest, and browser fallbacks are implemented.

Six final keyframes were generated with OpenAI imagegen and are already used by the live
stills experience:

1. one aerial overview of the complete geography;
2. Wander;
3. Sacred Geometry;
4. Small Wonders;
5. Living Things;
6. Table Notes.

No placeholder video is shipped. The runtime manifest remains `ready: false` until the
five Google Flow renders are supplied, encoded, checked for continuity, and visually
approved. Until then, visitors get the complete authored scroll journey using the same
generated world imagery.

The former WebGL homepage is no longer routed. Its source and Three/R3F dependencies are
temporarily retained until the production video chain is approved; they can then be
removed without risking the working editorial fallback.

## Creative identity

**FrameOS — Pocket Worlds**

> Things I noticed, photographed on a phone.

The homepage is one journey through five worlds connected by captured light. The light is
sunlight made navigable: photographic exposure, visitor progress, and continuity between
different acts of noticing. It must never look like a neon laser or generic interface
glow.

This remains a personal mobile-photography archive, not a photography-services website.
Copy is minimal, observational, and honest. Locations, dates, equipment, and stories are
never invented.

## Journey order

| Order | World           | Public route              | Homepage line                            |
| ----- | --------------- | ------------------------- | ---------------------------------------- |
| 01    | Wander          | `/worlds/wander`          | Places passed through, horizons kept.    |
| 02    | Sacred Geometry | `/worlds/sacred-geometry` | Stone, sky, ritual, and repetition.      |
| 03    | Small Wonders   | `/worlds/small-wonders`   | The closer you look, the larger it gets. |
| 04    | Living Things   | `/worlds/living-things`   | Company that chooses its own distance.   |
| 05    | Table Notes     | `/worlds/at-the-table`    | Meals worth interrupting.                |

`at-the-table` remains the internal route slug for compatibility; the public name is
**Table Notes**. The hidden People world is excluded from every public journey and remains
draft-only until consent is confirmed.

## Visual system

The attached concept reference informed only the spatial idea: a foreground world in
focus with later worlds visible through atmospheric depth. The implementation uses its
own FrameOS geography, composition, copy, and camera grammar.

Every generated frame belongs to one continuous landscape. The route begins above the
whole archipelago, moves into the coastal Wander district, climbs to Sacred Geometry,
shrinks into the rain-leaf valley of Small Wonders, passes through Living Things, and
settles at the circular Table Notes gathering. A warm thread of captured sunlight links
every district.

Shared visual language:

- handcrafted architectural-scale realism with believable terrain and water;
- warm ivory mist, ocean teal, leaf green, temple terracotta, and charcoal;
- warm natural sunlight and delicate atmospheric perspective;
- controlled tilt-shift depth that feels photographic rather than toy-like;
- no lettering, logos, picture frames, UI, neon science-fiction light, or generic glossy
  plastic.

The six lossless 1664×936 Flow inputs live in:

`media-production/pocket-worlds-flow/inputs/`

Responsive web versions live in:

`public/media/pocket-worlds/keyframes/`

## Source photography

Only bundled FrameOS photography informed the visual worlds:

- Wander: `the-sea`, `the-waterfall`, `passing-overhead`;
- Sacred Geometry: `tower-and-sky`, `white-tower`, `the-chariot`;
- Small Wonders: `leaf-after-rain`, `rain-on-the-street`, `yellow-flowers`, `cosmos`,
  `tomatoes-on-the-vine`;
- Living Things: `parakeet`, `the-cat`, `grazing`;
- Table Notes: `banana-leaf-meal`, `paneer-skewers`, `toasted`, `small-plate`.

Source photographs remain photographs in the collection routes. Generated media is only
the homepage's cinematic connective tissue.

## Camera architecture

The production target is architecture A: five uninterrupted forward legs through one
connected geography. It adapts the `scroll-world` frame-seeking mechanics to this
particular concept instead of imposing a repeated dive-and-pull-out template.

| Leg | Camera journey                    |
| --- | --------------------------------- |
| 01  | complete aerial overview → Wander |
| 02  | Wander → Sacred Geometry          |
| 03  | Sacred Geometry → Small Wonders   |
| 04  | Small Wonders → Living Things     |
| 05  | Living Things → Table Notes       |

The camera never resets, pulls backward, or teleports between islands. Each leg ends with
a slow forward velocity that the next leg inherits.

Continuity rule: leg 01 uses the generated overview as its first frame. Legs 02–05 must
use the accepted previous video's **actual rendered last frame** as their first frame.
The supplied numbered keyframe remains the target last frame. This prevents a visible pop
caused by generative drift at clip boundaries.

## Google Flow render handoff

The complete handoff is in:

`media-production/pocket-worlds-flow/`

It contains:

- six lossless start/end frames in `inputs/`;
- one self-contained prompt for every camera leg in `prompts/`;
- a shared direction sheet;
- `outputs/`, the exact destination for the five accepted MP4 files;
- `handoffs/`, an optional place for saved actual-last-frame PNGs;
- a local helper that extracts the exact final decoded frame when Flow does not expose a
  convenient saved-frame action.

Follow the numbered render order in
[media-production/pocket-worlds-flow/README.md](../media-production/pocket-worlds-flow/README.md).
Use Flow's Video → Frames mode, 16:9, eight seconds, and a currently available model that
supports both first and last frames. The Flow feature matrix can vary by account and
region, so confirm that capability before rendering.

Expected source files:

```text
media-production/pocket-worlds-flow/outputs/
  01-overview-to-wander.mp4
  02-wander-to-sacred-geometry.mp4
  03-sacred-geometry-to-small-wonders.mp4
  04-small-wonders-to-living-things.mp4
  05-living-things-to-table-notes.mp4
```

After accepting legs 01–04, the next start frame can be extracted locally with:

```powershell
./scripts/pocket-worlds/extract-flow-handoff.ps1 -Leg 1
```

Repeat with `-Leg 2`, `-Leg 3`, and `-Leg 4`. Each generated PNG is written to
`media-production/pocket-worlds-flow/handoffs/` and is ready to upload as the next Flow
start frame.

## Ingestion and approval

After all five accepted renders are present, run:

```powershell
./scripts/pocket-worlds/ingest-flow-videos.ps1
```

This performs all local production work in one pass:

- native-resolution desktop H.264 encoding;
- 720p-or-smaller mobile H.264 encoding with tighter keyframes;
- audio removal and fast-start metadata;
- poster extraction from the encoded first frames;
- codec, resolution, pixel-format, duration, and size inspection;
- poster-to-first-frame SSIM checks;
- actual-last-frame to next-first-frame SSIM checks;
- a machine-readable verification report;
- a measured runtime manifest that remains locked.

Review the encoded journey at full size. If it is visually approved, run:

```powershell
./scripts/pocket-worlds/ingest-flow-videos.ps1 -ApproveVisual
```

The script sets `ready: true` only when visual approval is supplied and every structural
and SSIM check passes. Never unlock the manifest by hand.

## Media contract

The runtime reads:

`/media/pocket-worlds/manifests/web-manifest.json`

It does not request MP4 files unless that manifest is valid, complete, measured, and
`ready: true`.

```text
public/media/pocket-worlds/
  keyframes/   # responsive generated overview and five world stills
  master/      # native-resolution H.264 Flow clips
  mobile/      # 720p-or-smaller, tighter-GOP phone clips
  posters/     # posters extracted from encoded desktop and mobile clips
  manifests/   # runtime manifest and verification results
```

Raw Flow exports stay in the gitignored `media-production/.../outputs/` directory.
Temporary decoded first/last frames stay under the gitignored
`artifacts/pocket-worlds/` directory.

## Encoding rules

Desktop/master clips:

- retain native source resolution;
- H.264, `yuv420p`, CRF 20, slow preset;
- GOP 8, minimum keyframe interval 8, scene-cut keyframes disabled;
- no audio;
- `faststart` enabled;
- restrained sharpening.

Phone clips:

- scale down to 720p without upscaling smaller sources;
- H.264, `yuv420p`, CRF 23;
- GOP 4, minimum keyframe interval 4;
- no audio and `faststart` enabled.

SSIM scores at or above 0.90 pass. Scores from 0.75 to 0.90 are warnings; lower scores
fail. Only an all-pass report can enable cinematic video mode.

## Runtime ownership

- `src/content/pocket-worlds-journey.ts` — typed editorial journey and generated fallbacks;
- `PocketWorldsExperience.tsx` — SSR editorial floor and client-only upgrade boundary;
- `PocketWorldsCinematic.tsx` — scroll mapping, media lifecycle, copy phases, and route rail;
- `src/lib/pocket-world-media.ts` — strict runtime manifest contract;
- `public/media/pocket-worlds/manifests/web-manifest.json` — deploy-time readiness.

The controller adapts the hardened `scroll-world` mechanics to React ownership:

- raw scroll progress stays in refs and direct DOM updates;
- React state changes only for active segment, active world, and copy phase;
- architecture A changes the active world midway through each forward leg;
- clips are fetched as blobs for reliable in-memory seeking;
- only nearby segments are prefetched;
- mobile seeks are coalesced while the decoder is busy;
- muted videos are primed on first touch for iOS;
- rejected playback falls back to stills without an error screen;
- listeners, animation frames, fetches, videos, and object URLs are released on unmount;
- homepage progress is restored after world-route back navigation.

## Progressive enhancement

### Basic DOM

The server response contains one H1, five world H2s, every summary, and real links to each
world, the Index, Field Notes, and Signal. JavaScript is not required for understanding or
navigation.

### Stills journey

Used while videos are pending and for reduced motion, data saver, slow connections,
constrained memory, missing or invalid manifests, fetch failure, and rejected playback.
It uses the generated connected-world keyframes, preserves the same route rail and copy,
and makes no MP4 request.

### Cinematic journey

Used only when motion is allowed, device and network signals are adequate, and the media
manifest has passed production verification. Wide viewports use master media; phones use
the tighter-GOP mobile files.

## Accessibility, navigation, and SEO

- semantic copy and real TanStack Router links remain DOM-owned;
- inactive cinematic copy leaves the tab order and accessibility tree;
- route-rail controls are labelled and expose the current step;
- focus styles remain visible over every scene;
- videos are silent and always muted;
- reduced-motion visitors receive the complete still experience;
- the Index remains available in the global header and cinematic chrome;
- browser back/forward and direct world routes remain standard navigation;
- the SSR homepage contains the full editorial floor before hydration;
- hidden portraits remain excluded by existing publication guards.

## Verification status

Completed against the generated still journey and synthetic video harness:

- desktop and phone sticky-layout inspection;
- forward and reverse scroll mapping;
- active-world CTA navigation;
- browser back/forward with progress restoration;
- reduced-motion and data-saver modes with zero MP4 requests;
- blob-backed video loading and scroll-to-time seeking;
- bounded adjacent prefetch;
- simulated playback rejection with a clean still fallback;
- TypeScript, ESLint, unit, and production-build checks.

Production durations, byte sizes, encoded posters, seam scores, and final device recordings
remain pending until the five Flow exports are placed in `outputs/`.

## Removal boundary

After production media and fallbacks are visually verified, remove the obsolete
`src/components/worlds/spatial/` tree, `src/lib/capability.ts`, and unused Three/R3F
dependencies. Do not remove publication guards, world routes, photo-detail pages, Index,
Field Notes, Signal, responsive image infrastructure, or the editorial fallback.
