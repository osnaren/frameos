import { useRef } from 'react'

import { useGSAP } from '@gsap/react'
import gsap from 'gsap'

/**
 * Subtle 3D tilt toward the pointer, like a print catching the light.
 * Inert on touch/coarse pointers and reduced motion.
 */
export function useTiltHover<T extends HTMLElement>(maxTilt = 7) {
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
      el.style.transitionProperty = 'background-color, color, border-color, opacity'
      gsap.set(el, { transformPerspective: 900, transformOrigin: 'center' })

      const setRotateX = gsap.quickTo(el, 'rotationX', { duration: 0.6, ease: 'power3' })
      const setRotateY = gsap.quickTo(el, 'rotationY', { duration: 0.6, ease: 'power3' })
      const setScaleX = gsap.quickTo(el, 'scaleX', { duration: 0.5, ease: 'power2' })
      const setScaleY = gsap.quickTo(el, 'scaleY', { duration: 0.5, ease: 'power2' })

      const handleMove = (event: PointerEvent) => {
        const rect = el.getBoundingClientRect()
        const px = (event.clientX - rect.left) / rect.width - 0.5
        const py = (event.clientY - rect.top) / rect.height - 0.5
        setRotateY(px * maxTilt * 2)
        setRotateX(py * -maxTilt * 2)
        setScaleX(1.015)
        setScaleY(1.015)
      }

      const handleLeave = () => {
        setRotateX(0)
        setRotateY(0)
        setScaleX(1)
        setScaleY(1)
      }

      el.addEventListener('pointermove', handleMove)
      el.addEventListener('pointerleave', handleLeave)

      return () => {
        el.removeEventListener('pointermove', handleMove)
        el.removeEventListener('pointerleave', handleLeave)
      }
    },
    { scope: ref }
  )

  return ref
}
