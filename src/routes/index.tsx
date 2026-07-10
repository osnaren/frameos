import { Link, createFileRoute } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'

import { StatusBanner } from '@/components/content/StatusBanner'
import { PocketOpening } from '@/components/worlds/PocketOpening'
import { WorldPortal } from '@/components/worlds/WorldPortal'
import { getPublicWorlds } from '@/content/worlds'
import { contactSheet, revealVariants } from '@/lib/motion'
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
  const reducedMotion = useReducedMotion()
  const photos = feed.items.map((item) => item.photo)
  const worlds = getPublicWorlds()

  return (
    <main>
      <PocketOpening photos={photos} />

      {feed.isDegraded || home?.isDegraded ? (
        <div className="page-shell px-4 pt-6">
          <StatusBanner title="Serving cached content.">
            The archive is showing its last successful snapshot while the image provider recovers.
          </StatusBanner>
        </div>
      ) : null}

      <section id="worlds" aria-label="The worlds" className="px-4 pt-20 pb-10 sm:pt-28">
        <div className="page-shell">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mono-label">Five worlds · {photos.length} frames</p>
              <h2 className="display-font mt-3 text-4xl font-light text-[var(--ink)] sm:text-5xl">
                Pick a world to step into.
              </h2>
            </div>
            <Link to="/archive" className="text-sm font-semibold text-[var(--muted-strong)]">
              Or see every frame at once →
            </Link>
          </div>

          <motion.div
            className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-12"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.12 }}
            variants={contactSheet}
          >
            {worlds.map((world, index) => {
              const worldPhotos = photos.filter((photo) => photo.category === world.slug)
              const hero =
                worldPhotos.find((photo) => photo.slug === world.heroId) ?? worldPhotos[0]
              /* Asymmetric editorial arrangement: two wide portals, then three */
              const span =
                index === 0
                  ? 'lg:col-span-7 lg:min-h-[420px]'
                  : index === 1
                    ? 'lg:col-span-5 lg:min-h-[420px]'
                    : 'lg:col-span-4'

              return (
                <WorldPortal
                  key={world.slug}
                  world={world}
                  hero={hero}
                  count={worldPhotos.length}
                  className={span}
                  sizes={
                    index < 2 ? '(max-width: 768px) 92vw, 55vw' : '(max-width: 768px) 92vw, 32vw'
                  }
                />
              )
            })}
          </motion.div>
        </div>
      </section>

      <section aria-label="About this archive" className="px-4 pt-16 pb-20">
        <motion.div
          className="page-shell max-w-2xl"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={revealVariants(reducedMotion)}
        >
          <p className="display-italic text-xl leading-9 text-[var(--muted-strong)] sm:text-2xl">
            “A world noticed through a pocket-sized frame.”
          </p>
          <p className="mt-4 text-sm leading-7 text-[var(--muted)]">
            Every photograph in this archive was made with a phone — the camera that happens to be
            there when something is worth keeping.{' '}
            <Link to="/notes" className="font-semibold">
              Read the field notes
            </Link>{' '}
            or{' '}
            <Link to="/signal" className="font-semibold">
              send a signal
            </Link>
            .
          </p>
        </motion.div>
      </section>
    </main>
  )
}
