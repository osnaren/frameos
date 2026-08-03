import { Link } from '@tanstack/react-router'
import { motion, useReducedMotion } from 'framer-motion'

import { PhotoImage } from '@/components/photo/PhotoImage'
import { useTiltHover } from '@/hooks/use-tilt-hover'
import { revealVariants } from '@/lib/motion'

import type { WorldDefinition } from '@/content/worlds'
import type { Photo } from '@/types/photo'

export function WorldPortal({
  world,
  hero,
  count,
  className,
  sizes,
}: {
  world: WorldDefinition
  hero: Photo | undefined
  count: number
  className?: string
  sizes?: string
}) {
  const reducedMotion = useReducedMotion()
  const tiltRef = useTiltHover<HTMLAnchorElement>(6)

  return (
    <motion.div variants={revealVariants(reducedMotion)} className={className}>
      <Link
        ref={tiltRef}
        to="/worlds/$world"
        params={{ world: world.slug }}
        className="pocket-frame group relative block h-full min-h-70 no-underline"
        aria-label={`Enter ${world.name} — ${count} frames`}
      >
        {hero ? (
          <PhotoImage
            publicId={hero.publicId}
            alt={hero.alt}
            preset="card"
            sizes={sizes ?? '(max-width: 768px) 92vw, 40vw'}
            lqip={hero.image?.lqip}
            hotspot={hero.image?.hotspot}
            className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.03]"
          />
        ) : null}
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background: `linear-gradient(200deg, transparent 30%, color-mix(in srgb, ${world.mood.deep} 78%, transparent) 100%)`,
          }}
        />
        <span aria-hidden="true" className="frame-corners" />
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 sm:p-6">
          <span className="flex flex-col">
            <span className="display-font text-3xl font-light text-white sm:text-4xl">
              {world.name}
            </span>
            <span className="display-italic mt-1 text-sm text-white/80">{world.line}</span>
          </span>
          <span className="mono-label shrink-0 text-white/85!">
            {String(count).padStart(2, '0')} frames
          </span>
        </span>
      </Link>
    </motion.div>
  )
}
