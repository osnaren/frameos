import { useEffect, useState } from 'react'

/**
 * Experience tiers, selected from real browser signals rather than screen
 * width alone:
 *
 * - `animated` — the standard DOM experience (framer-motion reveals, view
 *   transitions). This is the SSR default and the floor for every device;
 *   its components handle reduced motion internally. Reduced-motion and
 *   save-data visitors always land here.
 * - `spatial-lite` — the same journey scene with a simplified budget
 *   (smaller textures, capped DPR, fewer atmosphere sprites) for touch and
 *   moderate devices.
 * - `spatial` — the full WebGL journey on capable desktops.
 *
 * The canvas is always an enhancement: if detection fails (or the canvas
 * later errors), the DOM experience is complete on its own.
 */
export type ExperienceTier = 'animated' | 'spatial-lite' | 'spatial'

function supportsWebGL() {
  try {
    const canvas = document.createElement('canvas')
    const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl')
    return Boolean(gl)
  } catch {
    return false
  }
}

export function detectExperienceTier(): ExperienceTier {
  if (typeof window === 'undefined') {
    return 'animated'
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const nav = navigator as Navigator & {
    deviceMemory?: number
    connection?: { saveData?: boolean }
  }
  const saveData = nav.connection?.saveData === true
  const memory = nav.deviceMemory

  if (reducedMotion || saveData || !supportsWebGL()) {
    return 'animated'
  }

  if (typeof memory === 'number' && memory < 3) {
    return 'animated'
  }

  const finePointer = window.matchMedia('(pointer: fine)').matches
  const wideEnough = window.matchMedia('(min-width: 1024px)').matches
  const strongMemory = typeof memory !== 'number' || memory >= 4

  if (finePointer && wideEnough && strongMemory) {
    return 'spatial'
  }

  return 'spatial-lite'
}

/** SSR-safe tier hook: renders `animated` first, upgrades after mount. */
export function useExperienceTier(): ExperienceTier {
  const [tier, setTier] = useState<ExperienceTier>('animated')

  useEffect(() => {
    setTier(detectExperienceTier())
  }, [])

  return tier
}
