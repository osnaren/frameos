# Final Codex plan

````text
We are replacing the current FrameOS real-time WebGL homepage with a premium, video-based scroll-scrub experience using the scroll-world workflow.

Work inside the existing FrameOS repository and current working tree.

Do not restart the project, create a parallel demo, or replace the existing architecture. Inspect what is already present and integrate the new experience cleanly into the existing TanStack Start application.

The approved project direction is:

FRAMEOS — POCKET WORLDS
“Things I noticed, photographed on a phone.”

The homepage should become one continuous cinematic journey through five miniature Pocket Worlds connected by a thread of captured light.

This phase must produce the actual working experience, generated assets, integration, fallbacks, and verification—not only a plan or prototype.

## Use the scroll-world skill

Use the hardened scroll-world implementation from:

https://github.com/cth9191/scroll-world

Prefer this hardened fork over the original `oso95/scroll-world` version because it includes:

- explicit generation-spend gates;
- anchor-still approval before batching;
- low-cost draft previz;
- idempotent generation scripts;
- encoded-frame posters;
- automated SSIM seam verification;
- mobile encodes and device-class selection;
- iOS Low Power Mode fallback;
- data-saver fallback;
- crawlable SEO copy.

First check whether `$scroll-world` is already available in Codex.

If it is missing, install it manually without altering the repository:

