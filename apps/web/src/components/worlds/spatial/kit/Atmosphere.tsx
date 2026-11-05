import { useEffect, useMemo, useRef } from 'react'

import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import type { WorldPalette } from './palette'
import type { Quality } from './types'

/**
 * The far weather.
 *
 * These worlds are looked down on, so anything placed in the sky is invisible
 * by construction. What is left is the band at the top of the frame where the
 * base runs out into haze, and that is where these sit: a few very faint
 * banks of cloud, low and far out, drifting slowly across. They are the only
 * thing suggesting weather, so they are kept almost to nothing.
 */

/**
 * A cumulus puff: many overlapping lobes weighted toward a flat base, so it
 * reads as cloud rather than as a grey ellipse.
 */
function createCloudTexture(size: number, seed: number) {
  const canvas = document.createElement('canvas')
  canvas.width = size
  canvas.height = size
  const ctx = canvas.getContext('2d')!
  let state = seed || 1

  const random = () => {
    state = (state * 16807) % 2147483647
    return state / 2147483647
  }

  for (let i = 0; i < 22; i++) {
    const t = random()
    const x = size * (0.14 + t * 0.72)
    const dome = Math.sin(t * Math.PI)
    const y = size * (0.62 - dome * 0.22 * random())
    const radius = size * (0.06 + random() * 0.13 * (0.4 + dome))
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, 'rgba(255,255,255,0.5)')
    gradient.addColorStop(0.45, 'rgba(255,255,255,0.24)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, size, size)
  }

  /* soften and flatten the underside */
  const base = ctx.createLinearGradient(0, size * 0.58, 0, size * 0.9)
  base.addColorStop(0, 'rgba(0,0,0,0)')
  base.addColorStop(1, 'rgba(0,0,0,1)')
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)
  ctx.globalCompositeOperation = 'source-over'

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

interface CloudSeed {
  key: number
  position: [number, number, number]
  scale: number
  drift: number
  opacity: number
  texture: number
}

function buildCloudSeeds(count: number): CloudSeed[] {
  let state = 91
  const random = () => {
    state = (state * 16807) % 2147483647
    return state / 2147483647
  }

  return Array.from({ length: count }, (_, index) => ({
    key: index,
    /* low and far out, so they land in the haze band at the top of frame
       rather than in a sky that is never in shot */
    position: [(random() * 2 - 1) * 170, 6 + random() * 9, -110 - random() * 120] as [
      number,
      number,
      number,
    ],
    scale: 46 + random() * 62,
    drift: 0.22 + random() * 0.4,
    opacity: 0.12 + random() * 0.13,
    texture: index % 3,
  }))
}

export function Atmosphere({
  palette,
  quality,
  dusk,
}: {
  palette: WorldPalette
  quality: Quality
  dusk: number
}) {
  const count = quality === 'full' ? 9 : 5
  const seeds = useMemo(() => buildCloudSeeds(count), [count])
  const textures = useMemo(
    () => [createCloudTexture(256, 7), createCloudTexture(256, 41), createCloudTexture(256, 113)],
    []
  )
  const spriteRefs = useRef<Array<THREE.Sprite | null>>([])

  useEffect(() => () => textures.forEach((texture) => texture.dispose()), [textures])

  useFrame((state, delta) => {
    const time = state.clock.getElapsedTime()
    spriteRefs.current.forEach((sprite, index) => {
      const seed = seeds[index]
      if (!sprite) {
        return
      }
      sprite.position.x += seed.drift * delta
      /* wrap around, so the band never empties */
      if (sprite.position.x > 190) {
        sprite.position.x = -190
      }
      sprite.material.opacity =
        seed.opacity * (0.85 + 0.15 * Math.sin(time * 0.16 + index)) * (1 - dusk * 0.45)
    })
  })

  return (
    <group>
      {seeds.map((seed, index) => (
        <sprite
          key={seed.key}
          position={seed.position}
          scale={[seed.scale, seed.scale * 0.52, 1]}
          ref={(node: THREE.Sprite | null) => {
            spriteRefs.current[index] = node
          }}
        >
          <spriteMaterial
            map={textures[seed.texture]}
            color={palette.lit}
            transparent
            depthWrite={false}
            opacity={seed.opacity}
            fog={false}
          />
        </sprite>
      ))}
    </group>
  )
}
