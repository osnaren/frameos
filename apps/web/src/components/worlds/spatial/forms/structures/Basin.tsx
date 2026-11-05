import { useEffect, useMemo, useRef, useState } from 'react'

import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'

import { getLocalVariantUrl } from '@/lib/local-photos'

import { useWorldScene } from '../../kit/context'

/**
 * How every world's photograph enters its model.
 *
 * Not hung on a frame — lying in a still basin at the destination, mirrored,
 * rippled and half dissolved into the water's own tone. It is the same idea
 * in each world, so the visitor learns it once: arrive, and the picture is
 * there in the water.
 *
 * Take the photograph away and nothing about the model changes. The basin
 * simply holds water.
 */

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uPhoto;
  uniform float uHasPhoto;
  uniform float uTime;
  uniform float uReveal;
  uniform vec3 uWater;
  varying vec2 vUv;

  void main() {
    vec2 centred = vUv - 0.5;
    float radius = length(centred);
    if (radius > 0.5) discard;

    /* the surface is still, but never perfectly still */
    vec2 ripple = vec2(
      sin(vUv.y * 26.0 + uTime * 0.5) * 0.008,
      cos(vUv.x * 21.0 - uTime * 0.42) * 0.007
    );

    vec3 color = uWater;

    if (uHasPhoto > 0.5) {
      vec2 uv = vec2(vUv.x, 1.0 - vUv.y) * 0.78 + 0.11 + ripple;
      color = mix(uWater, texture2D(uPhoto, uv).rgb, 0.62 * uReveal);
    }

    /* The rim catches the light, the centre stays deep. Kept well under the
       bloom threshold: a basin this small blows out into a white blob if it
       is allowed to reach full white. */
    color *= mix(0.86, 0.66, smoothstep(0.12, 0.5, radius));
    color += vec3(1.0) * smoothstep(0.46, 0.5, radius) * 0.12;

    gl_FragColor = vec4(color, 0.94 * smoothstep(0.5, 0.45, radius));
  }
`

export function Basin({
  position,
  radius = 0.35,
  arrival,
  hovered,
}: {
  position: [number, number, number]
  radius?: number
  arrival: number
  hovered: boolean
}) {
  const { palette, heroPhotoId } = useWorldScene()
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const [photo, setPhoto] = useState<THREE.Texture | null>(null)

  /* Loaded at a small variant and only ever used as a texture inside the
     basin. If it fails, the basin keeps its own colour and nothing else in
     the scene changes. */
  useEffect(() => {
    const url = heroPhotoId ? getLocalVariantUrl(heroPhotoId, 480) : null
    if (!url) {
      return
    }

    let cancelled = false
    let loaded: THREE.Texture | null = null

    new THREE.TextureLoader().load(
      url,
      (texture) => {
        if (cancelled) {
          texture.dispose()
          return
        }
        texture.colorSpace = THREE.SRGBColorSpace
        texture.wrapS = THREE.ClampToEdgeWrapping
        texture.wrapT = THREE.ClampToEdgeWrapping
        loaded = texture
        setPhoto(texture)
      },
      undefined,
      () => undefined
    )

    return () => {
      cancelled = true
      loaded?.dispose()
    }
  }, [heroPhotoId])

  const uniforms = useMemo(
    () => ({
      uPhoto: { value: null as THREE.Texture | null },
      uHasPhoto: { value: 0 },
      uTime: { value: 0 },
      uReveal: { value: 0 },
      uWater: { value: palette.baseSurface.clone() },
    }),
    [palette]
  )

  useEffect(() => {
    uniforms.uPhoto.value = photo
    uniforms.uHasPhoto.value = photo ? 1 : 0
  }, [photo, uniforms])

  useFrame((state, delta) => {
    const material = materialRef.current
    if (!material) {
      return
    }
    material.uniforms.uTime.value = state.clock.getElapsedTime()
    const target = arrival * (hovered ? 1 : 0.85)
    material.uniforms.uReveal.value +=
      (target - material.uniforms.uReveal.value) * Math.min(delta * 3, 1)
  })

  return (
    <group position={position}>
      {/* the cut basin the water sits in */}
      <mesh position={[0, -0.04, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[radius * 1.2, radius * 1.26, 0.14, 24]} />
        <meshStandardMaterial color={palette.cut} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.035, 0]} rotation={[-Math.PI / 2, 0, 0]} renderOrder={1}>
        <circleGeometry args={[radius, 28]} />
        <shaderMaterial
          ref={materialRef}
          vertexShader={vertexShader}
          fragmentShader={fragmentShader}
          uniforms={uniforms}
          transparent
        />
      </mesh>
    </group>
  )
}

/** A soft, round falloff — the halo any lit destination throws. */
export function createHaloTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 128
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64)
  gradient.addColorStop(0, 'rgba(255,255,255,0.95)')
  gradient.addColorStop(0.16, 'rgba(255,240,205,0.55)')
  gradient.addColorStop(0.45, 'rgba(255,226,170,0.16)')
  gradient.addColorStop(1, 'rgba(255,220,160,0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, 128, 128)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

/**
 * The invisible, generous hit target every destination needs.
 *
 * The structures themselves are small and fiddly; nobody should have to aim
 * at a lantern. This is what actually receives the pointer.
 */
export function DestinationTarget({
  onHover,
  onSelect,
  radius = 2.2,
  height = 4.2,
}: {
  onHover: (hovered: boolean) => void
  onSelect: () => void
  radius?: number
  height?: number
}) {
  return (
    <mesh
      position={[0, height / 2 - 0.5, 0]}
      onPointerOver={(event: ThreeEvent<PointerEvent>) => {
        event.stopPropagation()
        onHover(true)
      }}
      onPointerOut={() => onHover(false)}
      onClick={(event: ThreeEvent<MouseEvent>) => {
        event.stopPropagation()
        onSelect()
      }}
    >
      <cylinderGeometry args={[radius, radius, height, 12]} />
      <meshBasicMaterial transparent opacity={0} depthWrite={false} />
    </mesh>
  )
}
