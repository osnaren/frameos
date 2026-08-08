import { createFileRoute, notFound } from '@tanstack/react-router'

import { StatusBanner } from '@/components/content/StatusBanner'
import { WorldScene } from '@/components/worlds/WorldScene'
import { getGalleryFeedServer, getWorldsServer } from '@/server/server-functions/portfolio'

export const Route = createFileRoute('/worlds/$world')({
  loader: async ({ params }) => {
    const worlds = await getWorldsServer()
    const world = worlds!.find((entry) => entry.slug === params.world)

    if (!world) {
      throw notFound()
    }

    const feed = await getGalleryFeedServer({ data: { category: world.slug, limit: 48 } })
    return { world, worlds: worlds!, feed }
  },
  staleTime: 60_000,
  gcTime: 300_000,
  head: ({ loaderData }) => {
    const world = loaderData?.world
    const canonicalUrl = world
      ? new URL(
          `/worlds/${encodeURIComponent(world.slug)}`,
          loaderData.feed.canonicalUrl
        ).toString()
      : undefined

    return world
      ? {
          meta: [
            { title: world.seo?.title ?? `${world.name} — FrameOS Pocket Worlds` },
            {
              name: 'description',
              content:
                world.seo?.description ??
                world.description ??
                `${world.line} Photographs from the ${world.name} world, all made on a phone.`,
            },
          ],
          links: [{ rel: 'canonical', href: canonicalUrl }],
        }
      : {}
  },
  component: WorldRoute,
})

function WorldRoute() {
  const { world, worlds, feed } = Route.useLoaderData()
  const index = worlds.findIndex((entry) => entry.slug === world.slug)
  const previousWorld = worlds[(index - 1 + worlds.length) % worlds.length]
  const nextWorld = worlds[(index + 1) % worlds.length]
  const photos = feed.items.map((item) => item.photo)

  return (
    <main className="relative overflow-clip">
      {feed.isDegraded ? (
        <div className="page-shell pt-6">
          <StatusBanner title="Serving cached content.">
            This world is showing its last successful snapshot while the image provider recovers.
          </StatusBanner>
        </div>
      ) : null}
      <WorldScene
        world={world}
        photos={photos}
        worldIndex={index}
        worldCount={worlds.length}
        previousWorld={previousWorld}
        nextWorld={nextWorld}
      />
    </main>
  )
}
