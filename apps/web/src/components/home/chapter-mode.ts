import { supportsWebGL } from './planet/planet-renderer'

/**
 * How a world chapter is drawn — see WorldChapter:
 *   gl     · the planet unrolls frame by frame (WebGL)
 *   css    · no WebGL: a still planet hands over through an opening iris
 *   static · reduced motion or no JavaScript; also the server render
 */
export type ChapterMode = 'static' | 'css' | 'gl'

/** Picks how chapters are drawn on this device. Server and first render: 'static'. */
export function resolveChapterMode(reducedMotion: boolean): ChapterMode {
  if (typeof window === 'undefined' || reducedMotion) {
    return 'static'
  }
  return supportsWebGL() ? 'gl' : 'css'
}
