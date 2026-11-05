import { useEffect, useRef, useState, type CSSProperties } from 'react'

import { Link } from '@tanstack/react-router'

import { PhotoImage } from '@/components/photo/PhotoImage'

import { photoTextureUrl } from './planet/photo-source'
import { CHAPTER_PHASES, chapterUnfold } from './planet/planet-math'
import { PlanetRenderer, loadPlanetImage } from './planet/planet-renderer'
import { PlanetStill } from './planet/PlanetStill'

import type { ChapterMode } from './chapter-mode'
import type { WorldOverview } from '@/lib/world-overview'

/**
 * One world, told in a single gesture: its pocket planet unrolls into the
 * photograph it was curled from, then that photograph opens onto the rest of
 * the world.
 *
 * Three ways to draw it, chosen after mount:
 *   - `gl`     the planet is unrolled frame by frame by the WebGL shader;
 *   - `css`    no WebGL: a still planet hands over to the photo through an
 *              opening iris (clip-path);
 *   - `static` reduced motion or no JavaScript: a calm editorial layout with
 *              the planet beside the copy and the photograph below. This is
 *              what the server renders.
 */

interface Geometry {
  width: number
  height: number
  centerX: number
  centerY: number
  radius: number
}

function stageGeometry(width: number, height: number): Geometry {
  if (width >= 900) {
    const radius = Math.min(height * 0.3, width * 0.22)
    return { width, height, centerX: width * 0.64, centerY: height * 0.53, radius }
  }
  const radius = Math.min(width * 0.36, height * 0.22)
  return { width, height, centerX: width * 0.5, centerY: height * 0.38, radius }
}

/* one texture per chapter, shared by the WebGL unfold and the still planet */
const STAGE_TEXTURE_WIDTH = 1600

const SPIN_RATE = 0.06 /* radians per second, at rest on the planet */

