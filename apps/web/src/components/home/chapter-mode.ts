import { useSyncExternalStore } from 'react'

import { supportsWebGL } from './planet/planet-renderer'

/**
 * How a world chapter is drawn — see WorldChapter:
 *   gl     · the planet unrolls frame by frame (WebGL)
 *   css    · no WebGL: a still planet hands over through an opening iris
 *   static · reduced motion or no JavaScript; also the server render
 */
export type ChapterMode = 'static' | 'css' | 'gl'

const REDUCED_MOTION_QUERY = '(prefers-reduced-motion: reduce)'

let webgl: boolean | undefined

/** Probed once: creating contexts to ask the question is not free. */
function hasWebGL() {
  webgl ??= supportsWebGL()
  return webgl
}

/** Picks how chapters are drawn on this device. Server: 'static'. */
export function resolveChapterMode(reducedMotion: boolean): ChapterMode {
  if (typeof window === 'undefined' || reducedMotion) {
    return 'static'
  }
  return hasWebGL() ? 'gl' : 'css'
}

function subscribe(onChange: () => void) {
  const media = window.matchMedia(REDUCED_MOTION_QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

function getSnapshot(): ChapterMode {
  return resolveChapterMode(window.matchMedia(REDUCED_MOTION_QUERY).matches)
}

function getServerSnapshot(): ChapterMode {
  return 'static'
}

/**
 * The chapter mode, decided before the page is laid out wherever possible.
 *
 * The scroll layout is much taller than the static one, so the mode must not
 * arrive late: a restored scroll position (back from a photo) or a deep link
 * would land in the wrong place. A client-side navigation renders the final
 * mode on its first render; a server-rendered page hydrates as 'static' and
 * switches before the browser paints.
 */
export function useChapterMode() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)
}
