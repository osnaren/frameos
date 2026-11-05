import { useEffect, useMemo, useRef } from 'react'

import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

import { buildHeightTexture } from './contour'
import { SUN_DIRECTION } from './light'

import type { WorldPalette } from './palette'
import type { Quality, WorldForm } from './types'

/**
 * The surface the model is set on.
 *
 * On a coastal form it reads as poured water; on a dry form as the board
 * itself. Either way it is a flat plane, not a simulation — what gives it
 * life is that it is *scored with contours*, read from the baked heightfield
 * so the lines follow the real ground and the edge sits exactly where the
 * land crosses zero.
 *
 * Those lines are why this shader is careful. A contour is `fract()` of a
 * value that changes fast across the screen, which is a textbook aliasing
 * generator: drawn naively the lines crawl and moire as the camera moves. So
 * every line is measured in *screen* space with `fwidth` — one pixel wide
 * however far away it is, and faded out entirely once the bands pack closer
 * together than a pixel, rather than degenerating into interference.
 */

const vertexShader = /* glsl */ `
  varying vec3 vWorld;
  void main() {
    vec4 world = modelMatrix * vec4(position, 1.0);
    vWorld = world.xyz;
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uHeight;
  uniform float uSpan;
  uniform float uTime;
  uniform float uStep;
  uniform float uWet;
  uniform vec3 uSurface;
  uniform vec3 uShallow;
  uniform vec3 uLine;
  uniform vec3 uEdge;
  uniform vec3 uHaze;
  uniform vec3 uSun;
  uniform vec3 uCamera;
  uniform float uDusk;
  uniform float uFogNear;
  uniform float uFogFar;
  varying vec3 vWorld;

  /*
   * Ground height at a world position.
   *
   * Beyond the baked area the surface simply keeps falling away. Returning a
   * fixed depth here instead leaves a visible square seam where the texture
   * stops — exactly the kind of edge that gives a generated scene away.
   */
  float groundAt(vec2 p) {
    vec2 uv = clamp(p / uSpan + 0.5, 0.0, 1.0);
    float h = texture2D(uHeight, uv).r;
    float beyond = length(max(abs(p) - uSpan * 0.5, vec2(0.0)));
    return h - beyond * 0.4;
  }

  /*
   * One survey line per uStep of depth, anti-aliased in screen space.
   *
   * fwidth gives how much the band coordinate changes across one pixel, so
   * the line holds a constant apparent thickness at any distance and is
   * dropped where the bands would be sub-pixel.
   */
  float contourLine(float value) {
    float width = fwidth(value);
    float distanceToLine = abs(fract(value) - 0.5) * 2.0;
    float thickness = clamp(width * 2.4, 0.03, 0.85);
    float line = smoothstep(1.0 - thickness, 1.0 - thickness * 0.25, distanceToLine);
    return line * (1.0 - smoothstep(0.22, 0.6, width));
  }

  void main() {
    float depth = max(-groundAt(vWorld.xz), 0.0);
    float toCamera = length(uCamera - vWorld);

    vec3 color = mix(uShallow, uSurface, smoothstep(0.0, 9.0, depth));

    /* survey lines, on twice the land's contour interval */
    color = mix(color, uLine, contourLine(depth / (uStep * 2.0)) * 0.34);

    /* the margin: ground showing through, breathing slowly on a wet base */
    float breath = 0.2 + 0.06 * sin(uTime * 0.35 + vWorld.z * 0.07) * uWet;
    color = mix(color, uEdge, (1.0 - smoothstep(0.0, breath + 0.28, depth)) * 0.45);
    /* one soft lace right at the edge, well short of white so it cannot bloom */
    float lace = 1.0 - smoothstep(0.0, 0.09, depth);
    color = mix(color, mix(uEdge, vec3(1.0), 0.7), lace * 0.5 * uWet);

    /* one wide, lazy sheen — only a wet surface has one */
    vec3 view = normalize(uCamera - vWorld);
    float sheen = pow(max(dot(reflect(-view, vec3(0.0, 1.0, 0.0)), normalize(uSun)), 0.0), 20.0);
    color += vec3(1.0, 0.98, 0.94) * sheen * 0.12 * uWet;

    color = mix(color, uHaze, smoothstep(uFogNear, uFogFar, toCamera));

    gl_FragColor = vec4(mix(color, color * 0.36, uDusk), 1.0);
  }
`

export function Base({
  form,
  palette,
  quality,
  dusk,
}: {
  form: WorldForm
  palette: WorldPalette
  quality: Quality
  dusk: number
}) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  /* The contours are derived from this, so its resolution sets how smooth
     they are. Under-sample it and the lines show the texture's own quads. */
  const heightTexture = useMemo(
    () => buildHeightTexture(form, quality === 'full' ? 512 : 256),
    [form, quality]
  )

  const uniforms = useMemo(
    () => ({
      uHeight: { value: heightTexture },
      uSpan: { value: form.board.span },
      uTime: { value: 0 },
      uStep: { value: form.board.contourStep },
      uWet: { value: form.base === 'water' ? 1 : 0 },
      uSurface: { value: palette.baseSurface.clone() },
      uShallow: { value: palette.baseShallow.clone() },
      uLine: { value: palette.baseLine.clone() },
      uEdge: { value: palette.edge.clone() },
      uHaze: { value: palette.haze.clone() },
      uSun: { value: SUN_DIRECTION.clone() },
      uCamera: { value: new THREE.Vector3() },
      uDusk: { value: 0 },
      uFogNear: { value: 95 },
      uFogFar: { value: 290 },
    }),
    [form, heightTexture, palette]
  )

  const geometry = useMemo(() => {
    const plane = new THREE.PlaneGeometry(560, 560, 1, 1)
    plane.rotateX(-Math.PI / 2)
    return plane
  }, [])

  useEffect(
    () => () => {
      geometry.dispose()
      heightTexture.dispose()
    },
    [geometry, heightTexture]
  )

  useFrame((state, delta) => {
    const material = materialRef.current
    if (!material) {
      return
    }
    material.uniforms.uTime.value = state.clock.getElapsedTime()
    material.uniforms.uCamera.value.copy(state.camera.position)
    /* delta-based, so the theme cross-fade takes the same time on a 60Hz
       display, a 120Hz one, and a device that is struggling */
    material.uniforms.uDusk.value +=
      (dusk - material.uniforms.uDusk.value) * Math.min(delta * 2.5, 1)
  })

  return (
    <mesh geometry={geometry} renderOrder={0}>
      <shaderMaterial
        ref={materialRef}
        vertexShader={vertexShader}
        fragmentShader={fragmentShader}
        uniforms={uniforms}
      />
    </mesh>
  )
}
