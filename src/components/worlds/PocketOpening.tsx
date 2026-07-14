import { Link } from '@tanstack/react-router'
import { motion, useReducedMotion, useTransform, type MotionValue } from 'framer-motion'

import { PhotoImage } from '@/components/photo/PhotoImage'
import { getWorld, type WorldSlug } from '@/content/worlds'
import { usePointerParallax } from '@/hooks/use-pointer-parallax'
import { revealVariants } from '@/lib/motion'

import type { Photo } from '@/types/photo'

/**
 * DOM opening layer, used two ways:
 * - `OpeningHeadline` is the identity block shared by every tier.
 * - `PocketOpeningVisuals` is the 2.5D fallback constellation (blurred
 *   fragments + sharp anchor) shown when the WebGL tier is unavailable:
 *   mobile, coarse pointers, reduced motion, low memory, or no WebGL.
 */
const FRAGMENTS: Array<{
  photoId: string
  world: WorldSlug
  className: string
  width: string
  depth: number
  blur: number
  rotate: number
}> = [
  {
    photoId: 'the-sea',
    world: 'wander',
    className: 'left-[4%] top-[16%] hidden md:block',
    width: 'clamp(150px, 17vw, 250px)',
    depth: 1.15,
    blur: 5,
    rotate: -3,
  },
  {
    photoId: 'tower-and-sky',
    world: 'sacred-geometry',
    className: 'right-[6%] top-[10%]',
    width: 'clamp(90px, 12vw, 170px)',
    depth: 0.8,
    blur: 4,
    rotate: 2.5,
  },
  {
    photoId: 'parakeet',
    world: 'living-things',
    className: 'right-[24%] top-[40%] hidden lg:block',
    width: 'clamp(100px, 13vw, 190px)',
    depth: 0.65,
    blur: 3,
    rotate: 2,
  },
  {
    photoId: 'banana-leaf-meal',
    world: 'at-the-table',
    className: 'right-[3%] bottom-[6%] hidden sm:block',
    width: 'clamp(150px, 16vw, 240px)',
    depth: 1.0,
    blur: 5,
    rotate: -2,
  },
  {
    photoId: 'rain-on-the-street',
    world: 'small-wonders',
    className: 'left-[38%] top-[4%] hidden lg:block',
    width: 'clamp(80px, 9vw, 130px)',
    depth: 0.5,
    blur: 6,
    rotate: -1.5,
  },
]

const ANCHOR_ID = 'leaf-after-rain'

function Fragment({
  fragment,
  photo,
  pointer,
}: {
  fragment: (typeof FRAGMENTS)[number]
  photo: Photo
  pointer: { x: MotionValue<number>; y: MotionValue<number> }
}) {
  const reducedMotion = useReducedMotion()
  const world = getWorld(fragment.world)!
  const shiftX = useTransform(pointer.x, (v) => v * fragment.depth * -46)
  const shiftY = useTransform(pointer.y, (v) => v * fragment.depth * -30)

  return (
    <motion.div
      className={`absolute z-10 ${fragment.className}`}
      style={{ x: shiftX, y: shiftY, width: fragment.width, rotate: fragment.rotate }}
      variants={revealVariants(reducedMotion)}
    >
      <Link
        to="/worlds/$world"
        params={{ world: fragment.world }}
        aria-label={`Enter ${world.name}`}
        className="pocket-frame group block no-underline shadow-[0_18px_40px_var(--shadow)]"
      >
        <PhotoImage
          publicId={photo.publicId}
          alt=""
          preset="card"
          sizes="18vw"
          className="h-auto w-full transition-[filter] duration-500 group-hover:blur-0 group-focus-visible:blur-0"
          style={{ filter: reducedMotion ? 'blur(1px)' : `blur(${fragment.blur}px)` }}
        />
        <span aria-hidden="true" className="frame-corners" />
        <span className="mono-label absolute bottom-2 left-3 z-10 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 group-focus-visible:opacity-100">
          {world.name}
        </span>
      </Link>
    </motion.div>
  )
}