```bash
git clone https://github.com/cth9191/scroll-world /tmp/frameos-scroll-world
mkdir -p ~/.codex/skills
cp -R \
  /tmp/frameos-scroll-world/plugins/scroll-world/skills/scroll-world \
  ~/.codex/skills/scroll-world
````

Then read and follow:

- `SKILL.md`
- `references/prompts.md`
- `references/pipeline.md`
- `references/scrub-engine.js`
- `references/gotchas.md`
- `references/index-template.html`

Use `$scroll-world` as the primary workflow, but adapt its output properly to the existing TanStack Start and React architecture.

Do not simply paste its standalone HTML template into the application.

## Why we are changing direction

The previous attempt used React Three Fiber / WebGL to create floating photographs, a glowing path, and abstract scene objects.

That implementation is visually unsuccessful.

It looks like:

- photographs floating inside an empty cream void;
- framed image billboards;
- a glowing spline travelling through empty space;
- scattered abstract geometry;
- a technical 3D experiment rather than an authored world;
- weak environmental storytelling;
- poor visual density and composition.

Do not preserve that homepage visual direction.

The new experience must use pre-rendered cinematic video to achieve a richer and more controlled visual result.

Remove the failed real-time WebGL homepage implementation after the new video experience and its fallback are working. Remove unused Three.js/R3F dependencies only when repository inspection confirms they are not used elsewhere.

Preserve unrelated local work.

Do not commit, push, merge, deploy, reset, or discard changes unless explicitly instructed.

## Reference images

The attachments have distinct purposes.

### Reference A — approved FrameOS concept frame

This is the primary positive reference for:

- miniature-world art direction;
- lighting;
- atmosphere;
- terrain detail;
- premium diorama rendering;
- warm ivory sky;
- mist and cloud depth;
- glowing captured-light route;
- elevated cinematic composition;
- relationship between interface and world;
- visual richness.

Do not interpret it as a literal requirement to combine every collection in one island.

Use it as the shared visual language.

### Reference B — Vectr screenshot

Use this only for:

- continuous spatial storytelling;
- elevated camera confidence;
- scenery occupying the full viewport;
- a path physically travelling through environments;
- sequential scroll progression;
- the sensation that the entire page is one world.

Do not copy:

- industrial subject matter;
- objects;
- branding;
- exact camera path;
- exact palette;
- page copy;
- scene layout.

### Reference C — failed FrameOS WebGL screenshot

This is a negative reference.

Actively move away from:

- empty backgrounds;
- floating framed photos;
- abstract placeholder shapes;
- isolated content without terrain;
- weak contrast;
- an overexposed cream environment;
- the light path floating without physical context.

### Reference D onward — original photography

These are the actual artistic source material.

Use them as references for the visual identity and subject matter of each world.

Do not replace them with stock photography.

Do not fabricate metadata, locations, dates, personal stories, equipment, or meanings.

Portraits must remain unpublished until consent is confirmed.

## Project identity

FrameOS is a personal artistic portfolio built entirely around mobile photography.

The main photography categories are:

- landscapes;
- travel;
- nature;
- temples and cultural spaces;
- small everyday observations;
- animals;
- food;
- limited portraits that require permission.

This is not primarily a client-acquisition website.

Do not turn it into a commercial photography-service website.

The mobile-photography premise should feel confident:

- immediate;
- observant;
- personal;
- present;
- lightweight;
- driven by noticing rather than planned production.

Retain the central line:

“Things I noticed, photographed on a phone.”

Supporting language should stay minimal and honest.

Avoid clichés such as:

- capturing timeless moments;
- through my lens;
- freezing memories forever;
- breathtaking photography;
- passion meeting creativity.

## Final interaction concept

The homepage is:

POCKET WORLDS — FOLLOW THE LIGHT

A visitor moves through five cinematic miniature environments as they scroll.

The camera flies through the worlds as one connected journey.

A soft glowing thread of captured light connects every world.

Scroll controls the video timeline. The visual camera motion is already rendered into the video.

Do not rebuild the journey using real-time 3D.

The light thread represents:

- the light required to create a photograph;
- the visitor’s route;
- progress through the portfolio;
- continuity between different kinds of observation;
- a visual guide toward each world.

It should feel like captured sunlight, not a neon laser.

## Journey architecture

Use five principal visual scenes:

1. Wander
2. Sacred Geometry
3. Small Wonders
4. Living Things
5. Table Notes

Do not add a separate expensive intro scene or finale scene unless the approved budget clearly supports it.

Instead:

- the opening DOM identity and copy appear over the wide beginning of Wander;
- the final archive CTA appears during the closing portion of Table Notes.

This gives the full narrative without unnecessary generation spend.

The journey should begin in open atmospheric mist, reveal the first light, and move toward Wander.

It should end with the light settling or converging into an archive/contact-sheet motif that leads to the Index.

## Preferred camera architecture

This is a miniature, god’s-eye, diorama journey, so begin by evaluating scroll-world architecture B:

- one dive clip per world;
- one connector between each neighbouring pair;
- connectors pull out, cross the connected world, and descend toward the next world.

Architecture B visually matches the approved idea of travelling between miniature environments.

However, do not blindly accept camera reversal or rewind-like stutter.

Use the hardened skill’s draft previz and seam verification.

If architecture B produces an unavoidable visual rewind or weak continuity, switch to architecture A:

- one continuous forward chain;
- each leg begins from the previous leg’s actual final frame;
- camera movement may rise, orbit, track, or swoop within a leg;
- each leg must settle into steady forward motion before its seam.

Choose based on the actual previz quality.

The final result must feel like one continuous journey, not five videos cut together.

## Budget and paid-generation gates

Do not spend Higgsfield credits before showing a clear estimate.

Default recommendation:

- standard five-scene chain;
- one anchor still;
- five world stills total;
- draft previz using a frame-locking lower-cost model;
- final chain using one supported full model;
- mobile encodes from the final clips;
- approximately 20–30% re-roll allowance.

Before paid generation, report:

- image-generation count;
- draft-video generation count;
- final-video generation count;
- connector count;
- likely re-roll allowance;
- any mobile re-render cost;
- rough runtime;
- current available credits.

Ask for one explicit spend approval.

Do not re-ask approval for every command after that.

There are only three intentional visual gates:

1. Spend approval.
2. Wander anchor-still approval.
3. Full draft previz approval before final-quality video generation.

These gates exist to avoid wasting credits. Do not skip them in the name of “one shot.”

## Required tools and bootstrap

Before generation, verify:

- Higgsfield CLI is installed;
- Higgsfield authentication works;
- a workspace is selected;
- credits are available;
- `ffmpeg` is installed;
- `ffprobe` is installed;
- Python/Pillow is available only if background knockout is needed.

Use the selected video model consistently across the final chain.

Validate its supported parameters with the CLI before batching.

Only use models that can frame-lock the required seams.

The documented supported roster includes:

- `seedance_2_0`;
- `seedance_2_0_mini`;
- `kling3_0`.

Default to:

- `seedance_2_0_mini` for draft previz;
- `seedance_2_0` for final output.

Use `kling3_0` only as a justified fallback for a failed clip or filtering issue, and acknowledge that a one-clip renderer change may create a subtle character shift.

Do not invent unsupported model flags.

## Shared art direction

Create one exact style preamble and reuse it byte-for-byte for every world still.

Use this as the starting style preamble, refining it only during the Wander anchor stage:

“An ultra-detailed cinematic miniature diorama belonging to one continuous dreamlike Pocket Worlds landscape. Handcrafted architectural scale-model realism with organic terrain, realistic water, refined vegetation, tactile natural materials, premium tilt-shift depth, soft atmospheric perspective, warm sunlight diffused through pale ivory mist, delicate clouds, soft long shadows, editorial photography quality, poetic and believable rather than toy-like. Cohesive palette of warm ivory #F5F0E6, mist blue #BCD6E7, ocean teal #4F9EA8, leaf green #4F6F45, temple terracotta #9A553C, charcoal #192432, and captured-light gold #FFD58A. No text, no letters, no captions, no logos, no picture frames, no floating photo billboards, no generic low-poly clay look, no glossy plastic toy look, no neon science-fiction styling.”

The shared world should feel:

- handcrafted;
- highly detailed;
- organic;
- surreal but believable;
- bright and atmospheric;
- richly composed;
- premium;
- rooted in the source photographs.

Avoid defaulting to the skill’s simple rounded clay-island look.

This project needs a more refined miniature landscape aesthetic.

## Framing rules

Generate establishing artwork and videos for full-screen use.

The worlds must occupy most of the frame.

Avoid:

- tiny islands surrounded by empty background;
- excessive blank cream space;
- important subjects at extreme edges;
- dominant freestanding picture frames;
- subjects too small to understand;
- compositions that only work as still illustrations.

Compose focal points inside a centre-safe area so the desktop clip can support a portrait mobile crop where practical.

Before generating all worlds, test the Wander anchor at:

- desktop 16:9 composition;
- mobile centre crop;
- UI-overlay safe areas.

If 16:9 generation is supported by the selected still model, use it.

Otherwise generate the highest-quality compatible source and crop/reframe deliberately before using it as a video start image.

Do not allow silent aspect-ratio distortion.

## Scene 01 — Wander

Source photography:

- sea;
- beach;
- waterfall;
- hills;
- open sky;
- aircraft;
- travel and distant horizons.

World composition:

- a miniature coastline;
- moving shallow waves;
- a beach and rock edge;
- elevated terrain;
- a cliff;
- a waterfall;
- scattered trees and vegetation;
- distant atmospheric hills;
- light cloud layers;
- one restrained aircraft moment;
- a captured-light path moving through the landscape.

The light should begin in the mist, sweep along the coast, climb through the terrain, and leave toward the next world.

This is the anchor scene.

Its approval locks:

- visual style;
- camera angle;
- material language;
- terrain detail;
- atmosphere;
- palette;
- light-path appearance;
- world scale.

DOM copy over the beginning of this scene:

FrameOS — Pocket Worlds

“Things I noticed,
photographed on a phone.”

“Follow the light through five small worlds.”

Primary action:
“Begin the journey”

Secondary action:
“Open the Index”

World copy when Wander becomes active:

Title:
“Wander”

Body:
“Places passed through, horizons kept.”

Action:
“Enter Wander”

Do not bake this text into the generated video.

## Scene 02 — Sacred Geometry

Source photography:

- temple towers;
- sacred architecture;
- festival chariot;
- ornament;
- ritual spaces;
- large skies;
- symmetry and vertical structure.

World composition:

- a monumental miniature temple environment;
- tower forms rising through layered platforms;
- stone and terracotta architecture;
- a restrained festival path;
- tiny flags or cloth movement;
- repeating geometric structure;
- a path of light becoming more ordered and architectural.

The connector should leave Wander through sky and mist, then approach Sacred Geometry with increasing symmetry and vertical alignment.

World copy:

Title:
“Sacred Geometry”

Body:
“Stone, sky, ritual, and repetition.”

Action:
“Enter Sacred Geometry”

Do not create generic mandalas or unrelated ornamental symbols.

Use the supplied temple photography as the source of visual language.

## Scene 03 — Small Wonders

Source photography:

- leaf covered in droplets;
- yellow flowers;
- rain splash;
- tomatoes;
- small textures and everyday details.

World composition:

- a macro miniature garden;
- a giant leaf acting like terrain;
- oversized droplets;
- flowers becoming architectural forms;
- refracted captured light;
- small rain ripples;
- luminous greens and yellows;
- close depth-of-field changes.

Transition idea:

The camera leaves Sacred Geometry by following the light into a reflective point, droplet, jewel-like highlight, or opening.

It emerges inside Small Wonders at dramatically changed scale.

World copy:

Title:
“Small Wonders”

Body:
“The closer you look, the larger it gets.”

Action:
“Look closer”

Use refraction carefully.

Do not distort the entire image or make the video look like a shader demonstration.

## Scene 04 — Living Things

Source photography:

- parakeet in foliage;
- sleeping cat;
- cattle;
- animals observed quietly.

World composition:

- a miniature hidden canopy;
- layered foliage;
- filtered light;
- deep greens;
- small clearings;
- a central reveal based on the parakeet;
- a warmer sheltered detail inspired by the cat;
- distant open terrain inspired by the cattle image.

Do not generate exaggerated cartoon animals.

Do not make realistic animals move unnaturally.

Prefer:

- restrained image-inspired animal presence;
- subtle head or breathing motion only when generation looks natural;
- environmental movement;
- foliage occlusion;
- passing shafts of light;
- stillness.

World copy:

Title:
“Living Things”

Body:
“Company that chooses its own distance.”

Action:
“Enter quietly”

## Scene 05 — Table Notes

Source photography:

- banana-leaf meal;
- grilled dishes;
- sandwiches;
- small plated food observations.

Use “Table Notes” instead of “At the Table” for the final implementation unless repository content constraints require retaining the old slug internally.

World composition:

- a warm miniature gathering space;
- banana-leaf-inspired ground planes;
- ceramic and clay surfaces;
- table-like circular composition;
- warm directional light;
- restrained steam;
- tactile shadows;
- spice, leaf, and toasted-gold colour accents;
- the captured-light path circling and gathering.

The scene should feel intimate and observational, not like a restaurant advertisement.

World copy:

Title:
“Table Notes”

Body:
“Meals worth interrupting.”

Action:
“Enter Table Notes”

Closing copy during the final portion:

“Every world, on one sheet.”

Primary action:
“Open the Index”

Supporting actions:

- “Read the Field Notes”
- “Send a Signal”
- “Return to the beginning”

## Seam construction

Seam quality is non-negotiable.

For architecture B:

- every connector start image must be the actual last rendered frame of the preceding dive clip;
- every connector end image must be the actual first rendered frame of the following dive clip;
- never use the original still as a connector boundary;
- extract boundary frames from the rendered source clips;
- apply only a small crossfade as insurance.

Run automated SSIM checks after final encoding and after any re-roll.

Threshold policy:

- `>= 0.90`: pass;
- `0.75–0.90`: warning requiring visual inspection;
- `< 0.75`: fail and regenerate or repair.

For architecture A:

- every new leg starts from the actual final frame of the previous leg;
- do not use an end image that forces camera reversal;
- inspect the final second of each leg before generating the next;
- every leg must settle into a slow forward drift at the handoff.

Verify seams in both forward and reverse scroll directions.

## Video encoding

Prepare browser-scrubbable H.264 MP4 assets.

For desktop/master clips:

- retain native source resolution;
- strip audio;
- use a sensible CRF near 20;
- use a small GOP near 8;
- add faststart;
- use restrained sharpening only when necessary;
- do not upscale lower-resolution model output;
- extract poster images from the encoded clips themselves.

For phone encodes:

- create 720p variants from the final master;
- use a smaller GOP near 4;
- strip audio;
- create matching mobile posters from those encoded files.

Keep raw generation sources separate from final web assets.

Store assets using a clear repository structure such as:

```text
public/media/pocket-worlds/
  master/
  mobile/
  posters/
  stills/
  source/
  manifests/
