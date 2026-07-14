# FrameOS — Pocket Worlds

Production reference for the video-based Pocket Worlds homepage introduced in July 2026.
The server, cache, Sanity, Cloudinary, and publication architecture is unchanged; see
[new-arch.md](./new-arch.md). The approved creative and generation brief remains in
[video-pocket-worlds.md](./video-pocket-worlds.md).

## Current status

The TanStack Start integration, semantic fallback, stills journey, media manifest,
scroll controller, and browser fallbacks are implemented. The public media manifest is
intentionally marked `ready: false` until the paid generation gates are approved and the
encoded production assets pass seam checks.

The former WebGL homepage is no longer routed. Its source and Three/R3F dependencies are
temporarily retained until the production video chain is generated and visually approved;
they can then be removed without risking the working editorial fallback.

No placeholder video is shipped. When the production manifest is not ready, visitors get
the authored stills journey made from the original FrameOS photography.

## Creative identity

**FrameOS — Pocket Worlds**

> Things I noticed, photographed on a phone.

The homepage is one journey through five worlds connected by captured light. The light is
sunlight made navigable: photographic exposure, visitor progress, and continuity between
different acts of noticing. It must never look like a neon laser or generic interface glow.

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

## Visual generation language

The following style preamble is reused byte-for-byte for every world still:

> An ultra-detailed cinematic miniature diorama belonging to one continuous dreamlike
> Pocket Worlds landscape. Handcrafted architectural scale-model realism with organic
> terrain, realistic water, refined vegetation, tactile natural materials, premium
> tilt-shift depth, soft atmospheric perspective, warm sunlight diffused through pale
> ivory mist, delicate clouds, soft long shadows, editorial photography quality, poetic
> and believable rather than toy-like. Cohesive palette of warm ivory #F5F0E6, mist blue
> #BCD6E7, ocean teal #4F9EA8, leaf green #4F6F45, temple terracotta #9A553C, charcoal
> #192432, and captured-light gold #FFD58A. No text, no letters, no captions, no logos,
> no picture frames, no floating photo billboards, no generic low-poly clay look, no
> glossy plastic toy look, no neon science-fiction styling.

Every composition is full, terrain-led, centre-safe, and built for `object-fit: cover`.
The five worlds share material language, light direction, world scale, and atmosphere but
remain locally distinct.

## Source photography

Only the bundled FrameOS photography is used as the artistic source:

- Wander: `the-sea`, `the-waterfall`, `passing-overhead`;
- Sacred Geometry: `tower-and-sky`, `white-tower`, `the-chariot`;
- Small Wonders: `leaf-after-rain`, `rain-on-the-street`, `yellow-flowers`, `cosmos`,
  `tomatoes-on-the-vine`;
- Living Things: `parakeet`, `the-cat`, `grazing`;
- Table Notes: `banana-leaf-meal`, `paneer-skewers`, `toasted`, `small-plate`.

Source photographs remain photographs in the collection routes. Generated media is only
the homepage's cinematic connective tissue.

## Camera architecture

Architecture B is the first production target because this is a god's-eye miniature world:

1. one dive clip per world;
2. one connector between each neighbouring pair;
3. connector start = the preceding dive's actual rendered last frame;
4. connector end = the following dive's actual rendered first frame;
5. a small crossfade is used only as encoding insurance.

The low-cost frame-locked previz must be approved before final rendering. If the aerial
pull-out creates rewind-like velocity reversal, production switches to architecture A:
five forward legs, each beginning on the previous leg's actual final frame and ending in a
slow forward drift. The web manifest supports both architectures.

Planned model stack:

- stills: `gpt_image_2`, 2K, high quality, 16:9;
- previz: `seedance_2_0_mini`, 720p, audio disabled;
- final: `seedance_2_0`, standard mode, 1080p high-bitrate, audio disabled;
- isolated fallback only: `kling3_0`, when filtering blocks a required clip.

## Generation runbook and approval gates

The generator is deliberately unable to spend through a missing approval switch. The
current live estimate is 725 credits for one clean pass: 35 for five 2K stills, 150 for
the complete 720p previz, and 540 for the 1080p finals. Keep 870–943 credits available
for a 20–30% re-roll reserve; 950 is the practical working ceiling.

```powershell
# Free and safe to repeat.
./scripts/pocket-worlds/generate-assets.ps1 -Phase Estimate

# Gate 1: only after the total spend ceiling is approved.
./scripts/pocket-worlds/generate-assets.ps1 -Phase Anchor -ApproveSpend

# Gate 2: only after the rendered Wander anchor is visually approved.
./scripts/pocket-worlds/generate-assets.ps1 -Phase Stills -ApproveSpend -ApproveAnchor
./scripts/pocket-worlds/generate-assets.ps1 -Phase Draft -ApproveSpend -ApproveAnchor

# Gate 3: only after the complete low-cost previz is visually approved.
./scripts/pocket-worlds/generate-assets.ps1 -Phase Final -ApproveSpend -ApproveDraft

# Local processing spends no generation credits.
./scripts/pocket-worlds/generate-assets.ps1 -Phase Encode
./scripts/pocket-worlds/generate-assets.ps1 -Phase Verify

# This final command can unlock video mode only when every SSIM check passes.
./scripts/pocket-worlds/generate-assets.ps1 -Phase Verify -ApproveVisual
```

