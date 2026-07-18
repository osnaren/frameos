# Pocket Worlds — Google Flow render handoff

This package turns the six supplied keyframes into one forward-moving five-leg camera
journey. It deliberately uses a continuous-forward architecture rather than generic
pull-out connectors: the camera always advances through one geography, and every new leg
begins from the actual last frame of the previous render.

## Ready inputs

```text
inputs/
  00-overview.png
  01-wander.png
  02-sacred-geometry.png
  03-small-wonders.png
  04-living-things.png
  05-table-notes.png
```

All inputs are lossless 1664×936 PNGs at an exact 16:9 ratio. They were generated with
OpenAI imagegen from FrameOS source photography and the supplied composition reference.

## Render order

Generate the clips sequentially, not as an independent batch:

| Leg | Start frame                 | End frame                | Prompt                                           | Save video as                                     |
| --- | --------------------------- | ------------------------ | ------------------------------------------------ | ------------------------------------------------- |
| 01  | `00-overview.png`           | `01-wander.png`          | `prompts/01-overview-to-wander.md`               | `outputs/01-overview-to-wander.mp4`               |
| 02  | actual last frame of leg 01 | `02-sacred-geometry.png` | `prompts/02-wander-to-sacred-geometry.md`        | `outputs/02-wander-to-sacred-geometry.mp4`        |
| 03  | actual last frame of leg 02 | `03-small-wonders.png`   | `prompts/03-sacred-geometry-to-small-wonders.md` | `outputs/03-sacred-geometry-to-small-wonders.mp4` |
| 04  | actual last frame of leg 03 | `04-living-things.png`   | `prompts/04-small-wonders-to-living-things.md`   | `outputs/04-small-wonders-to-living-things.mp4`   |
| 05  | actual last frame of leg 04 | `05-table-notes.png`     | `prompts/05-living-things-to-table-notes.md`     | `outputs/05-living-things-to-table-notes.mp4`     |

The provided numbered keyframe remains the target end frame. For legs 02–05, the start
frame must be the previous video's actual rendered last frame, saved from Flow into the
project or extracted locally. Put downloaded handoff PNGs in `handoffs/` using names such
as `01-wander-actual.png`.

This is the seam rule that matters most. Reusing the original target image as the next
start frame can create a visible pop because the generated video's final pixels may have
drifted from that target.

### Exact handoff helper

If Flow does not expose a convenient saved-frame action, download the accepted clip with
its exact filename and extract the actual final frame locally:

```powershell
# After accepting leg 01; repeat with -Leg 2, 3, and 4 after each next render.
./scripts/pocket-worlds/extract-flow-handoff.ps1 -Leg 1
```

The helper decodes only the final half-second, leaves the actual final decoded frame in
`handoffs/`, and prints the next prompt to use. Upload that PNG as the next Flow start
frame. This avoids both generative drift and memory-heavy full-clip reversal.

## Flow settings

1. Open one Flow project for the complete journey.
2. Select **Video → Frames**.
3. Add the listed start and end frames.
4. Use a currently available model that supports **first + last frame** generation.
5. Select **16:9**, **8 seconds**, and one output for the first attempt.
6. Paste only the prompt body from the matching file.
7. Render, review at full screen, and save the accepted clip with the exact filename above.
8. Save the accepted clip's final frame in Flow and use it as the next start frame.

If Flow offers audio, leave it off. Audio is not part of the experience and is stripped
during web encoding. If a clip introduces a cut, flies backward, changes art style, or
fails to settle into forward motion, re-render only that leg.

Flow's current documentation describes start/end frames under Video → Frames and supports
reusing a saved video frame as a later start or end frame:

- <https://support.google.com/flow/answer/16353334>
- <https://support.google.com/labs/answer/16935718>

Feature availability and supported models can vary by account or region, so confirm the
active model's **first + last frame** support in Flow before rendering:

- <https://support.google.com/flow/answer/16352836>

## After all five videos are present

Run:

```powershell
./scripts/pocket-worlds/ingest-flow-videos.ps1
```

The script will:

- encode native-resolution desktop H.264 masters;
- produce 720p mobile variants with tighter keyframes;
- extract desktop and mobile posters from the encoded first frames;
- measure duration, resolution, file size, poster alignment, and every inter-clip seam;
- keep the runtime manifest locked until all checks pass.

After visually reviewing the encoded journey, unlock it with:

```powershell
./scripts/pocket-worlds/ingest-flow-videos.ps1 -ApproveVisual
```

Never set the manifest to `ready: true` by hand.