```

Adjust to existing repository conventions where appropriate.

Do not place generated working files randomly in `public/`.

## Mobile asset strategy

Mobile quality matters.

Default to:

- mobile-specific 720p encodes;
- the same underlying cinematic chain;
- centre-safe composition;
- lighter prefetch and decoding;
- touch-hardened scroll behaviour.

Do not automatically spend extra credits on a full portrait chain.

After draft previz, test every scene at portrait mobile dimensions.

If centre cropping fails for one or two scenes:

- identify exactly which scenes fail;
- show the crop issue;
- estimate the extra generation cost;
- ask approval before generating 9:16 reframes.

A full portrait chain must not be generated silently.

Tablets should use desktop/master visual assets when their screen class supports them, while retaining touch behaviour.

## Application integration

Integrate the scroll engine into the existing TanStack Start app.

Do not build a second standalone site.

The homepage should retain server-rendered semantic content before JavaScript loads.

Recommended responsibilities:

- a route-level, client-only lazy-loaded cinematic experience;
- a typed scroll-world configuration;
- an isolated scrub-controller wrapper;
- DOM-based scene copy;
- DOM-based navigation and CTAs;
- a stable editorial fallback;
- capability and reduced-motion selection;
- cleanup on route unmount.

The exact filenames are your decision.

Keep ownership clear and avoid one giant homepage component.

Do not let the third-party engine:

- duplicate the existing header;
- duplicate the footer;
- inject unscoped global styles;
- create a second routing system;
- own SEO metadata;
- bypass the app’s theme;
- intercept links incorrectly.

Namespace imported engine styles under the FrameOS homepage.

Adapt the portable engine to React rather than fighting React’s lifecycle.

Destroy listeners, animation frames, object URLs, and observers on unmount.

Do not initialise the engine twice during route re-entry or development strict mode.

## Homepage layout

Use one full-viewport pinned video surface during the cinematic journey.

Layer the existing FrameOS UI around it:

- header and navigation;
- hero identity;
- scene title;
- short body copy;
- enter-world action;
- subtle world-progress rail;
- Index skip link.

Keep text and controls as semantic DOM.

The video should use cover framing while protecting focal points.

Use adaptive text placement so copy does not sit over the active subject.

Do not crowd the screen with tags or fake camera controls.

The route rail may show five understated nodes corresponding to the worlds.

The active node should reflect current scroll progress.

Allow clicking a node only when doing so can seek reliably and accessibly.

## Entering a world

At each scene’s linger point, reveal a real DOM link to its existing collection route.

Clicking it should:

- freeze or hold the current poster/video frame cleanly;
- fade or zoom with restrained continuity;
- navigate to the existing world route;
- not break browser back/forward;
- restore reasonable homepage progress when returning where practical.

Do not implement fragile routing hacks merely to simulate an impossible shared-video transition.

Direct route refresh must continue working.

The Index, world pages, photo detail routes, Field Notes, and Signal should remain real pages.

## Existing work to preserve

Preserve unless inspection shows a real defect:

- TanStack Start routing;
- Sanity content schemas;
- Cloudinary/photo repository architecture;
- cache and provider layers;
- publication guards;
- portrait fail-closed behaviour;
- photo detail pages;
- Index/contact sheet;
- responsive image pipeline;
- Field Notes;
- Signal;
- navigation;
- typography;
- current editorial fallback;
- SEO route metadata;
- existing tests.

Do not modify the photo content model merely to support the video homepage.

The cinematic homepage should consume existing world metadata where sensible.

## Remove or demote

After replacement is verified:

- remove the failed real-time WebGL homepage scene;
- remove unused world geometry and shader code;
- remove unused R3F/Three dependencies if no longer referenced;
- remove duplicate world-card sections from the primary cinematic flow;
- retain a refined version of the editorial cards as the fallback when useful.

Do not delete fallback content before verifying reduced-motion and no-video modes.

## Progressive enhancement

The homepage must have clear experience tiers.

### Full cinematic mode

Used when:

- JavaScript is enabled;
- motion is allowed;
- data saver is off;
- required media playback works;
- connection/device conditions are adequate.

Features:

- scroll-scrub video;
- full scene transitions;
- scene overlays;
- progress rail;
- prefetch of nearby clips.

### Stills mode

Used for:

- `prefers-reduced-motion`;
- data-saver;
- iOS Low Power Mode playback rejection;
- failed video initialisation;
- unsupported or constrained conditions.

Features:

- high-quality extracted stills;
- gentle crossfades;
- same copy and CTAs;
- same journey order;
- no blank canvas;
- no error message for losing an optional enhancement.

### Basic DOM mode

Used when JavaScript fails or is unavailable.

Features:

- crawlable hero;
- all five world summaries;
- real route links;
- Index access;
- Field Notes and Signal links;
- no dependency on generated video for comprehension.

## SEO

Server-render crawlable homepage content.

Include:

- one H1 with the main positioning;
- one H2 and paragraph for each world;
- real links to each world;
- real Index link;
- Field Notes link;
- Signal link.

The cinematic layer may visually replace or conceal this copy after hydration, but the served HTML must contain meaningful content.

Do not create duplicate visible headings for screen readers.

Use a deliberate visually-hidden/engine-mounted strategy.

## Loading

Do not show a long theatrical loader.

First paint should include:

- the FrameOS header;
- hero copy;
- extracted first-frame poster;
- Begin and Index actions.

Load the cinematic engine afterward.

The poster must be extracted from the encoded first clip so the poster-to-video transition does not jump.

Prefetch:

- current clip;
- next likely connector;
- next world clip.

Do not download the entire video chain immediately on mobile.

Use the hardened engine’s blob URL strategy for reliable seeking when byte-range support is absent.

Release object URLs when no longer needed.

## Theme handling

Keep the existing light/dark preference.

Do not create a second expensive dark video chain.

The generated cinematic art should be designed as a bright, warm, adaptive experience.

In dark mode:

- adjust UI chrome;
- apply only a restrained atmospheric overlay or colour treatment;
- preserve image quality and subject visibility;
- do not turn the footage into muddy black video.

The theme control must clearly communicate its action or state.

## Field Notes, Signal, and Index

The homepage is the primary change.

Do not needlessly redesign strong supporting pages.

Only polish them where the new cinematic identity creates an obvious mismatch.

Index must remain:

- fast;
- independently usable;
- keyboard accessible;
- independent of the video engine;
- available as the immediate skip path.

Field Notes and Signal must remain readable and lightweight.

## Accessibility

Verify:

- keyboard navigation;
- visible focus states;
- real links and buttons;
- readable contrast over every scene;
- no essential hover-only interaction;
- reduced-motion stills mode;
- no autoplay audio;
- no scroll hijacking that blocks normal control;
- scene copy remains accessible;
- Index is always reachable;
- world routes work without the video layer.

The scroll experience may pin the video surface, but the user must retain predictable browser scrolling.

## Performance

Treat performance as a release requirement.

Measure:

- initial JavaScript added by the engine;
- first poster load;
- first clip load;
- total transferred media in the opening journey;
- desktop master size;
- mobile variant size;
- scroll responsiveness;
- memory after route exit;
- mobile behaviour under CPU throttling.

Avoid:

- continuous React state updates for raw scroll progress;
- React re-renders on every animation frame;
- duplicated global listeners;
- unnecessary media fetches;
- loading source-resolution photographs into the homepage;
- retaining old WebGL runtime alongside the final video engine.

Use refs and direct media timing for high-frequency progress.

Commit React state only for meaningful UI changes such as the active world.

Lazy-load the heavy homepage engine.

## Verification workflow

Do not treat compilation as completion.

### Asset verification

Run:

- encoded poster checks;
- `ffprobe` resolution/duration checks;
- SSIM seam verification;
- file-size reporting;
- first-frame/poster comparison;
- mobile/master manifest validation.

### Browser verification

Verify:

- desktop Chromium;
- mobile phone viewport;
- tablet viewport;
- touch behaviour;
- fast downward scroll;
- reverse scroll;
- scene boundaries;
- all world CTAs;
- direct world routing;
- browser back;
- browser forward;
- refresh on a direct route;
- route re-entry;
- resize;
- orientation change;
- theme switching;
- first poster takeover;
- console cleanliness;
- currentTime tracking;
- no scene flashes or blank frames.

### Fallback verification

Explicitly test:

- `prefers-reduced-motion`;
- `saveData`;
- rejected `HTMLMediaElement.play()` as a Low Power Mode proxy;
- failed media fetch;
- JavaScript-disabled or SSR HTML inspection.

Fallback mode must perform zero unnecessary video downloads where applicable.

### Repository checks

Run:

- lint;
- typecheck;
- tests;
- production build.

Separate pre-existing failures from introduced failures.

Do not claim a check passed without actual output from this run.

## Visual QA

Compare the completed experience against the approved FrameOS reference frame and Vectr inspiration.

The final result should satisfy all of these:

- the viewport feels visually full and authored;
- the worlds read as real miniature environments;
- the camera clearly travels between destinations;
- the light path is meaningful and continuous;
- each world has a distinct atmosphere;
- copy and world actions remain readable;
- no floating photo-billboard aesthetic remains;
- no empty cream void dominates;
- there are no obvious video cuts;
- reverse scroll does not reveal bad seams;
- mobile still feels cinematic;
- the photographs remain the artistic source;
- the site feels more memorable than a conventional editorial portfolio.

Capture:

- first viewport;
- each world’s linger point;
- final archive state;
- phone viewport;
- reduced-motion state;
- a short screen recording of the complete journey.

Keep refining until the journey looks deliberate and premium.

## Documentation

Update the existing Pocket Worlds documentation with:

- why the WebGL approach was replaced;
- video-generation architecture;
- world order;
- shared style preamble;
- source photo references;
- clip and connector manifest;
- encoding rules;
- mobile tiers;
- fallback logic;
- SEO strategy;
- asset regeneration process;
- Higgsfield generation IDs where useful;
- SSIM results;
- performance results;
- known limitations.

Do not put secrets or tokens in documentation.

## Final definition of done

The work is complete only when:

- the failed WebGL homepage is replaced;
- the homepage scroll-scrubs a cohesive cinematic video journey;
- all five worlds are represented;
- the light path connects the journey;
- world CTAs navigate correctly;
- seams are machine-checked and visually verified;
- desktop master clips work;
- mobile encodes work;
- posters match encoded first frames;
- reduced-motion mode works;
- data-saver mode works;
- Low Power Mode rejection falls back safely;
- server-rendered SEO content exists;
- Index remains available immediately;
- portrait content remains unpublished;
- lint passes;
- typecheck passes;
- tests pass;
- production build passes;
- desktop and mobile browser QA has been completed;
- generated asset costs and remaining limitations are reported honestly.

## Final response

Lead with the completed visitor experience.

Report:

- the final journey order;
- chosen camera architecture;
- generated asset count;
- Higgsfield models used;
- spend compared with estimate;
- re-roll count;
- how the light connects scenes;
- desktop and mobile asset strategy;
- media file sizes;
- SSIM results for every seam;
- fallback behaviour;
- browser QA completed;
- repository checks;
- performance observations;
- anything still incomplete.

Do not narrate every command.

Do not call the work finished if final assets were not generated or if the homepage is only wired to placeholder videos.

```

This prompt intentionally abandons real-time 3D while preserving the **cinematic miniature-world look**. The important difference is that Codex should use the scroll-world pipeline to produce the visual assets first, then integrate them—not recreate the same failed concept using video-shaped placeholders.
```