Each paid phase is idempotent: existing successful outputs are skipped. Approval of a
switch is a human review decision, not a way to bypass a failed asset or quality check.

## Media contract

The runtime reads:

`/media/pocket-worlds/manifests/web-manifest.json`

It does not request video unless that manifest is valid, complete, and `ready: true`.
Expected layout:

```text
public/media/pocket-worlds/
  master/      # native final H.264 clips
  mobile/      # 720p, tighter-GOP phone clips
  posters/     # desktop and mobile posters extracted from their encoded clips
  stills/      # generated scene stills and fallback frames
  manifests/   # runtime manifest and verification results
```

Raw generations and intermediate boundary frames belong under the gitignored
`artifacts/pocket-worlds/`, never loose in `public/`.

## Encoding rules

Desktop/master clips:

- retain native resolution;
- H.264, `yuv420p`, CRF 20, slow preset;
- GOP 8, minimum keyframe interval 8, scene-cut keyframes disabled;
- no audio;
- `faststart` enabled;
- restrained sharpening only when the source requires it.

Phone clips:

- 720p derived from the final master;
- CRF 23;
- GOP 4, minimum keyframe interval 4;
- no audio and `faststart` enabled;
- no separate portrait generation unless a centre crop is demonstrably unusable and the
  extra spend is separately approved.

Posters are extracted from the encoded files themselves. Poster-to-first-frame SSIM and
every video seam are machine-checked after encoding.

## Runtime ownership

The homepage responsibilities are intentionally separated:

- `src/content/pocket-worlds-journey.ts` — typed editorial journey and source fallbacks;
- `PocketWorldsExperience.tsx` — SSR editorial floor and client-only upgrade boundary;
- `PocketWorldsCinematic.tsx` — scroll mapping, media lifecycle, copy phases, and route rail;
- `src/lib/pocket-world-media.ts` — strict runtime manifest contract;
- `public/media/pocket-worlds/manifests/web-manifest.json` — deploy-time media readiness.

The controller adapts the hardened `scroll-world` mechanics to React ownership:

- raw scroll progress stays in refs and direct DOM updates;
- React state changes only for active segment, active world, and copy phase;
- clips are fetched as blobs for reliable in-memory seeking;
- only current, previous, connector/next, and next-world segments are prefetched;
- mobile seeks are coalesced while the decoder is busy;
- muted videos are primed on first touch for iOS;
- rejected playback falls back to stills without an error screen;
- listeners, animation frames, fetches, videos, and object URLs are released on unmount;
- homepage progress is restored after world-route back navigation.

## Progressive enhancement

### Basic DOM

The server response contains one H1, five world H2s, all world summaries, and real links
to every world, the Index, Field Notes, and Signal. JavaScript is not required for
understanding or navigation.

### Stills journey

Used for reduced motion, data saver, slow connections, constrained memory, missing or
invalid media manifests, video fetch failure, and rejected playback. It keeps the same
scroll journey, copy, route rail, and CTAs but uses responsive source photographs with
gentle crossfades. No MP4 is requested in these modes.

### Cinematic journey

Used only when motion is allowed, device/network signals are adequate, and the production
manifest is ready. It prefetches the opening scene, next connector, and next world rather
than downloading the complete chain. Tablets use master media when their viewport is wide
enough; phones use the tighter-GOP mobile files.

## Accessibility and navigation

- semantic copy and real TanStack Router links remain DOM-owned;
- inactive cinematic copy is removed from the tab order and accessibility tree;
- route-rail controls have labels and `aria-current` state;
- focus styles remain visible over every scene;
- audio is absent from the final files and videos are always muted;
- the Index is available in both the global header and cinematic chrome;
- browser back/forward and direct world refresh remain standard routing operations;
- the light journey pins a surface but never prevents ordinary browser scrolling.

## SEO

The SSR homepage contains the full editorial floor before hydration. The cinematic layer
does not own metadata, routing, or headings until it replaces the fallback after hydration.
The canonical title and description continue to come from the home view. Hidden portraits
remain excluded by the existing publication guards.

## Verification status

Completed against the local stills and synthetic media harness:

- desktop, phone, and responsive sticky-layout inspection;
- fast forward and reverse scrolling;
- all active-world CTA navigation;
- browser back/forward with progress restoration;
- direct world routes;
- reduced-motion selection with zero MP4 requests;
- data-saver selection with zero manifest or MP4 requests;
- blob-backed video load and scroll-to-`currentTime` tracking;
- opening prefetch limited to three adjacent clips;
- simulated iOS Low Power Mode playback rejection and clean stills fallback;
- TypeScript, ESLint, unit tests, and production build checks.

Production SSIM values, clip durations, file sizes, generation IDs, spend, re-roll counts,
and final device recordings remain intentionally blank until approved media is generated.
The manifest must not be changed to `ready: true` before those checks pass.

## Removal boundary

After production media and fallbacks are visually verified, remove the obsolete
`src/components/worlds/spatial/` tree, `src/lib/capability.ts`, and unused Three/R3F
dependencies. Do not remove publication guards, world routes, photo detail pages, Index,
Field Notes, Signal, responsive image infrastructure, or the editorial fallback.
