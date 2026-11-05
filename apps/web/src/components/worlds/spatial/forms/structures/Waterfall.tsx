import { useEffect, useMemo, useRef } from 'react'

import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { useWorldPalette } from '../../kit/context'

import type { Quality } from '../../kit/types'

/**
 * Coast's one piece of moving water.
 *
 * The heightfield already carves a notch through the plateau's lip; this
 * hangs a sheet in it. In a model, water is cast resin rather than foam — so
 * the sheet is even and translucent, and only the lip and the plunge go
 * opaque.
 */

/** Where the sheet hangs, in the coast form's coordinates. */
const LIP = { x: 2.15, z: -16.8, top: 4.2 }

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform vec3 uWater;
  uniform vec3 uFoam;
  varying vec2 vUv;

  void main() {
    float fall = 1.0 - vUv.y;

    /* strands, each a little out of phase across the width */
    float lane = floor(vUv.x * 7.0);
    float strand = fract(vUv.y * 2.1 - uTime * 0.55 + lane * 0.19);
    float streak = smoothstep(0.0, 0.25, strand) * smoothstep(0.75, 0.35, strand);

    float widen = mix(1.0, 0.62, fall);
    float body = smoothstep(0.0, 0.5 * widen, min(vUv.x, 1.0 - vUv.x) / widen);
    float spread = smoothstep(0.02, 0.16, vUv.x) * smoothstep(0.98, 0.84, vUv.x);

    float crest = smoothstep(0.86, 1.0, vUv.y);
    float plunge = smoothstep(0.16, 0.0, vUv.y);

    vec3 color = mix(uWater, uFoam, clamp(streak * 0.45 + crest + plunge, 0.0, 1.0));
    float alpha = spread * body * (0.5 + streak * 0.22 + crest * 0.28 + plunge * 0.4);
    alpha *= smoothstep(0.0, 0.06, vUv.y);

    gl_FragColor = vec4(color, alpha);
  }
`

/** A soft, irregular puff — the mist at the plunge. */
function createMistTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  let state = 11

  const random = () => {
    state = (state * 16807) % 2147483647
    return state / 2147483647
  }

  for (let i = 0; i < 9; i++) {
    const x = 128 * (0.3 + random() * 0.4)
    const y = 128 * (0.34 + random() * 0.34)
    const radius = 128 * (0.1 + random() * 0.18)
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, 'rgba(255,255,255,0.3)')
    gradient.addColorStop(0.5, 'rgba(255,255,255,0.12)')
    gradient.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = gradient
    ctx.fillRect(0, 0, 128, 128)
  }

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function Waterfall({ quality }: { quality: Quality }) {
  const palette = useWorldPalette()
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const mistRef = useRef<THREE.Group>(null)
  const height = LIP.top

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uWater: { value: palette.baseShallow.clone() },
      uFoam: { value: palette.lit.clone() },
    }),
    [palette]
  )

  /* a shallow bow, so the sheet is not a flat card */
  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(1.9, height, 6, 18)
    const positions = plane.attributes.position as THREE.BufferAttribute
    for (let i = 0; i < positions.count; i++) {
      const u = positions.getX(i) / 1.9
      const v = (positions.getY(i) + height / 2) / height
      positions.setZ(i, -0.22 * (1 - u * u * 4) * (1 - v) * 0.8)
    }
    plane.computeVertexNormals()
    return plane
  }, [height])

  const mistTexture = useMemo(() => createMistTexture(), [])

  useEffect(
    () => () => {
      geometry.dispose()
      mistTexture.dispose()
    },
    [geometry, mistTexture]
  )

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = time
    }
    mistRef.current?.children.forEach((child, index) => {
      const sprite = child as THREE.Sprite
      sprite.position.y = index * 0.34 + 0.28 * Math.sin(time * 0.42 + index * 1.7)
      sprite.material.opacity = 0.28 + 0.1 * Math.sin(time * 0.55 + index * 2.4)
    })
  })

  return (
    <group>
      <mesh
        geometry={geometry}
        position={[LIP.x, height / 2 + 0.05, LIP.z]}
        rotation={[0, -0.55, 0]}
      >
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
          depthWrite={false}
          side={THREE.DoubleSide}
        />
      </mesh>

      {/* foam where the water lands */}
      <mesh position={[LIP.x + 0.3, 0.06, LIP.z + 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.5, 24]} />
        <meshBasicMaterial color={palette.lit} transparent opacity={0.3} depthWrite={false} />
      </mesh>

      {quality === 'full' ? (
        <group ref={mistRef} position={[LIP.x + 0.25, 0.5, LIP.z + 0.55]}>
          {[0, 1, 2, 3].map((index) => (
            <sprite
              key={index}
              position={[(index % 2 ? 1 : -1) * (0.3 + index * 0.16), 0, 0]}
              scale={1.5 + index * 0.5}
            >
              <spriteMaterial
                map={mistTexture}
                color="#ffffff"
                transparent
                depthWrite={false}
                opacity={0.3}
              />
            </sprite>
          ))}
        </group>
      ) : null}
    </group>
  )
}
