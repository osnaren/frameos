import { Suspense, lazy, useCallback, useRef } from 'react'

import { Link, createFileRoute, useNavigate } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'

import { StatusBanner } from '@/components/content/StatusBanner'
import { OpeningHeadline, PocketOpeningVisuals } from '@/components/worlds/PocketOpening'
import { WorldPortal } from '@/components/worlds/WorldPortal'
import { getPublicWorlds } from '@/content/worlds'
import { useExperienceTier } from '@/lib/capability'
import { contactSheet, revealVariants } from '@/lib/motion'
import { getGalleryFeedServer, getHomeViewServer } from '@/server/server-functions/portfolio'

/** The WebGL journey loads only on capable devices, and only when this chunk is requested. */
const WanderScene = lazy(() => import('@/components/worlds/spatial/wander/WanderScene'))

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
  const tier = useExperienceTier()
  const navigate = useNavigate()
  const journeyRef = useRef<HTMLDivElement>(null)
  const photos = feed.items.map((item) => item.photo)
  const worlds = getPublicWorlds()

  const enterWander = useCallback(() => {
    void navigate({ to: '/worlds/$world', params: { world: 'wander' } })
  }, [navigate])

  const beginJourney = useCallback(() => {
    const container = journeyRef.current
    if (!container) {
      return
    }
    const rect = container.getBoundingClientRect()
    const containerTop = window.scrollY + rect.top
    const scrollable = container.offsetHeight - window.innerHeight
    window.scrollTo({ top: containerTop + scrollable * 0.78, behavior: 'smooth' })
  }, [])

  return (
    <main>
      {tier === 'animated' ? (
        <motion.section
          aria-label="Pocket Worlds opening"
          className="relative flex min-h-[92svh] flex-col justify-end overflow-hidden px-4 pb-14"
          initial="hidden"
          animate="visible"
          variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
        >
          <PocketOpeningVisuals photos={photos} />
          <OpeningHeadline />
        </motion.section>
      ) : (
        <section aria-label="Pocket Worlds journey — follow the light">
          <div ref={journeyRef} className="relative" style={{ height: '340svh' }}>
            <div className="sticky top-0 h-svh overflow-hidden">
              <Suspense fallback={null}>
                <WanderScene
                  containerRef={journeyRef}
                  quality={tier === 'spatial' ? 'full' : 'lite'}
                  onEnterWorld={enterWander}
                >
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    variants={{ visible: { transition: { staggerChildren: 0.09 } } }}
                  >
                    <OpeningHeadline onBegin={beginJourney} />
                  </motion.div>
                </WanderScene>
              </Suspense>
            </div>
          </div>
        </section>
      )}

      {feed.isDegraded || home?.isDegraded ? (
        <div className="page-shell px-4 pt-6">
          <StatusBanner title="Serving cached content.">
            The archive is showing its last successful snapshot while the image provider recovers.
          </StatusBanner>
        </div>
      ) : null}

      <section id="worlds" aria-label="The worlds" className="px-4 pt-20 pb-10 sm:pt-24">
        <div className="page-shell">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="mono-label">Five worlds · {photos.length} frames</p>
              <h2 className="display-font mt-3 text-4xl font-light text-(--ink) sm:text-5xl">
                {tier === 'animated' ? 'Pick a world to step into.' : 'Or step straight in.'}
              </h2>
            </div>
            <Link to="/archive" className="px-2 py-2 text-sm font-semibold text-(--muted-strong)">
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
          <p className="display-italic text-xl leading-9 text-(--muted-strong) sm:text-2xl">
            “A world noticed through a pocket-sized frame.”
          </p>
          <p className="mt-4 text-sm leading-7 text-(--muted)">
            The archive is small on purpose — eighteen frames across five worlds, each kept only
            because it was worth keeping.{' '}
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
