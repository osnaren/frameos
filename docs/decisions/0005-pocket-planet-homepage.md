# 0005: Pocket planets for the home page

## Status

Accepted (November 2026). Supersedes the WebGL world gallery (July 2026), the draggable
CSS dome home (August 2026), the planned Google Flow video journey (`docs/video-pocket-worlds.md`,
removed; see git history), and the procedural React Three Fiber island journey (WIP,
November 2026).

## Context

The home page had been rebuilt four times. Each attempt tried to depict the "Pocket
Worlds" idea as something other than the photographs:

- **WebGL world gallery / CSS dome**: generic 3D carousels of photos. Heavy, and they could
  have been anyone's portfolio.
- **Video journey**: AI-generated aerial keyframes of invented miniature landscapes, plus
  five Flow renders that had to be produced, encoded and SSIM-checked outside the repo
  before the page could ship. The manifest never became `ready`, so the page never left
  its fallback.
- **Procedural 3D islands** (R3F + postprocessing): five hand-modelled landforms, a
  lighthouse, a temple and so on. A large dependency footprint (three, fiber,
  postprocessing), slow on phones, a type error at the end, and again imagery that wasn't
  the archive's.

All of them were expensive to build, fragile to run, and drifted from what the site is: a
small, honest archive of photographs made on a phone.

## Decision

Make the photographs themselves the worlds. Each world is drawn as a **tiny planet**, the
stereographic "little planet" projection a phone camera makes from a panorama, curled from
one of its own photographs. Scrolling unrolls the planet back into that photograph.

- One fragment shader, raw WebGL1, no 3D engine. CPU fallback for the still planet; a
  `clip-path` iris for the transition when WebGL is missing; a static editorial layout for
  reduced motion and the server render.
- Fully content-driven: which worlds, their order and colours, the planet photograph and
  its horizon all come from the CMS (`world.planet`), with defaults that need no input.

See [../pocket-worlds.md](../pocket-worlds.md) for the design and implementation.

## Consequences

- The home page uses only real photographs, so it can never contradict the archive, and
  it grows with it: a new world is a CMS entry.
- `three`, `@react-three/fiber`, `@react-three/postprocessing`, `postprocessing`,
  `@types/three` and the unused `styled-components` were removed from the web app, along
  with ~4 MB of generated keyframes, the video manifest/ingest scripts and ~1,100 lines of
  CSS.
- The `world.form` field from the 3D attempt was replaced by `world.planet`. Any `form`
  values already in a dataset are ignored by the app and show as an unknown field in
  Studio. Unset them (or leave them; they're harmless).
- `media-production/pocket-worlds-flow/` (the Flow inputs and prompts) was no longer used by
  the app and has since been deleted; it remains in git history.
- Some photographs make clearer planets than others. Editors pick the planet photograph
  and horizon per world; the defaults (lead photograph, 0.55) are always valid.
