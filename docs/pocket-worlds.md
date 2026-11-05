# FrameOS — Pocket Worlds (the home page)

> Things I noticed, photographed on a phone.

The home page turns every world into a **pocket planet**: one of its photographs, curled
into the "tiny planet" a phone camera makes from a panorama. The page opens on all of them
at once, then visits each in turn, unrolling its planet back into the frame it came from.

It uses no generated imagery, no 3D models, and no video. The planets are the archive's
own photographs, re-projected live by one short fragment shader. That keeps the page
honest to what the site is, fast on phones, and editable from the CMS.

Why it replaced the earlier 3D-island and video approaches:
[decisions/0005-pocket-planet-homepage.md](decisions/0005-pocket-planet-homepage.md).

## The page, top to bottom

| Section     | What the visitor sees                                                                                                                                                                                                                                                                                                                  |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Orrery**  | The headline beside an orrery: every world's planet on its own orbit around a small sun of "captured light". Orbits are tilted ellipses, near-side planets sit larger and in front, and outer orbits turn more slowly. Planets turn on their axes, can be spun by dragging, and pause while hovered. Click one to jump to its chapter. |
| **Chapter** | One per world. The planet holds beside the world's name and line, then unrolls as you scroll (photo → arch → ring → planet, in reverse) until the photograph fills the screen. Its title and caption, a contact strip of the world's other frames, and links into the world and the Index then rise over it.                           |
| **Rail**    | Desktop only: a small vertical rail of planet thumbnails marks the current chapter and jumps between them.                                                                                                                                                                                                                             |
| **Closing** | "Every world, on one sheet." A row of planets linking to each world, then the Index, Field Notes and Signal.                                                                                                                                                                                                                           |

## Content controls (no code needed)

Everything on the home page comes from the CMS (or `apps/web/src/content/worlds.ts` in
fixture mode):

- **Which worlds appear, and in what order**: every `world` that is **Active** and has at
  least one published photograph, sorted by **Navigation order**. A new world appears
  automatically; an empty one stays off the home page until it has a photo.
- **Colours**: the world's **Photographic atmosphere** (`mood`). `wash` tints the stage and
  the planet's halo, `deep` the bezel and dark-theme stage, `accent` the numbers and focus.
- **Pocket planet** (`planet`, optional, under the Atmosphere tab in Studio):
  - **Planet photograph**: the frame to curl. Defaults to the world's lead photograph. It's
    also the frame the chapter unrolls into and opens with.
  - **Horizon** (0.2–1.2, default 0.55): how much of the frame becomes ground. Lower values
    gather the bottom of the photo into a tight core and give the sky most of the disc.
- **Copy**: the headline, eyebrow, intro and SEO come from the `homePage` document.

**Choosing a planet photograph.** Landscapes with ground at the bottom and sky at the top
make the clearest planets (Living Things' _Grazing_, Wander's _The Waterfall_). Close-ups
and top-down food shots make kaleidoscopes, which work too (Small Wonders, Table Notes).
Very dark frames make dark planets. Check the result on the site after publishing (or on a
local dev server pointed at the dataset) and adjust **Horizon** to taste.

## How it is drawn

The unfold is a continuous family of mappings from screen pixels back to the photo,
parameterized by `t` (0 = flat photo, 1 = closed planet):

1. **Bend.** The photo's bottom edge is wrapped around a circle below it. Curvature grows
   from ~0 (flat) to the point where two mirrored copies of the photo fill one full turn,
   so the closed planet has no seam. The arc-length formula is written to stay exact as
   curvature → 0, so the flat end matches a `object-fit: cover` photo pixel for pixel.
2. **Scale and travel.** The photo shrinks from cover size to the planet's radius, and the
   bend's centre travels to the planet's resting position.
3. **Close the core.** Over the last half, the radial mapping blends from linear (a ring with
   a hole) to stereographic (`atan(r / horizon)`), which gathers the photo's bottom rows
   into the core. Both mappings share one centre and agree at the rim, so there is never a
   double edge.
4. **Atmosphere.** A soft limb darkening and a halo in the world's `wash` colour fade in as
   the planet closes.

The same closed-planet mapping exists on the CPU (`samplePlanetUv`) for browsers without
WebGL, and is unit-tested.

### Three render modes per chapter

| Mode     | When                                        | Behaviour                                                                                                                             |
| -------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `gl`     | WebGL available, motion allowed             | The shader unrolls the planet frame by frame. Once flat, the real responsive `<img>` (sharper than the texture) takes over invisibly. |
| `css`    | No WebGL (and `gl` while its texture loads) | A still planet (painted once) hands over to the photo through an opening circular iris (`clip-path`).                                 |
| `static` | `prefers-reduced-motion`, no JavaScript     | A calm editorial layout: planet beside the copy, the photograph below, the strip under it. **This is what the server renders.**       |

The orrery, rail and closing planets are always **still** planets: painted once into a 2D
canvas through one shared offscreen WebGL context (or the CPU fallback), then turned with
CSS. Until painted, and without JavaScript, each shows a soft disc in the photo's palette,
so nothing shifts when the planet arrives.

## Performance budget

- Server-rendered and complete without JavaScript; no WebGL work happens before hydration.
- No 3D engine: the renderer is raw WebGL1 (works everywhere) with one triangle and one
  texture per chapter. Textures are redrawn to power-of-two sizes so mipmaps keep planets
  alias-free on every GPU.
- A chapter only creates its WebGL context when it comes within one viewport, only draws on
  scroll (or while its planet is visibly turning), and disposes the context on unmount.
  DPR is capped at 1.75.
- The orrery runs one `requestAnimationFrame` loop for all planets and pauses off-screen,
  in background tabs, and while hovered.
- Textures load at the size they're drawn: ~480–1024 px for still planets and 1600 px for
  the unfold (bundled variants locally, Sanity CDN transforms in production).

## Accessibility

- Reduced motion gets the static layout: nothing turns, nothing scrubs.
- Planets are decorative (`aria-hidden`); every world is a real link with a text label
  (name, line, frame count), reachable by keyboard, with visible focus.
- Chapter copy is real headings and text, readable whatever the unfold state.
- The rail is a labelled `nav` with `aria-current="location"` on the active chapter.

## Files

```text
apps/web/src/routes/index.tsx                       loader: homePage + worlds overview
apps/web/src/lib/world-overview.ts                  worlds ⨯ photos → WorldOverview (tested)
apps/web/src/server/repository/portfolio.ts         getWorldsOverview()
apps/web/src/components/home/
  PocketWorldsHome.tsx                              page composition, rail, closing
  HomeOrrery.tsx, orrery-math.ts                    the opening plate (tested)
  WorldChapter.tsx, chapter-mode.ts                 one world: planet → photo
  planet/planet-math.ts                             shader + CPU mapping + choreography (tested)
  planet/planet-renderer.ts                         WebGL renderer, still-planet painter
  planet/PlanetStill.tsx, planet/photo-source.ts    still planets, texture URLs, placeholders
apps/web/src/styles/home.css                        all home styles (imported by styles.css)
apps/studio/schemaTypes/documents/world.ts          the `planet` field
```

To tune the choreography, change `CHAPTER_PHASES` in `planet-math.ts` (when the planet
starts unrolling and when the photo is flat) and the chapter height in `home.css`
(`.chapter[data-mode='gl']`, currently `280svh`).
