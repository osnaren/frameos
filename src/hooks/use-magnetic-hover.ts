import { useRef } from 'react'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

/**
 * Magnetic hover: the element eases toward the pointer within its own bounds
 * and springs back on leave. Inert on touch/coarse pointers and reduced motion,
 * so it's safe to attach unconditionally to any button-sized element.
 */
export function useMagneticHover<T extends HTMLElement>(strength = 0.4, maxOffset = 16) {
  const ref = useRef<T>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el) {
        return
      }

      if (
        window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
        !window.matchMedia('(pointer: fine)').matches
      ) {
        return
      }

      // The base `a`/`button` rule transitions `transform`, which fights GSAP's
      // own per-frame updates and reads as sluggish. Let GSAP own transform alone.
      el.style.transitionProperty = 'background-color, color, border-color, opacity, box-shadow'

      const setX = gsap.quickTo(el, 'x', { duration: 0.5, ease: 'power3' })
      const setY = gsap.quickTo(el, 'y', { duration: 0.5, ease: 'power3' })
      const setScaleX = gsap.quickTo(el, 'scaleX', { duration: 0.3, ease: 'power2' })
      const setScaleY = gsap.quickTo(el, 'scaleY', { duration: 0.3, ease: 'power2' })
      const setScale = (value: number) => {
        setScaleX(value)
        setScaleY(value)
      }

      const handleMove = (event: PointerEvent) => {
        const rect = el.getBoundingClientRect()
        const rawX = (event.clientX - (rect.left + rect.width / 2)) * strength
        const rawY = (event.clientY - (rect.top + rect.height / 2)) * strength
        setX(gsap.utils.clamp(-maxOffset, maxOffset, rawX))
        setY(gsap.utils.clamp(-maxOffset, maxOffset, rawY))
      }

      const handleLeave = () => {
        setX(0)
        setY(0)
        setScale(1)
      }

      // Press feedback lives here too so it composes with the magnetic
      // translate instead of losing a specificity fight with a CSS class.
      const handleDown = () => setScale(0.96)
      const handleUp = () => setScale(1)

      el.addEventListener('pointermove', handleMove)
      el.addEventListener('pointerleave', handleLeave)
      el.addEventListener('pointerdown', handleDown)
      el.addEventListener('pointerup', handleUp)

      return () => {
        el.removeEventListener('pointermove', handleMove)
        el.removeEventListener('pointerleave', handleLeave)
        el.removeEventListener('pointerdown', handleDown)
        el.removeEventListener('pointerup', handleUp)
      }
    },
    { scope: ref }
  )

  return ref
}
