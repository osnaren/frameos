/**
 * Pocket Worlds motion system.
 *
 * One motion vocabulary, drawn from photographic behaviour:
 * - `focusEase` — the settle of a focus pull; used for almost everything
 * - `frameEase` — quicker, for interface chrome
 * - reveals resolve from soft blur to sharp, like an image finding focus
 *
 * Reduced motion is handled at the component level with useReducedMotion;
 * a global CSS fallback also collapses durations.
 */
import type { Transition, Variants } from 'framer-motion'

export const focusEase = [0.16, 1, 0.3, 1] as const
export const frameEase = [0.3, 0.9, 0.4, 1] as const

export const settle: Transition = { duration: 0.7, ease: focusEase }
export const settleSlow: Transition = { duration: 1.1, ease: focusEase }
export const chrome: Transition = { duration: 0.32, ease: frameEase }

/** An element resolving into focus: soft, slightly low, blurred → sharp. */
export const focusIn: Variants = {
  hidden: { opacity: 0, y: 18, filter: 'blur(6px)' },
  visible: {
    opacity: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: settle,
  },
}

/** Container that staggers focusIn children like frames on a contact sheet. */
export const contactSheet: Variants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.07, delayChildren: 0.05 },
  },
}

/** Reduced-motion replacement: plain fade, no movement or blur. */
export const fadeOnly: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } },
}

export function revealVariants(reducedMotion: boolean | null): Variants {
  return reducedMotion ? fadeOnly : focusIn
}
