import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'

import { Link } from '@tanstack/react-router'

import {
  pocketWorldHero,
  pocketWorldJourney,
  type PocketWorldJourneyScene,
} from '@/content/pocket-worlds-journey'
import {
  isCompletePocketWorldMediaManifest,
  isPocketWorldMediaManifest,
  POCKET_WORLD_MEDIA_MANIFEST_URL,
  type PocketWorldMediaAsset,
  type PocketWorldMediaManifest,
} from '@/lib/pocket-world-media'

type ExperienceMode = 'checking' | 'stills' | 'video'
type CopyPhase = 'hero' | 'world' | 'archive'

interface Segment {
  id: string
  kind: 'scene' | 'connector'
  sceneIndex: number
  targetSceneIndex: number
  weight: number
  linger: number
  desktop?: string
  mobile?: string
  poster: string
  mobilePoster?: string
  still: string
  stillSrcSet?: string
}

interface RuntimeSegment {
  current: number
  target: number
  loading: boolean
  loaded: boolean
  ready: boolean
  visible: boolean
  objectUrl?: string
}

interface NavigatorHints extends Navigator {
  deviceMemory?: number
  connection?: EventTarget & {
    saveData?: boolean
    effectiveType?: string
  }
}

const RESTORE_KEY = 'frameos:pocket-worlds-progress'
const RESTORE_MAX_AGE = 15 * 60 * 1000
const CONNECTOR_WEIGHT = 0.82

function clamp(value: number, min = 0, max = 1) {
  return Math.min(max, Math.max(min, value))
}

function smoothstep(value: number) {
  const x = clamp(value)
  return x * x * (3 - 2 * x)
}

function lingerEase(value: number, linger: number) {
  const x = clamp(value)
  const amount = clamp(linger, 0, 0.6)
  const centered = x - 0.5
  return (1 - amount) * x + amount * (4 * centered * centered * centered + 0.5)
}

function buildStillSegments(): Segment[] {
  return [
    {
      id: 'overview',
      kind: 'scene',
      sceneIndex: 0,
      targetSceneIndex: 0,
      weight: 0.72,
      linger: 0.12,
      poster: pocketWorldHero.fallbackImage,
      still: pocketWorldHero.fallbackImage,
      stillSrcSet: pocketWorldHero.fallbackSrcSet,
    },
    ...pocketWorldJourney.map((scene, sceneIndex) => ({
      id: scene.id,
      kind: 'scene' as const,
      sceneIndex,
      targetSceneIndex: sceneIndex,
      weight: scene.scrollWeight,
      linger: scene.linger,
      poster: scene.fallbackImage,
      still: scene.fallbackImage,
      stillSrcSet: scene.fallbackSrcSet,
    })),
  ]
}

function findAsset(assets: PocketWorldMediaAsset[], id: string) {
  return assets.find((asset) => asset.id === id)
}

function buildVideoSegments(manifest: PocketWorldMediaManifest): Segment[] {
  const segments: Segment[] = []

  pocketWorldJourney.forEach((scene, sceneIndex) => {
    const media = findAsset(manifest.sections, scene.id)
    if (!media) {
      return
    }

    segments.push({
      id: scene.id,
      kind: 'scene',
      sceneIndex: manifest.architecture === 'A' ? Math.max(0, sceneIndex - 1) : sceneIndex,
      targetSceneIndex: sceneIndex,
      weight: scene.scrollWeight,
      linger: scene.linger,
      desktop: media.desktop,
      mobile: media.mobile,
      poster: media.poster,
      mobilePoster: media.mobilePoster,
      still: media.still,
    })

    if (manifest.architecture === 'B' && sceneIndex < pocketWorldJourney.length - 1) {
      const connectorId = `${scene.id}-to-${pocketWorldJourney[sceneIndex + 1].id}`
      const connector = findAsset(manifest.connectors, connectorId)
      if (connector) {
        segments.push({
          id: connector.id,
          kind: 'connector',
          sceneIndex,
          targetSceneIndex: sceneIndex + 1,
          weight: CONNECTOR_WEIGHT,
          linger: 0,
          desktop: connector.desktop,
          mobile: connector.mobile,
          poster: connector.poster,
          mobilePoster: connector.mobilePoster,
          still: connector.still,
        })
      }
    }
  })

  return segments
}

