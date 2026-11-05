import { useEffect, useMemo, useRef } from 'react'

import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { worldRoute } from './route'

import type { WorldPalette } from './palette'
import type { Quality, WorldForm, WorldProgress } from './types'

/**
 * The route of captured light — the one thread that runs through every world.
 *
 * Two ribbons laid on the ground, not a tube in the air: a wide, very soft
 * spill that behaves like light falling on a surface, and a narrow core
 * inside it. The stretch already travelled burns steadily; ahead of the head
 * only a faint promise remains, so the path reads as something being lit
 * rather than something already drawn.
 */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uHead;
  uniform vec3 uCore;
  uniform vec3 uGlow;
  uniform float uSoftness;
  uniform float uStrength;
  varying vec2 vUv;

  void main() {
    /* across the ribbon: 1 in the middle, 0 at the edges */
    float across = 1.0 - abs(vUv.y * 2.0 - 1.0);
    float band = pow(smoothstep(0.0, 1.0, across), uSoftness);

    /* the lit stretch, with a bright shoulder right at the head */
    float lit = 1.0 - smoothstep(uHead - 0.015, uHead + 0.035, vUv.x);
    float shoulder = smoothstep(uHead - 0.09, uHead - 0.01, vUv.x) * lit;

    /* What is still to come. It runs the whole way to the destination — this
       is the thread the eye follows before the journey has started — but it
       stays faint, and brightens as the head approaches. */
    float ahead = (1.0 - lit) * (0.30 + 0.42 * (1.0 - smoothstep(uHead, uHead + 0.4, vUv.x)));
    ahead *= 0.34 + 0.09 * sin(uTime * 0.9 - vUv.x * 5.0);

    float flow = 0.86 + 0.14 * sin(vUv.x * 46.0 - uTime * 2.1);

    float intensity = (lit * flow + shoulder * 0.8 + ahead) * band * uStrength;
    vec3 color = mix(uGlow, uCore, clamp(lit * flow + shoulder, 0.0, 1.0));

    gl_FragColor = vec4(color, clamp(intensity, 0.0, 1.0));
  }
`

function createHeadTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.18, 'rgba(255,246,220,0.72)')
  gradient.addColorStop(0.5, 'rgba(255,232,180,0.18)')
  gradient.addColorStop(1, 'rgba(255,225,160,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

export function LightRoute({
  form,
  palette,
  progress,
  quality,
}: {
  form: WorldForm
  palette: WorldPalette
  progress: WorldProgress
  quality: Quality
}) {
  const coreRef = useRef<THREE.ShaderMaterial>(null)
  const spillRef = useRef<THREE.ShaderMaterial>(null)
  const headRef = useRef<THREE.Sprite>(null)

  const route = useMemo(() => worldRoute(form), [form])
  const segments = quality === 'full' ? 420 : 240
  const core = useMemo(() => route.ribbon(segments, 0.17), [route, segments])
  const spill = useMemo(() => route.ribbon(segments, 0.55), [route, segments])
  const headTexture = useMemo(() => createHeadTexture(), [])

  const coreUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHead: { value: 0 },
      uCore: { value: palette.routeCore.clone() },
      uGlow: { value: palette.routeGlow.clone() },
      uSoftness: { value: 1.1 },
      uStrength: { value: 0.58 },
    }),
    [palette]
  )

  const spillUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHead: { value: 0 },
      uCore: { value: palette.routeGlow.clone() },
      uGlow: { value: palette.routeGlow.clone() },
      uSoftness: { value: 3.2 },
      uStrength: { value: 0.18 },
    }),
    [palette]
  )

  useEffect(
    () => () => {
      core.dispose()
      spill.dispose()
      headTexture.dispose()
    },
    [core, spill, headTexture]
  )

  const headPosition = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    const head = THREE.MathUtils.clamp(progress.routeHead, 0, 1)

    if (coreRef.current) {
      coreRef.current.uniforms.uTime.value = time
      coreRef.current.uniforms.uHead.value = head
    }
    if (spillRef.current) {
      spillRef.current.uniforms.uTime.value = time
      spillRef.current.uniforms.uHead.value = head
    }
    if (headRef.current) {
      route.pointAt(head, headPosition)
      headRef.current.position.set(headPosition.x, headPosition.y + 0.16, headPosition.z)
      const pulse = 0.9 + 0.1 * Math.sin(time * 2.4)
      /* the point of light fades out once it has reached the destination */
      const arriving = 1 - THREE.MathUtils.smoothstep(head, 0.94, 1)
      headRef.current.scale.setScalar((2.0 + 1.1 * progress.arrival) * pulse)
      headRef.current.material.opacity = 0.85 * arriving
      headRef.current.visible = arriving > 0.01
    }
  })

  return (
    <group>
      <mesh geometry={spill} renderOrder={2}>
        <shaderMaterial
          ref={spillRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={spillUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          polygonOffset
          polygonOffsetFactor={-4}
        />
      </mesh>
      <mesh geometry={core} renderOrder={3}>
        <shaderMaterial
          ref={coreRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={coreUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          polygonOffset
          polygonOffsetFactor={-6}
        />
      </mesh>
      <sprite ref={headRef} renderOrder={4}>
        <spriteMaterial
          map={headTexture}
          transparent
          depthWrite={false}
          depthTest={false}
          blending={THREE.AdditiveBlending}
          opacity={0.85}
          fog={false}
        />
      </sprite>
    </group>
  )
}
