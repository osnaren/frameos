import { createFileRoute } from '@tanstack/react-router'

import { StatusBanner } from '@/components/content/StatusBanner'
import { PocketWorldsExperience } from '@/components/worlds/cinematic/PocketWorldsExperience'
import { getGalleryFeedServer, getHomeViewServer } from '@/server/server-functions/portfolio'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [home, feed] = await Promise.all([
      getHomeViewServer(),
      getGalleryFeedServer({ data: { limit: 48 } }),
    ])
    return { home, feed }
  },
  staleTime: 60_000,
  gcTime: 300_000,
  head: ({ loaderData }) =>
    loaderData?.home
      ? {
          meta: [
            { title: loaderData.home.page.seo.title },
            { name: 'description', content: loaderData.home.page.seo.description },
          ],
          links: [{ rel: 'canonical', href: loaderData.home.canonicalUrl }],
        }
      : {},
  component: HomeRoute,
})

function HomeRoute() {
  const { home, feed } = Route.useLoaderData()
  const photos = feed.items.map((item) => item.photo)
  const worldCounts = photos.reduce<Record<string, number>>((counts, photo) => {
    if (photo.category) {
      counts[photo.category] = (counts[photo.category] ?? 0) + 1
    }
    return counts
  }, {})

  return (
    <main id="worlds">
      <PocketWorldsExperience frameCount={photos.length} worldCounts={worldCounts} />

      {feed.isDegraded || home?.isDegraded ? (
        <div className="page-shell px-4 py-8">
          <StatusBanner title="Serving cached content.">
            The archive is showing its last successful snapshot while the image provider recovers.
          </StatusBanner>
        </div>
      ) : null}
    </main>
  )
}