export function PocketOpeningVisuals({ photos }: { photos: Photo[] }) {
  const reducedMotion = useReducedMotion()
  const pointer = usePointerParallax()
  const anchor = photos.find((photo) => photo.slug === ANCHOR_ID)
  const anchorX = useTransform(pointer.x, (v) => v * 14)
  const anchorY = useTransform(pointer.y, (v) => v * 10)

  return (
    <>
      {FRAGMENTS.map((fragment) => {
        const photo = photos.find((p) => p.slug === fragment.photoId)
        return photo ? (
          <Fragment key={fragment.photoId} fragment={fragment} photo={photo} pointer={pointer} />
        ) : null
      })}

      {anchor ? (
        <motion.div
          className="relative z-20 mx-auto mt-16 mb-10 w-[min(56vw,240px)] sm:pointer-events-none sm:absolute sm:left-1/2 sm:top-[6%] sm:mx-0 sm:my-0 sm:w-[min(30vw,290px)] sm:-translate-x-1/2"
          style={{ x: anchorX, y: anchorY }}
          variants={revealVariants(reducedMotion)}
        >
          <div className="pocket-frame pointer-events-auto shadow-[0_30px_70px_var(--shadow)]">
            <Link
              to="/photos/$slug"
              params={{ slug: anchor.slug }}
              aria-label={`View “${anchor.title}”`}
              className="block no-underline"
            >
              <PhotoImage
                publicId={anchor.publicId}
                alt={anchor.alt}
                preset="card"
                sizes="(max-width: 640px) 46vw, 290px"
                priority
                className="h-auto w-full"
              />
              <span aria-hidden="true" className="frame-corners" />
            </Link>
          </div>
          <p className="mono-label pointer-events-auto mt-3 text-center">
            {anchor.title} · Small Wonders
          </p>
        </motion.div>
      ) : null}
    </>
  )
}

export function OpeningHeadline({ onBegin }: { onBegin?: () => void }) {
  const reducedMotion = useReducedMotion()

  return (
    <div className="page-shell pointer-events-none relative z-30">
      <div className="max-w-xl">
        <motion.p className="section-label" variants={revealVariants(reducedMotion)}>
          FrameOS — Pocket Worlds
        </motion.p>
        <motion.h1
          className="display-font mt-4 text-[clamp(2.4rem,6.5vw,4.9rem)] leading-[1.02] font-light text-(--ink)"
          variants={revealVariants(reducedMotion)}
        >
          Things I noticed,
          <br />
          <em className="display-italic font-normal">photographed on a phone.</em>
        </motion.h1>
        <motion.p
          className="mt-5 max-w-xl text-base leading-7 text-(--muted)"
          variants={revealVariants(reducedMotion)}
        >
          {onBegin
            ? 'Each photograph is a small world. The light begins at Wander — follow it.'
            : 'Each photograph is a small world. Five of them are hanging just ahead.'}
        </motion.p>
        <motion.div
          className="pointer-events-auto mt-8 flex flex-wrap items-center gap-4"
          variants={revealVariants(reducedMotion)}
        >
          {onBegin ? (
            <button
              type="button"
              onClick={onBegin}
              className="cursor-pointer rounded-full bg-(--ink) px-6 py-3.5 text-sm font-semibold text-(--bg) hover:-translate-y-0.5"
            >
              Follow the light ↓
            </button>
          ) : (
            <a
              href="#worlds"
              className="rounded-full bg-(--ink) px-6 py-3.5 text-sm font-semibold text-(--bg) no-underline hover:-translate-y-0.5"
            >
              Explore the worlds ↓
            </a>
          )}
          <Link to="/archive" className="px-2 py-2 text-sm font-semibold text-(--muted-strong)">
            Skip to the Index →
          </Link>
        </motion.div>
      </div>
    </div>
  )
}
