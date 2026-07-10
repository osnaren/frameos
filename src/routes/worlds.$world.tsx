import { createFileRoute, notFound } from '@tanstack/react-router'

import { StatusBanner } from '@/components/content/StatusBanner'
import { WorldScene } from '@/components/worlds/WorldScene'
import { getPublicWorlds, getWorld } from '@/content/worlds'
import { getGalleryFeedServer } from '@/server/server-functions/portfolio'

export const Route = createFileRoute('/worlds/$world')({
  loader: async ({ params }) => {
    const world = getWorld(params.world)

    if (!world || world.hidden) {
      throw notFound()
    }

    const feed = await getGalleryFeedServer({ data: { category: world.slug, limit: 48 } })
    return { worldSlug: world.slug, feed }
  },
  staleTime: 60_000,
  gcTime: 300_000,
  head: ({ loaderData }) => {
    const world = loaderData ? getWorld(loaderData.worldSlug) : null

    return world
      ? {
          meta: [
            { title: `${world.name} — FrameOS Pocket Worlds` },
            {
              name: 'description',
              content: `${world.line} Photographs from the ${world.name} world, all made on a phone.`,
            },
          ],
          links: [{ rel: 'canonical', href: loaderData!.feed.canonicalUrl }],
        }
      : {}
  },
  component: WorldRoute,
})

function WorldRoute() {
  const { worldSlug, feed } = Route.useLoaderData()
  const world = getWorld(worldSlug)!
  const worlds = getPublicWorlds()
  const index = worlds.findIndex((entry) => entry.slug === world.slug)
  const previousWorld = worlds[(index - 1 + worlds.length) % worlds.length]
  const nextWorld = worlds[(index + 1) % worlds.length]
  const photos = feed.items.map((item) => item.photo)

  return (
    <main className="relative px-4">
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
        previousWorld={previousWorld}
        nextWorld={nextWorld}
      />
    </main>
  )
}
