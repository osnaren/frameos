# FrameOS Documentation

This folder is the source of truth for how FrameOS is built, why it's built
that way, and how to work with it day to day. It's organized so each
document answers one question — use the table below instead of searching one
giant file.

## Start here

| I want to...                         | Read                                                                     |
| ------------------------------------ | ------------------------------------------------------------------------ |
| Run the app locally                  | [guides/getting-started.md](guides/getting-started.md)                   |
| Understand the system end-to-end     | [architecture/overview.md](architecture/overview.md)                     |
| Add or edit photos and pages         | [guides/content-management.md](guides/content-management.md)             |
| Deploy or configure hosting          | [guides/deployment.md](guides/deployment.md)                             |
| Look up an environment variable      | [reference/environment-variables.md](reference/environment-variables.md) |
| Understand _why_ a decision was made | [decisions/](decisions/)                                                 |

## Structure

```
docs/
├── architecture/           How the system is built
│   ├── overview.md           System diagram, stack, layer responsibilities
│   ├── data-layer.md         Provider/repository contracts, Photo data model, routing
│   ├── caching-and-webhooks.md  Cache tags, invalidation, webhook flow, reconcile
│   └── image-delivery.md     Image presets, Sanity CDN transform URLs
├── guides/                 How to do things
│   ├── getting-started.md    Local dev setup, fixture mode
│   ├── content-management.md Sanity Studio, photo schema, curation
│   └── deployment.md         Vercel, cron, webhooks, free-tier limits
├── decisions/              Why things are built this way (ADRs)
│   ├── 0001-tanstack-start-baseline.md
│   ├── 0002-remove-cloudinary.md
│   └── 0003-standalone-sanity-studio.md
├── reference/               Lookup tables
│   └── environment-variables.md
├── pocket-worlds.md         Production notes for the cinematic homepage
└── video-pocket-worlds.md   Original creative brief (historical)
```

## Keeping this up to date

- One topic per file. If a file starts covering two unrelated things, split it.
- Update the relevant doc in the same change that changes the behavior it
  describes — a stale doc is worse than no doc.
- Add a decision record when you make a change that a future contributor
  would reasonably ask "why did we do it this way?" about (see the
  [decisions/](decisions/) folder for the format).
