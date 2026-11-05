import { createFileRoute } from '@tanstack/react-router'

import { StatusBanner } from '@/components/content/StatusBanner'
import { PocketWorldsHome } from '@/components/home/PocketWorldsHome'
import { getHomeViewServer, getWorldsOverviewServer } from '@/server/server-functions/portfolio'

export const Route = createFileRoute('/')({
  loader: async () => {
    const [home, overview] = await Promise.all([getHomeViewServer(), getWorldsOverviewServer()])
    return { home: home!, overview: overview! }
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
  const { home, overview } = Route.useLoaderData()

  return (
    <main id="worlds" className="home-main">
      {overview.isDegraded || home.isDegraded ? (
        <div className="page-shell px-4 pt-6">
          <StatusBanner title="Serving cached content.">
            The archive is showing its last successful snapshot while the image provider recovers.
          </StatusBanner>
        </div>
      ) : null}

      <PocketWorldsHome page={home.page} overviews={overview.worlds} />
    </main>
  )
}
