import { useMotionValue, useReducedMotion, useSpring } from 'framer-motion'
import { useEffect, useMemo } from 'react'

/**
 * Normalized pointer position (-0.5 … 0.5 on both axes) as smoothed motion
 * values, for depth-layer parallax. Inert on coarse pointers and under
 * reduced motion, so consumers can bind transforms unconditionally.
 */
export function usePointerParallax() {
  const reducedMotion = useReducedMotion()
  const pointerX = useMotionValue(0)
  const pointerY = useMotionValue(0)
  const x = useSpring(pointerX, { stiffness: 46, damping: 18, mass: 0.6 })
  const y = useSpring(pointerY, { stiffness: 46, damping: 18, mass: 0.6 })

  useEffect(() => {
    if (reducedMotion || typeof window === 'undefined') {
      return
    }

    if (!window.matchMedia('(pointer: fine)').matches) {
      return
    }

    const handleMove = (event: PointerEvent) => {
      pointerX.set(event.clientX / window.innerWidth - 0.5)
      pointerY.set(event.clientY / window.innerHeight - 0.5)
    }

    window.addEventListener('pointermove', handleMove, { passive: true })
    return () => window.removeEventListener('pointermove', handleMove)
  }, [pointerX, pointerY, reducedMotion])

  return useMemo(() => ({ x, y }), [x, y])
}
