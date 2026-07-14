import { useEffect, useMemo, useRef } from 'react'

import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { createGlowTexture } from './textures'

/**
 * The thread of captured light that connects every Pocket World. It follows
 * one continuous curve through the whole archipelago, drawn in behind the
 * camera's progress: the travelled stretch glows fully, the path ahead is a
 * faint promise, and a soft point of light rides the head. A wider additive
 * sheath gives it volume so it reads as light rather than a cable.
 */

const vertex = /* glsl */ `
  varying float vAlong;
  varying vec3 vNormal;
  varying vec3 vViewDir;
  void main() {
    vAlong = uv.x;
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const fragment = /* glsl */ `
  uniform float uTime;
  uniform float uHead;
  uniform vec3 uWarm;
  uniform vec3 uCool;
  varying float vAlong;
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float edge = pow(abs(dot(vNormal, vViewDir)), 1.35);
    float flow = 0.85 + 0.2 * sin(vAlong * 120.0 - uTime * 1.8);
    float lit = 1.0 - smoothstep(uHead, uHead + 0.05, vAlong);
    float promise = 0.14 * (1.0 - smoothstep(uHead + 0.05, uHead + 0.34, vAlong));
    float alpha = edge * flow * max(lit, promise);
    vec3 color = mix(uWarm, uCool, 0.5 + 0.5 * sin(vAlong * 6.0));
    gl_FragColor = vec4(color, alpha);
  }
`

export function LightThread({
  curve,
  head,
  quality,
}: {
  curve: THREE.CatmullRomCurve3
  head: number
  quality: 'full' | 'lite'
}) {
  const coreRef = useRef<THREE.ShaderMaterial>(null)
  const glowRef = useRef<THREE.ShaderMaterial>(null)
  const headRef = useRef<THREE.Sprite>(null)

  const segments = quality === 'full' ? 600 : 340
  const core = useMemo(
    () => new THREE.TubeGeometry(curve, segments, 0.022, 8, false),
    [curve, segments]
  )
  const glow = useMemo(
    () => new THREE.TubeGeometry(curve, segments, 0.07, 8, false),
    [curve, segments]
  )
  const glowTexture = useMemo(() => createGlowTexture(), [])

  useEffect(
    () => () => {
      core.dispose()
      glow.dispose()
      glowTexture.dispose()
    },
    [core, glow, glowTexture]
  )

  const coreUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHead: { value: 0 },
      uWarm: { value: new THREE.Color('#fff0cf') },
      uCool: { value: new THREE.Color('#eaf4ff') },
    }),
    []
  )
  const glowUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uHead: { value: 0 },
      uWarm: { value: new THREE.Color('#ffe6ad') },
      uCool: { value: new THREE.Color('#d9ecff') },
    }),
    []
  )

  useFrame((state) => {
    const time = state.clock.getElapsedTime()
    const h = THREE.MathUtils.clamp(head, 0, 1)
    if (coreRef.current) {
      coreRef.current.uniforms.uTime.value = time
      coreRef.current.uniforms.uHead.value = h
    }
    if (glowRef.current) {
      glowRef.current.uniforms.uTime.value = time
      glowRef.current.uniforms.uHead.value = h
    }
    if (headRef.current) {
      headRef.current.position.copy(curve.getPointAt(Math.min(Math.max(h - 0.004, 0), 0.999)))
      headRef.current.position.y += 0.04
      headRef.current.scale.setScalar(0.16 + 0.02 * Math.sin(time * 2.6))
      headRef.current.material.opacity = 0.85 * (h < 0.995 ? 1 : 0.35)
    }
  })

  return (
    <group>
      <mesh geometry={core}>
        <shaderMaterial
          ref={coreRef}
          vertexShader={vertex}
          fragmentShader={fragment}
          uniforms={coreUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <mesh geometry={glow}>
        <shaderMaterial
          ref={glowRef}
          vertexShader={vertex}
          fragmentShader={fragment}
          uniforms={glowUniforms}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </mesh>
      <sprite ref={headRef}>
        <spriteMaterial
          map={glowTexture}
          color="#fff2cf"
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  )
}
