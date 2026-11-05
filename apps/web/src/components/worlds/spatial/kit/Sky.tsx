import { useEffect, useMemo, useRef } from 'react'

import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { SUN_DIRECTION } from './light'

import type { WorldPalette } from './palette'

/**
 * The sky dome.
 *
 * The camera in these worlds looks down onto the board and rarely shows a
 * horizon, so this is barely a gradient: a pale wash with one soft warm lift
 * where the light comes from. There is no sun disc — a model is lit from a
 * softbox, not from a sky.
 */

const vertexShader = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = normalize(position);
    /* the dome travels with the camera, so it can never be reached */
    vec4 world = modelMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uZenith;
  uniform vec3 uHorizon;
  uniform vec3 uSunGlow;
  uniform vec3 uSun;
  uniform float uDusk;
  varying vec3 vDirection;

  void main() {
    vec3 dir = normalize(vDirection);
    float h = clamp(dir.y, -1.0, 1.0);
    vec3 color = mix(uHorizon, uZenith, pow(clamp(h * 1.05 + 0.08, 0.0, 1.0), 0.78));

    /* a touch of extra warmth in the last few degrees above the base */
    color = mix(color, uHorizon, smoothstep(0.2, -0.04, h) * 0.85);

    /* one broad, very soft lift where the light comes from */
    color += uSunGlow * pow(max(dot(dir, normalize(uSun)), 0.0), 3.0) * 0.16;

    color = mix(color, uHorizon, smoothstep(0.0, -0.25, h));
    gl_FragColor = vec4(mix(color, color * 0.42, uDusk), 1.0);
  }
`

export function Sky({ palette, dusk }: { palette: WorldPalette; dusk: number }) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  const uniforms = useMemo(
    () => ({
      uZenith: { value: palette.skyZenith.clone() },
      uHorizon: { value: palette.skyHorizon.clone() },
      uSunGlow: { value: palette.sunGlow.clone() },
      uSun: { value: SUN_DIRECTION.clone() },
      uDusk: { value: 0 },
    }),
    [palette]
  )

  const geometry = useMemo(() => new THREE.SphereGeometry(1, 32, 20), [])
  useEffect(() => () => geometry.dispose(), [geometry])

  useFrame((state, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uDusk.value +=
        (dusk - materialRef.current.uniforms.uDusk.value) * Math.min(delta * 2.5, 1)
    }
    /* keep the dome centred on the camera so it stays infinitely far away */
    meshRef.current?.position.copy(state.camera.position)
  })

  return (
    <mesh ref={meshRef} geometry={geometry} scale={320} frustumCulled={false} renderOrder={-1}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
        side={THREE.BackSide}
        depthWrite={false}
        fog={false}
      />
    </mesh>
  )
}