export function WorldChapter({
  overview,
  index,
  total,
  mode,
  active,
}: {
  overview: WorldOverview
  index: number
  total: number
  mode: ChapterMode
  /** Whether this chapter is the one the rail should mark. Reported upward. */
  active?: boolean
}) {
  const { world, planet, photos, photoCount } = overview
  /* the frame this chapter is about: curled into the planet, unrolled into the stage */
  const stage = planet.photo
  const sectionRef = useRef<HTMLElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [glMode, setGlMode] = useState<'pending' | 'ready' | 'failed'>('pending')

  const effectiveMode: ChapterMode = mode === 'gl' && glMode === 'failed' ? 'css' : mode

  /* scroll → progress → unfold; GL drawing when available */
  useEffect(() => {
    const section = sectionRef.current
    if (!section || effectiveMode === 'static') {
      return
    }

    let renderer: PlanetRenderer | null = null
    let geometry = stageGeometry(window.innerWidth, window.innerHeight)
    let frame = 0
    let near = false
    let lastProgress = -1
    let lastDraw = 0
    let spin = 0
    let disposed = false

    const canvas = canvasRef.current
    const wantsGl = effectiveMode === 'gl' && canvas

    const progressOf = () => {
      const rect = section.getBoundingClientRect()
      const travel = rect.height - window.innerHeight
      return travel <= 0 ? 0 : Math.min(1, Math.max(0, -rect.top / travel))
    }

    const draw = (now: number) => {
      frame = 0
      if (!near || disposed) {
        return
      }
      const progress = progressOf()
      const t = chapterUnfold(progress)
      const dt = lastDraw ? Math.min(0.1, (now - lastDraw) / 1000) : 0
      lastDraw = now
      const spinning = t > 0.55
      if (spinning) {
        spin += dt * SPIN_RATE
      }

      if (progress !== lastProgress) {
        section.style.setProperty('--p', progress.toFixed(4))
        section.style.setProperty('--t', t.toFixed(4))
        section.dataset.phase = t >= 0.999 ? 'planet' : t <= 0.001 ? 'photo' : 'unfolding'
        lastProgress = progress
      }

      if (renderer?.hasImage && canvas) {
        renderer.render({
          t,
          centerX: geometry.centerX,
          centerY: geometry.centerY,
          radius: geometry.radius,
          horizon: planet.horizon,
          spin,
          focusX: stage.image?.hotspot?.x,
          focusY: stage.image?.hotspot?.y,
          glow: world.mood.wash,
        })
      }

      /* keep turning while the planet is on screen; otherwise draw on scroll only */
      if (spinning && renderer?.hasImage) {
        frame = requestAnimationFrame(draw)
      }
    }

    const schedule = () => {
      if (!frame && near) {
        frame = requestAnimationFrame(draw)
      }
    }

    const resize = () => {
      geometry = stageGeometry(window.innerWidth, window.innerHeight)
      section.style.setProperty('--planet-x', `${geometry.centerX}px`)
      section.style.setProperty('--planet-y', `${geometry.centerY}px`)
      section.style.setProperty('--planet-r', `${geometry.radius}px`)
      if (renderer && canvas) {
        renderer.resize(canvas.clientWidth, canvas.clientHeight, 1.75)
      }
      lastProgress = -1
      schedule()
    }

    const startGl = () => {
      if (!wantsGl || renderer || disposed) {
        return
      }
      try {
        renderer = new PlanetRenderer(canvas)
      } catch {
        setGlMode('failed')
        return
      }
      renderer.resize(canvas.clientWidth, canvas.clientHeight, 1.75)
      loadPlanetImage(photoTextureUrl(stage, STAGE_TEXTURE_WIDTH))
        .then((image) => {
          if (disposed || !renderer) {
            return
          }
          renderer.setImage(image)
          setGlMode('ready')
          lastProgress = -1
          schedule()
        })
        .catch(() => setGlMode('failed'))
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        near = entry.isIntersecting
        if (near) {
          startGl()
          lastProgress = -1
          schedule()
        }
      },
      { rootMargin: '100% 0px' }
    )
    observer.observe(section)

    window.addEventListener('scroll', schedule, { passive: true })
    window.addEventListener('resize', resize)
    resize()

    return () => {
      disposed = true
      cancelAnimationFrame(frame)
      observer.disconnect()
      window.removeEventListener('scroll', schedule)
      window.removeEventListener('resize', resize)
      renderer?.dispose()
      renderer = null
    }
  }, [effectiveMode, stage, planet.horizon, world.mood.wash])

  const number = String(index + 1).padStart(2, '0')
  const extra = Math.max(0, photoCount - photos.length)
  const style = {
    '--world-wash': world.mood.wash,
    '--world-deep': world.mood.deep,
    '--world-accent': world.mood.accent,
    '--hold': CHAPTER_PHASES.holdPlanetUntil,
    '--flat': CHAPTER_PHASES.flatFrom,
  } as CSSProperties

  return (
    <section
      ref={sectionRef}
      id={`world-${world.slug}`}
      className="chapter"
      data-mode={effectiveMode}
      data-gl={glMode}
      data-active={active ? 'true' : undefined}
      style={style}
      aria-labelledby={`chapter-${world.slug}-title`}
    >
      <div className="chapter__stage">
        <div className="chapter__photo">
          <PhotoImage
            publicId={stage.publicId}
            alt={stage.alt}
            preset="detail"
            sizes="100vw"
            intrinsicWidth={stage.metadata.width}
            intrinsicHeight={stage.metadata.height}
            lqip={stage.image?.lqip}
            hotspot={stage.image?.hotspot}
            className="chapter__photo-image"
          />
          <span className="chapter__scrim" aria-hidden="true" />
        </div>

        {effectiveMode === 'gl' ? (
          <canvas ref={canvasRef} className="chapter__canvas" aria-hidden="true" />
        ) : null}

        <div className="chapter__planet" aria-hidden="true">
          {/* the still planet covers css mode, and gl mode until its texture is in */}
          {effectiveMode !== 'gl' || glMode !== 'ready' ? (
            <PlanetStill
              photo={stage}
              horizon={planet.horizon}
              glow={world.mood.wash}
              cssSize={720}
              textureWidth={STAGE_TEXTURE_WIDTH}
              className="chapter__planet-still"
            />
          ) : null}
          <svg className="chapter__bezel" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r="49.5" className="chapter__bezel-ring" />
            <circle cx="50" cy="50" r="47" pathLength="360" className="chapter__bezel-ticks" />
            <circle
              cx="50"
              cy="50"
              r="46.2"
              pathLength="360"
              className="chapter__bezel-ticks chapter__bezel-ticks--major"
            />
          </svg>
        </div>

        <header className="chapter__intro">
          <p className="mono-label chapter__index">
            <span>World {number}</span>
            <span aria-hidden="true" className="chapter__index-rule" />
            <span>{String(total).padStart(2, '0')} worlds</span>
          </p>
          <h2 id={`chapter-${world.slug}-title`} className="display-font chapter__name">
            {world.name}
          </h2>
          <p className="display-italic chapter__line">{world.line}</p>
          <p className="mono-label chapter__count">
            {String(photoCount).padStart(2, '0')} {photoCount === 1 ? 'frame' : 'frames'}
            <span className="chapter__hint">
              <span aria-hidden="true"> · </span>
              Scroll to unfold
            </span>
          </p>
        </header>

        <footer className="chapter__caption">
          <div className="chapter__caption-copy">
            <p className="mono-label chapter__caption-eyebrow">
              {number} · {world.name}
            </p>
            <h3 className="display-font chapter__caption-title">
              <Link
                to="/photos/$slug"
                params={{ slug: stage.slug }}
                className="chapter__caption-link"
              >
                {stage.title}
              </Link>
            </h3>
            {stage.caption ? <p className="chapter__caption-text">{stage.caption}</p> : null}
          </div>

          <div className="chapter__strip">
            <ul className="chapter__strip-list" aria-label={`More from ${world.name}`}>
              {photos.map((photo) => (
                <li key={photo.slug}>
                  <Link
                    to="/photos/$slug"
                    params={{ slug: photo.slug }}
                    className="chapter__thumb"
                    aria-label={photo.title}
                  >
                    <PhotoImage
                      publicId={photo.publicId}
                      alt=""
                      preset="thumb"
                      sizes="72px"
                      lqip={photo.image?.lqip}
                      hotspot={photo.image?.hotspot}
                      className="chapter__thumb-image"
                    />
                  </Link>
                </li>
              ))}
              {extra > 0 ? (
                <li>
                  <Link
                    to="/worlds/$world"
                    params={{ world: world.slug }}
                    className="chapter__thumb chapter__thumb--more"
                  >
                    +{extra}
                  </Link>
                </li>
              ) : null}
            </ul>
            <div className="chapter__actions">
              <Link
                to="/worlds/$world"
                params={{ world: world.slug }}
                className="home-action home-action--solid"
              >
                Enter {world.name} <span aria-hidden="true">→</span>
              </Link>
              <Link
                to="/archive"
                search={{ world: world.slug }}
                className="home-action home-action--glass"
              >
                In the Index
              </Link>
            </div>
          </div>
        </footer>
      </div>
    </section>
  )
}
