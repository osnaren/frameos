import { createContext, useContext } from 'react'

import { buildWorldPalette, type WorldPalette } from './palette'

/**
 * What a world's canvas knows about itself.
 *
 * Anything inside the canvas — a destination structure, a piece of scenery —
 * reads its colour and its photograph from here rather than importing fixed
 * values, so the same structure can be rendered for any world without props
 * threaded through every mesh.
 */

export interface WorldSceneContext {
  palette: WorldPalette
  /** The world's lead photograph, as a local manifest id. */
  heroPhotoId: string | null
}

const FALLBACK: WorldSceneContext = {
  palette: buildWorldPalette({ wash: '#e3edf1', deep: '#16303c', accent: '#3e7284' }),
  heroPhotoId: null,
}

export const WorldSceneContext = createContext<WorldSceneContext>(FALLBACK)

export function useWorldScene() {
  return useContext(WorldSceneContext)
}

export function useWorldPalette() {
  return useContext(WorldSceneContext).palette
}
