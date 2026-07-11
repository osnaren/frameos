import { useRef } from 'react'

import { Link } from '@tanstack/react-router'
import { motion, useReducedMotion, useScroll, useTransform, type Variants } from 'framer-motion'

import { PhotoFrame } from '@/components/photo/PhotoFrame'
import { contactSheet, revealVariants, settleSlow } from '@/lib/motion'

import type { WorldDefinition } from '@/content/worlds'
import type { Photo } from '@/types/photo'

interface SceneProps {
  world: WorldDefinition
  hero: Photo | undefined
  rest: Photo[]
  frameNumber: (photo: Photo) => number
}

/* ---------- Wander: the horizon expands and becomes the environment ---------- */

function DriftScene({ hero, rest, frameNumber }: SceneProps) {
  const heroRef = useRef<HTMLDivElement>(null)
  const reducedMotion = useReducedMotion()
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start end', 'center center'],
  })
  const width = useTransform(scrollYProgress, [0, 1], ['72%', '100%'])
  const radius = useTransform(scrollYProgress, [0, 1], ['14px', '0px'])

  return (
    <div>
      {hero ? (
        <div ref={heroRef} className="flex justify-center overflow-hidden">
          <motion.div
            className="w-full"
            style={reducedMotion ? undefined : { width, borderRadius: radius, overflow: 'hidden' }}
          >
            <PhotoFrame
              photo={hero}
              frameNumber={frameNumber(hero)}
              priority
              sizes="100vw"
              className="[&_figcaption]:page-shell [&_figcaption]:mt-4"
            />
          </motion.div>
        </div>
      ) : null}

      <div className="page-shell mt-24 space-y-28 sm:mt-32">
        {rest.map((photo, index) => (
          <motion.div
            key={photo.slug}
            className={`flex ${index % 2 === 0 ? 'justify-start' : 'justify-end'}`}
            initial={reducedMotion ? { opacity: 0 } : { opacity: 0, x: index % 2 === 0 ? -44 : 44 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={settleSlow}
          >
            <PhotoFrame
              photo={photo}
              frameNumber={frameNumber(photo)}
              sizes="(max-width: 768px) 92vw, 44vw"
              className="w-full max-w-[520px]"
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Sacred Geometry: a centered column the towers rise through ---------- */

function RiseScene({ hero, rest, frameNumber }: SceneProps) {
  const reducedMotion = useReducedMotion()
  const rise: Variants = reducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } } }
    : { hidden: { opacity: 0, y: 90 }, visible: { opacity: 1, y: 0, transition: settleSlow } }
  const photos = hero ? [hero, ...rest] : rest

  return (
    <div className="relative">
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-1/2 hidden w-px -translate-x-1/2 sm:block"
        style={{ background: 'color-mix(in srgb, var(--world-accent) 34%, transparent)' }}
      />
      <div className="relative mx-auto flex w-full max-w-[620px] flex-col items-center gap-28 px-4">
        {photos.map((photo, index) => (
          <motion.div
            key={photo.slug}
            className="w-full"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={rise}
          >
            <PhotoFrame
              photo={photo}
              frameNumber={frameNumber(photo)}
              priority={index === 0}
              sizes="(max-width: 768px) 92vw, 620px"
              className="[&_figcaption]:justify-center"
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Small Wonders: everything arrives out of focus, then resolves ---------- */

function MacroScene({ hero, rest, frameNumber }: SceneProps) {
  const reducedMotion = useReducedMotion()
  const focusPull: Variants = reducedMotion
    ? { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.3 } } }
    : {
        hidden: { opacity: 0, scale: 1.05, filter: 'blur(10px)' },
        visible: { opacity: 1, scale: 1, filter: 'blur(0px)', transition: settleSlow },
      }

  return (
    <div className="page-shell">
      {hero ? (
        <motion.div
          className="mx-auto w-full max-w-[640px]"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={focusPull}
        >
          <PhotoFrame
            photo={hero}
            frameNumber={frameNumber(hero)}
            priority
            sizes="(max-width: 768px) 92vw, 640px"
          />
        </motion.div>
      ) : null}

      <div className="mt-24 grid grid-cols-1 gap-x-8 gap-y-20 sm:grid-cols-2">
        {rest.map((photo, index) => (
          <motion.div
            key={photo.slug}
            className={index % 2 === 1 ? 'sm:mt-24' : ''}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.25 }}
            variants={focusPull}
          >
            <PhotoFrame
              photo={photo}
              frameNumber={frameNumber(photo)}
              sizes="(max-width: 768px) 92vw, 44vw"
              className={index % 3 === 2 ? 'mx-auto w-full max-w-[380px]' : ''}
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ---------- Living Things: a dark, quiet passage; stillness around each subject ---------- */

function QuietScene({ hero, rest, frameNumber }: SceneProps) {
  const reducedMotion = useReducedMotion()
  const breathe: Variants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { duration: reducedMotion ? 0.3 : 1.4 } },
  }
  const photos = hero ? [hero, ...rest] : rest

  return (
    <div
      className="-mx-4 px-4 py-24 sm:py-32"
      style={{
        background: `linear-gradient(180deg, transparent, var(--world-deep) 12%, var(--world-deep) 88%, transparent)`,
      }}
    >
      <div className="mx-auto flex w-full max-w-[680px] flex-col gap-36">
        {photos.map((photo, index) => (
          <motion.div
            key={photo.slug}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            variants={breathe}
          >
            <PhotoFrame
              photo={photo}
              frameNumber={frameNumber(photo)}
              priority={index === 0}
              sizes="(max-width: 768px) 92vw, 680px"
              className="[&_figcaption_.display-italic]:!text-white/75 [&_figcaption_.mono-label]:!text-white/55"
            />
          </motion.div>
        ))}
      </div>
    </div>
  )
}

/* ---------- At the Table: a warm, tactile gathering ---------- */

function GatherScene({ hero, rest, frameNumber }: SceneProps) {
  const reducedMotion = useReducedMotion()

  return (
    <div className="page-shell">
      {hero ? (
        <motion.div
          className="mx-auto w-full max-w-[880px]"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={revealVariants(reducedMotion)}
        >
          <PhotoFrame
            photo={hero}
            frameNumber={frameNumber(hero)}
            priority
            sizes="(max-width: 768px) 92vw, 880px"
            className="[&>a]:shadow-[0_36px_80px_var(--shadow)]"
          />
        </motion.div>
      ) : null}

      <motion.div
        className="mt-20 grid grid-cols-1 gap-x-10 gap-y-16 sm:grid-cols-3"
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        variants={contactSheet}
      >
        {rest.map((photo, index) => (
          <motion.div
            key={photo.slug}
            variants={revealVariants(reducedMotion)}
            style={reducedMotion ? undefined : { rotate: [-1.2, 0.8, -0.6][index % 3] }}
            className={index % 3 === 1 ? 'sm:mt-12' : ''}
          >
            <PhotoFrame
              photo={photo}
              frameNumber={frameNumber(photo)}
              sizes="(max-width: 768px) 92vw, 30vw"
              className="[&>a]:shadow-[0_22px_48px_var(--shadow)]"
            />
          </motion.div>
        ))}
      </motion.div>
    </div>
  )
}

/* ---------- Scene shell ---------- */

const SCENES = {
  drift: DriftScene,
  rise: RiseScene,
  macro: MacroScene,
  quiet: QuietScene,
  gather: GatherScene,
}

export function WorldScene({
  world,
  photos,
  previousWorld,
  nextWorld,
}: {
  world: WorldDefinition
  photos: Photo[]
  previousWorld: WorldDefinition
  nextWorld: WorldDefinition
}) {
  const reducedMotion = useReducedMotion()
  const hero = photos.find((photo) => photo.slug === world.heroId) ?? photos.at(0)
  const rest = photos.filter((photo) => photo.slug !== hero?.slug)
  const frameNumber = (photo: Photo) => photos.findIndex((p) => p.slug === photo.slug) + 1
  const Scene = SCENES[world.signature]

  return (
    <div
      style={
        {
          '--world-wash': world.mood.wash,
          '--world-deep': world.mood.deep,
          '--world-accent': world.mood.accent,
        } as React.CSSProperties
      }
    >
      {/* Ambient wash derived from the world's photographs */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[70vh]"
        style={{
          background: `linear-gradient(180deg, color-mix(in srgb, var(--world-wash) var(--wash-strength), transparent), transparent)`,
        }}
      />

      <motion.header
        className="page-shell px-4 pt-14 pb-16 text-center sm:pt-20 sm:pb-24"
        initial="hidden"
        animate="visible"
        variants={{ visible: { transition: { staggerChildren: 0.08 } } }}
      >
        <motion.p className="mono-label" variants={revealVariants(reducedMotion)}>
          <Link to="/" hash="worlds" className="no-underline">
            Worlds
          </Link>{' '}
          / {world.name} · {String(photos.length).padStart(2, '0')} frames
        </motion.p>
        <motion.h1
          className="display-font mt-5 text-[clamp(2.8rem,8vw,5.6rem)] leading-none font-light text-[var(--ink)]"
          variants={revealVariants(reducedMotion)}
        >
          {world.name}
        </motion.h1>
        <motion.p
          className="display-italic mt-4 text-lg text-[var(--muted-strong)] sm:text-xl"
          variants={revealVariants(reducedMotion)}
        >
          {world.line}
        </motion.p>
      </motion.header>

      <Scene world={world} hero={hero} rest={rest} frameNumber={frameNumber} />

      <nav
        aria-label="World navigation"
        className="page-shell mt-28 flex flex-wrap items-center justify-between gap-4 border-t border-[var(--line)] px-4 py-10"
      >
        <Link
          to="/worlds/$world"
          params={{ world: previousWorld.slug }}
          className="text-sm font-semibold text-[var(--muted-strong)] no-underline hover:text-[var(--ink)]"
        >
          ← {previousWorld.name}
        </Link>
        <Link to="/archive" className="mono-label no-underline">
          Index
        </Link>
        <Link
          to="/worlds/$world"
          params={{ world: nextWorld.slug }}
          className="text-sm font-semibold text-[var(--muted-strong)] no-underline hover:text-[var(--ink)]"
        >
          {nextWorld.name} →
        </Link>
      </nav>
    </div>
  )
}
