import { createFileRoute, notFound } from '@tanstack/react-router'

import { StatusBanner } from '@/components/content/StatusBanner'
import { WorldScene } from '@/components/worlds/WorldScene'
import { buildSeoHead, collectionPageJsonLd, getPhotoShareImage } from '@/lib/seo'
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
    if (!loaderData) {
      return {}
    }

    const { world, feed } = loaderData
    const canonicalUrl = new URL(
      `/worlds/${encodeURIComponent(world.slug)}`,
      feed.canonicalUrl
    ).toString()
    const origin = new URL(canonicalUrl).origin
    const title = world.seo?.title ?? `${world.name} — FrameOS Pocket Worlds`
    const description =
      world.seo?.description ??
      world.description ??
      `${world.line} Photographs from the ${world.name} world, all made on a phone.`
    const photos = feed.items.map((item) => item.photo)
    // The world's SEO image (a photo slug), then its hero, then its first frame.
    const cover =
      photos.find((photo) => photo.slug === world.seo?.imagePublicId) ??
      photos.find((photo) => photo.slug === world.heroPhoto?.slug) ??
      photos.at(0)
    const image = cover ? getPhotoShareImage(cover, origin) : null

    return buildSeoHead({
      title,
      description,
      canonicalUrl,
      image,
      jsonLd: [collectionPageJsonLd({ canonicalUrl, name: title, description, image, photos })],
    })
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