function sceneForSegment(segment: Segment, localProgress: number) {
  if (segment.targetSceneIndex !== segment.sceneIndex && localProgress >= 0.5) {
    return segment.targetSceneIndex
  }
  return segment.sceneIndex
}

export default function PocketWorldsCinematic({ onReady }: { onReady: () => void }) {
  const rootRef = useRef<HTMLElement>(null)
  const layerRefs = useRef(new Map<string, HTMLDivElement>())
  const posterRefs = useRef(new Map<string, HTMLImageElement>())
  const videoRefs = useRef(new Map<string, HTMLVideoElement>())
  const progressRef = useRef<HTMLSpanElement>(null)
  const lightRef = useRef<SVGPathElement>(null)
  const [mode, setMode] = useState<ExperienceMode>('checking')
  const [reason, setReason] = useState('')
  const [manifest, setManifest] = useState<PocketWorldMediaManifest | null>(null)
  const [isPhoneViewport, setIsPhoneViewport] = useState(
    () => window.matchMedia('(max-width: 700px)').matches
  )
  const [activeScene, setActiveScene] = useState(0)
  const [copyPhase, setCopyPhase] = useState<CopyPhase>('hero')
  const [activatedSegments, setActivatedSegments] = useState<ReadonlySet<number>>(
    () => new Set([0, 1, 2])
  )

  const forceStills = useCallback((fallbackReason: string) => {
    setReason(fallbackReason)
    setMode('stills')
  }, [])

  useEffect(() => {
    const phoneQuery = window.matchMedia('(max-width: 700px)')
    const handlePhoneChange = (event: MediaQueryListEvent) => setIsPhoneViewport(event.matches)
    phoneQuery.addEventListener('change', handlePhoneChange)
    return () => phoneQuery.removeEventListener('change', handlePhoneChange)
  }, [])

  useEffect(() => {
    let cancelled = false
    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    const navigatorHints = navigator as NavigatorHints
    const connection = navigatorHints.connection
    const constrainedNetwork =
      connection?.saveData === true ||
      connection?.effectiveType === 'slow-2g' ||
      connection?.effectiveType === '2g'
    const constrainedMemory =
      typeof navigatorHints.deviceMemory === 'number' && navigatorHints.deviceMemory < 3

    async function selectMode() {
      if (motionQuery.matches) {
        if (!cancelled) {
          setReason('reduced-motion')
          setMode('stills')
          onReady()
        }
        return
      }

      if (constrainedNetwork || constrainedMemory) {
        if (!cancelled) {
          setReason(constrainedNetwork ? 'constrained-network' : 'constrained-device')
          setMode('stills')
          onReady()
        }
        return
      }

      try {
        const response = await fetch(POCKET_WORLD_MEDIA_MANIFEST_URL, { cache: 'no-cache' })
        const payload: unknown = response.ok ? await response.json() : null

        if (
          !cancelled &&
          isPocketWorldMediaManifest(payload) &&
          isCompletePocketWorldMediaManifest(payload)
        ) {
          setManifest(payload)
          setReason('')
          setMode('video')
        } else if (!cancelled) {
          setReason('media-pending')
          setMode('stills')
        }
      } catch {
        if (!cancelled) {
          setReason('media-unavailable')
          setMode('stills')
        }
      }

      if (!cancelled) {
        onReady()
      }
    }

    void selectMode()

    const handleMotionChange = (event: MediaQueryListEvent) => {
      if (event.matches) {
        forceStills('reduced-motion')
      }
    }
    motionQuery.addEventListener('change', handleMotionChange)

    return () => {
      cancelled = true
      motionQuery.removeEventListener('change', handleMotionChange)
    }
  }, [forceStills, onReady])

  const segments = useMemo(
    () => (mode === 'video' && manifest ? buildVideoSegments(manifest) : buildStillSegments()),
    [manifest, mode]
  )
  const totalWeight = useMemo(
    () => segments.reduce((sum, segment) => sum + segment.weight, 0),
    [segments]
  )
  const scrollHeight = Math.max(620, Math.round(totalWeight * 100 + 100))

  const bindLayer = useCallback((node: HTMLDivElement | null) => {
    const id = node?.dataset.segmentId
    if (node && id) {
      layerRefs.current.set(id, node)
    }
  }, [])

  const bindPoster = useCallback((node: HTMLImageElement | null) => {
    const id = node?.dataset.segmentId
    if (node && id) {
      posterRefs.current.set(id, node)
    }
  }, [])

  const bindVideo = useCallback((node: HTMLVideoElement | null) => {
    const id = node?.dataset.segmentId
    if (node && id) {
      videoRefs.current.set(id, node)
    }
  }, [])

  const scrollToSegment = useCallback(
    (sceneIndex: number, local = 0.5) => {
      const root = rootRef.current
      if (!root) {
        return
      }

      const targetIndex = Math.max(
        0,
        segments.findIndex((segment) => segment.id === pocketWorldJourney[sceneIndex].id)
      )
      const weightBefore = segments
        .slice(0, targetIndex)
        .reduce((sum, segment) => sum + segment.weight, 0)
      const progress = (weightBefore + segments[targetIndex].weight * local) / totalWeight
      const rootTop = window.scrollY + root.getBoundingClientRect().top
      const distance = Math.max(1, root.offsetHeight - window.innerHeight)
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

      window.scrollTo({
        top: rootTop + distance * progress,
        behavior: reduce ? 'auto' : 'smooth',
      })
    },
    [segments, totalWeight]
  )

  const returnToBeginning = useCallback(() => {
    window.sessionStorage.removeItem(RESTORE_KEY)
    const root = rootRef.current
    if (!root) {
      return
    }

    const rootTop = Math.max(0, window.scrollY + root.getBoundingClientRect().top)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    window.scrollTo({
      top: rootTop,
      behavior: reduce ? 'auto' : 'smooth',
    })
  }, [])

  useEffect(() => {
    if (mode === 'checking') {
      return
    }

    const root = rootRef.current
    if (!root || segments.length === 0) {
      return
    }

    const videoElements = videoRefs.current
    const runtimes = new Map<string, RuntimeSegment>()
    const controllers = new Set<AbortController>()
    const isPhone = isPhoneViewport
    const coarse = window.matchMedia('(hover: none) and (pointer: coarse)').matches
    let layoutWidth = window.innerWidth
    let rootTop = 0
    let scrollDistance = 1
    let readFrame = 0
    let seekFrame = 0
    let latestProgress = 0
    let lastSegment = -1
    let lastScene = -1
    let lastPhase: CopyPhase | null = null
    let disposed = false
    const siteHeader = document.querySelector<HTMLElement>('.site-header')

    segments.forEach((segment) => {
      runtimes.set(segment.id, {
        current: 0,
        target: 0,
        loading: false,
        loaded: false,
        ready: false,
        visible: false,
      })
    })

    function layout() {
      const headerHeight = siteHeader?.offsetHeight ?? 0
      root!.style.marginTop = `${-headerHeight}px`
      root!.style.setProperty('--pw-header-height', `${headerHeight}px`)
      layoutWidth = window.innerWidth
      rootTop = window.scrollY + root!.getBoundingClientRect().top
      scrollDistance = Math.max(1, root!.offsetHeight - window.innerHeight)
    }

    function setActivated(index: number) {
      setActivatedSegments((current) => {
        const next = new Set(current)
        for (let offset = -1; offset <= 2; offset += 1) {
          const candidate = index + offset
          if (candidate >= 0 && candidate < segments.length) {
            next.add(candidate)
          }
        }
        if (next.size === current.size) {
          return current
        }
        return next
      })
    }

    async function loadSegment(index: number) {
      if (mode !== 'video' || index < 0 || index >= segments.length) {
        return
      }

      const segment = segments[index]
      const runtime = runtimes.get(segment.id)
      const video = videoElements.get(segment.id)
      const url = isPhone && segment.mobile ? segment.mobile : segment.desktop
      if (!runtime || !video || !url || runtime.loading || runtime.loaded) {
        return
      }

      runtime.loading = true
      const controller = new AbortController()
      controllers.add(controller)

      try {
        const response = await fetch(url, { signal: controller.signal })
        if (!response.ok) {
          throw new Error(`Unable to load ${segment.id}`)
        }
        const blob = await response.blob()
        if (disposed) {
          return
        }

        const objectUrl = URL.createObjectURL(blob)
        runtime.objectUrl = objectUrl
        runtime.loaded = true
        runtime.loading = false
        video.src = objectUrl
        video.onerror = () => forceStills('media-decode-failed')
        video.onloadedmetadata = () => {
          if (!Number.isFinite(video.duration) || video.duration <= 0) {
            forceStills('media-decode-failed')
            return
          }
          runtime.ready = true
          const initialTime = Math.min(0.001, Math.max(0, video.duration - 0.001))
          try {
            video.currentTime = initialTime
          } catch {
            forceStills('media-seek-failed')
          }
        }
        video.onseeked = () => {
          layerRefs.current.get(segment.id)?.classList.add('is-painted')
        }
        video.load()
      } catch (error) {
        if (!controller.signal.aborted && !disposed) {
          forceStills(error instanceof Error ? 'media-fetch-failed' : 'media-unavailable')
        }
      } finally {
        controllers.delete(controller)
      }
    }

    function read() {
      readFrame = 0
      latestProgress = clamp((window.scrollY - rootTop) / scrollDistance)
      const weightedProgress = latestProgress * totalWeight
      let before = 0
      let currentIndex = segments.length - 1

      for (let index = 0; index < segments.length; index += 1) {
        const end = before + segments[index].weight
        if (weightedProgress < end || index === segments.length - 1) {
          currentIndex = index
          break
        }
        before = end
      }

      const segment = segments[currentIndex]
      const local = clamp((weightedProgress - before) / segment.weight)
      const fade = currentIndex < segments.length - 1 ? smoothstep((local - 0.92) / 0.08) : 0

      segments.forEach((entry, index) => {
        const layer = layerRefs.current.get(entry.id)
        const poster = posterRefs.current.get(entry.id)
        const runtime = runtimes.get(entry.id)
        const entryStart = segments.slice(0, index).reduce((sum, item) => sum + item.weight, 0)
        const entryLocal = clamp((weightedProgress - entryStart) / entry.weight)
        let opacity = 0
        if (index === currentIndex) {
          opacity = 1 - fade
        } else if (index === currentIndex + 1) {
          opacity = fade
        }

        if (layer) {
          layer.style.opacity = String(opacity)
          layer.style.zIndex = String(index === currentIndex + 1 ? 2 : 1)
        }
        if (poster) {
          poster.style.transform = `scale(${(1.025 + entryLocal * 0.055).toFixed(4)})`
        }
        if (runtime) {
          runtime.visible = opacity > 0.001
          runtime.target = entry.linger ? lingerEase(entryLocal, entry.linger) : entryLocal
        }
      })

      const nextScene = sceneForSegment(segment, local)
      const nextPhase: CopyPhase =
        nextScene === 0 && segment.kind === 'scene' && local < 0.38
          ? 'hero'
          : nextScene === pocketWorldJourney.length - 1 && segment.kind === 'scene' && local > 0.68
            ? 'archive'
            : 'world'

      if (currentIndex !== lastSegment) {
        lastSegment = currentIndex
        setActivated(currentIndex)
      }
      if (nextScene !== lastScene) {
        lastScene = nextScene
        setActiveScene(nextScene)
        root!.style.setProperty('--pw-accent', pocketWorldJourney[nextScene].accent)
      }
      if (nextPhase !== lastPhase) {
        lastPhase = nextPhase
        setCopyPhase(nextPhase)
      }

      if (progressRef.current) {
        progressRef.current.style.transform = `scaleY(${latestProgress})`
      }
      if (lightRef.current) {
        lightRef.current.style.strokeDashoffset = String(1 - latestProgress)
      }

      if (mode === 'video') {
        for (let offset = -1; offset <= 2; offset += 1) {
          void loadSegment(currentIndex + offset)
        }
      }
    }

    function requestRead() {
      if (!readFrame) {
        readFrame = window.requestAnimationFrame(read)
      }
    }

    function seek() {
      runtimes.forEach((runtime, id) => {
        const video = videoElements.get(id)
        if (!runtime.ready || !video || video.seeking) {
          return
        }
        if (!runtime.visible && Math.abs(runtime.current - runtime.target) < 0.002) {
          return
        }

        runtime.current += (runtime.target - runtime.current) * (isPhone ? 0.24 : 0.18)
        const duration = video.duration || 1
        const nextTime = clamp(runtime.current, 0, 0.999) * duration
        const threshold = isPhone ? 0.02 : 0.008
        if (Math.abs(video.currentTime - nextTime) > threshold) {
          try {
            video.currentTime = nextTime
          } catch {
            forceStills('media-seek-failed')
          }
        }
      })
      seekFrame = window.requestAnimationFrame(seek)
    }

    async function primeVideos() {
      if (mode !== 'video') {
        return
      }
      const videos = Array.from(videoElements.values()).filter((video) => video.src)
      try {
        await Promise.all(
          videos.map(async (video) => {
            video.muted = true
            await video.play()
            video.pause()
          })
        )
      } catch {
        forceStills('playback-rejected')
      }
    }

    function handleResize() {
      if (coarse && window.innerWidth === layoutWidth) {
        return
      }
      layout()
      requestRead()
    }

    layout()
    read()
    if (mode === 'video') {
      seekFrame = window.requestAnimationFrame(seek)
    }

    try {
      const saved = JSON.parse(window.sessionStorage.getItem(RESTORE_KEY) ?? 'null') as {
        progress?: number
        at?: number
      } | null
      if (
        saved &&
        typeof saved.progress === 'number' &&
        typeof saved.at === 'number' &&
        Date.now() - saved.at < RESTORE_MAX_AGE &&
        saved.progress > 0.02
      ) {
        const restoredProgress = saved.progress
        window.requestAnimationFrame(() => {
          window.scrollTo({
            top: rootTop + scrollDistance * clamp(restoredProgress),
            behavior: 'auto',
          })
        })
      }
    } catch {
      window.sessionStorage.removeItem(RESTORE_KEY)
    }

    window.addEventListener('scroll', requestRead, { passive: true })
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    window.addEventListener('pointerdown', primeVideos, { once: true, passive: true })
    window.addEventListener('touchstart', primeVideos, { once: true, passive: true })

    return () => {
      disposed = true
      window.sessionStorage.setItem(
        RESTORE_KEY,
        JSON.stringify({ progress: latestProgress, at: Date.now() })
      )
      window.removeEventListener('scroll', requestRead)
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('orientationchange', handleResize)
      window.removeEventListener('pointerdown', primeVideos)
      window.removeEventListener('touchstart', primeVideos)
      if (readFrame) {
        window.cancelAnimationFrame(readFrame)
      }
      if (seekFrame) {
        window.cancelAnimationFrame(seekFrame)
      }
      controllers.forEach((controller) => controller.abort())
      runtimes.forEach((runtime, id) => {
        const video = videoElements.get(id)
        if (video) {
          video.onloadedmetadata = null
          video.onerror = null
          video.onseeked = null
          video.removeAttribute('src')
          video.load()
        }
        if (runtime.objectUrl) {
          URL.revokeObjectURL(runtime.objectUrl)
        }
      })
    }
  }, [forceStills, isPhoneViewport, mode, segments, totalWeight])

  const rootStyle = {
    '--pw-height': `${scrollHeight}svh`,
    '--pw-accent': pocketWorldJourney[activeScene].accent,
  } as CSSProperties
  const modeLabel = mode === 'video' ? 'Cinematic journey' : 'Still journey'

  return (
    <section
      ref={rootRef}
      className="pw-cinema"
      data-ready={mode !== 'checking' ? 'true' : 'false'}
      data-mode={mode}
      data-fallback-reason={reason || undefined}
      style={rootStyle}
      aria-label="Pocket Worlds — follow the light"
    >
      <div className="pw-cinema__stage">
        <div className="pw-cinema__media" aria-hidden="true">
          {segments.map((segment, index) => {
            const source =
              mode === 'video'
                ? isPhoneViewport && segment.mobilePoster
                  ? segment.mobilePoster
                  : segment.poster
                : segment.still
            const shouldLoad = activatedSegments.has(index)

            return (
              <div
                key={segment.id}
                ref={bindLayer}
                data-segment-id={segment.id}
                className="pw-cinema__layer"
              >
                <img
                  ref={bindPoster}
                  data-segment-id={segment.id}
                  src={shouldLoad ? source : undefined}
                  srcSet={shouldLoad ? segment.stillSrcSet : undefined}
                  sizes="100vw"
                  alt=""
                  className="pw-cinema__poster"
                  decoding="async"
                />
                {mode === 'video' ? (
                  <video
                    ref={bindVideo}
                    data-segment-id={segment.id}
                    className="pw-cinema__video"
                    muted
                    playsInline
                    preload="none"
                  />
                ) : null}
              </div>
            )
          })}
        </div>

        <div className="pw-cinema__atmosphere" aria-hidden="true" />
        <svg
          className="pw-cinema__light"
          viewBox="0 0 1000 600"
          preserveAspectRatio="none"
          aria-hidden="true"
        >
          <path
            className="pw-cinema__light-bed"
            pathLength="1"
            d="M-80 500 C110 470 150 560 320 474 C470 398 505 505 650 420 C770 350 845 395 1080 252"
          />
          <path
            ref={lightRef}
            className="pw-cinema__light-progress"
            pathLength="1"
            d="M-80 500 C110 470 150 560 320 474 C470 398 505 505 650 420 C770 350 845 395 1080 252"
          />
        </svg>

        <div className="pw-cinema__chrome">
          <span className="pw-cinema__mode">
            <i aria-hidden="true" /> {modeLabel}
          </span>
          <Link to="/archive" className="pw-cinema__index-link">
            Open the Index <span aria-hidden="true">↗</span>
          </Link>
        </div>

        <div className="pw-cinema__copy-region">
          <article
            className={`pw-cinema__copy pw-cinema__copy--hero ${copyPhase === 'hero' ? 'is-active' : ''}`}
            aria-hidden={copyPhase !== 'hero'}
          >
            <p className="pw-cinema__eyebrow">{pocketWorldHero.eyebrow}</p>
            <h1 className="pw-cinema__hero-title">{pocketWorldHero.title}</h1>
            <p className="pw-cinema__body">{pocketWorldHero.body}</p>
            <div className="pw-cinema__actions">
              <button
                type="button"
                className="pw-cinema__button pw-cinema__button--primary"
                onClick={() => scrollToSegment(0, 0.46)}
                tabIndex={copyPhase === 'hero' ? 0 : -1}
              >
                Begin the journey <span aria-hidden="true">↓</span>
              </button>
              <Link
                to="/archive"
                className="pw-cinema__button pw-cinema__button--ghost"
                tabIndex={copyPhase === 'hero' ? 0 : -1}
              >
                Open the Index
              </Link>
            </div>
          </article>

          {pocketWorldJourney.map((scene, index) => {
            const isActive = copyPhase === 'world' && activeScene === index
            return <WorldCopy key={scene.id} scene={scene} index={index} isActive={isActive} />
          })}

          <article
            className={`pw-cinema__copy pw-cinema__copy--archive ${copyPhase === 'archive' ? 'is-active' : ''}`}
            aria-hidden={copyPhase !== 'archive'}
          >
            <p className="pw-cinema__eyebrow">The archive · All five worlds</p>
            <h2 className="pw-cinema__title">Every world, on one sheet.</h2>
            <div className="pw-cinema__actions">
              <Link
                to="/archive"
                className="pw-cinema__button pw-cinema__button--primary"
                tabIndex={copyPhase === 'archive' ? 0 : -1}
              >
                Open the Index
              </Link>
              <Link
                to="/notes"
                className="pw-cinema__button pw-cinema__button--ghost"
                tabIndex={copyPhase === 'archive' ? 0 : -1}
              >
                Read the Field Notes
              </Link>
              <Link
                to="/signal"
                className="pw-cinema__text-link"
                tabIndex={copyPhase === 'archive' ? 0 : -1}
              >
                Send a Signal
              </Link>
              <button
                type="button"
                className="pw-cinema__text-link"
                onClick={returnToBeginning}
                tabIndex={copyPhase === 'archive' ? 0 : -1}
              >
                Return to the beginning ↑
              </button>
            </div>
          </article>
        </div>

        <nav className="pw-cinema__rail" aria-label="Pocket Worlds progress">
          <span className="pw-cinema__rail-line" aria-hidden="true">
            <span ref={progressRef} />
          </span>
          {pocketWorldJourney.map((scene, index) => (
            <button
              key={scene.id}
              type="button"
              className={activeScene === index ? 'is-active' : undefined}
              onClick={() => scrollToSegment(index)}
              aria-label={`Go to ${scene.label}`}
              aria-current={activeScene === index ? 'step' : undefined}
            >
              <i aria-hidden="true" />
              <span>{scene.label}</span>
            </button>
          ))}
        </nav>

        <p className="sr-only" aria-live="polite">
          {pocketWorldJourney[activeScene].label}
        </p>

        <div
          className={`pw-cinema__scroll-hint ${copyPhase === 'hero' ? 'is-visible' : ''}`}
          aria-hidden="true"
        >
          <span>Scroll to follow the light</span>
          <i />
        </div>
      </div>
    </section>
  )
}

function WorldCopy({
  scene,
  index,
  isActive,
}: {
  scene: PocketWorldJourneyScene
  index: number
  isActive: boolean
}) {
  return (
    <article
      className={`pw-cinema__copy pw-cinema__copy--${scene.copySide} ${isActive ? 'is-active' : ''}`}
      style={{ '--pw-scene-accent': scene.accent } as CSSProperties}
      aria-hidden={!isActive}
    >
      <p className="pw-cinema__eyebrow">
        {String(index + 1).padStart(2, '0')} / {String(pocketWorldJourney.length).padStart(2, '0')}
        <span>{scene.eyebrow}</span>
      </p>
      <h2 className="pw-cinema__title">{scene.title}</h2>
      <p className="pw-cinema__body">{scene.body}</p>
      <Link
        to="/worlds/$world"
        params={{ world: scene.worldSlug }}
        className="pw-cinema__button pw-cinema__button--primary"
        tabIndex={isActive ? 0 : -1}
      >
        {scene.action} <span aria-hidden="true">↗</span>
      </Link>
    </article>
  )
}
