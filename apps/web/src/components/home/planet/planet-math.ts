/**
 * The geometry of a pocket world: one photograph, curled into a little planet.
 *
 * A photo is a strip of ground with sky above it. Bend that strip around a
 * circle — bottom edge inwards, top edge outwards — and the horizon closes
 * into a ring: the "tiny planet" a phone camera makes from a panorama. The
 * home page scrubs between the two states, so every world opens out of its
 * planet into the frame it was made from.
 *
 * The same mapping runs in two places:
 *   - `PLANET_FRAGMENT_SHADER` (GPU, every frame of the unfold), and
 *   - `samplePlanetUv` (CPU, for the still planet when WebGL is missing).
 * Keep them in step; `tests/planet-math.test.ts` pins the CPU version.
 *
 * Coordinates: photo space has the photo's bottom-centre at the origin, y up,
 * and the photo is 1 unit tall and `aspect` units wide. `t` runs from 0 (the
 * flat photograph) to 1 (the closed planet).
 */
import { DEFAULT_PLANET_HORIZON, clampHorizon } from '@/lib/world-overview'

export interface PlanetTuning {
  /** How much of the frame becomes ground — see `World.planet.horizon`. */
  horizon: number
}

export const DEFAULT_PLANET_TUNING: PlanetTuning = { horizon: DEFAULT_PLANET_HORIZON }

export { clampHorizon }

/** Mirror-fold so the photo repeats as a reflected pair around the circle, with no seam. */
export function fold(u: number) {
  const m = ((u % 2) + 2) % 2
  return 1 - Math.abs(m - 1)
}

/**
 * Where on the photograph a point of the closed planet comes from.
 *
 * `x`, `y` are relative to the planet's centre in units of its radius (so the
 * rim is at distance 1); y points up. Returns texture coordinates with v = 0
 * at the bottom of the photo, or `null` outside the disc.
 */
export function samplePlanetUv(
  x: number,
  y: number,
  tuning: PlanetTuning = DEFAULT_PLANET_TUNING,
  spin = 0
): { u: number; v: number } | null {
  const r = Math.hypot(x, y)

  if (r > 1) {
    return null
  }

  const k = clampHorizon(tuning.horizon)
  const theta = Math.atan2(x, y) + spin
  /* Two reflected copies around the full turn: θ ∈ (−π, π] → u ∈ (−½, 1½]. */
  const u = fold(theta / Math.PI + 0.5)
  const v = Math.atan(r / k) / Math.atan(1 / k)

  return { u, v }
}

/** Easing used for every phase of the unfold. */
export function easeInOut(value: number) {
  const t = Math.min(1, Math.max(0, value))
  return t * t * (3 - 2 * t)
}

/**
 * The scroll choreography of one world chapter, from section progress `p`
 * (0 → 1) to the unfold amount `t` (1 = planet, 0 = photo).
 *
 * The planet holds for the opening, unfolds through the middle, and the photo
 * holds for the close so its caption and contact strip can be read.
 */
export const CHAPTER_PHASES = {
  holdPlanetUntil: 0.14,
  flatFrom: 0.6,
} as const

export function chapterUnfold(progress: number) {
  const { holdPlanetUntil, flatFrom } = CHAPTER_PHASES
  if (progress <= holdPlanetUntil) {
    return 1
  }
  if (progress >= flatFrom) {
    return 0
  }
  return 1 - easeInOut((progress - holdPlanetUntil) / (flatFrom - holdPlanetUntil))
}

export const PLANET_VERTEX_SHADER = /* glsl */ `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`

/**
 * One full-screen triangle; everything happens per pixel.
 *
 * Uniforms (all lengths in device pixels, origin bottom-left):
 *   uResolution   canvas size
 *   uAspect       photo width / height
 *   uFocus        cover-crop focal point of the flat photo (0..1, y up)
 *   uT            0 = flat photo, 1 = closed planet
 *   uCenter       planet centre when closed
 *   uRadius       planet radius when closed
 *   uHorizon      PlanetTuning.horizon
 *   uSpin         rotation of the closed planet, radians
 *   uGlow         atmosphere colour (rgb) — the world's wash
 *   uGlowStrength 0..1
 */
export const PLANET_FRAGMENT_SHADER = /* glsl */ `
precision highp float;

uniform sampler2D uImage;
uniform vec2 uResolution;
uniform float uAspect;
uniform vec2 uFocus;
uniform float uT;
uniform vec2 uCenter;
uniform float uRadius;
uniform float uHorizon;
uniform float uSpin;
uniform vec3 uGlow;
uniform float uGlowStrength;

const float PI = 3.14159265359;

float fold(float u) {
  return 1.0 - abs(mod(u, 2.0) - 1.0);
}

void main() {
  vec2 s = gl_FragCoord.xy;
  float t = clamp(uT, 0.0, 1.0);
  float e = t * t * (3.0 - 2.0 * t);

  /* --- the flat photograph, cover-fitted around its focal point --- */
  float coverH = max(uResolution.y, uResolution.x / uAspect);
  float coverW = coverH * uAspect;
  vec2 overflow = vec2(coverW, coverH) - uResolution;
  vec2 flatOrigin = -overflow * uFocus;           /* bottom-left of the photo, px */
  vec2 flatBottom = flatOrigin + vec2(coverW * 0.5, 0.0);

  /* --- the closed planet: a mirrored pair of photos fills one turn --- */
  float kEnd = PI / uAspect;                      /* curvature, per photo-height */
  float rbEnd = 1.0 / kEnd;
  float zEnd = uRadius / (rbEnd + 1.0);           /* photo height in px when closed */

  /* --- interpolate the bend: curvature, scale, and where the bottom edge sits.
         At t = 1 the bend's centre lands exactly on uCenter. --- */
  float k = max(kEnd * pow(e, 1.35), 1e-5);
  float z = coverH * pow(zEnd / coverH, e);
  vec2 planetBottom = uCenter + vec2(0.0, rbEnd * zEnd);
  vec2 bottom = mix(flatBottom, planetBottom, e);

  vec2 p = (s - bottom) / z;                      /* photo units, bottom-centre origin */

  /* arc-length mapping around a circle of radius 1/k below the photo,
     written so it stays exact as k -> 0 (the flat photo) */
  vec2 cp = vec2(k * p.x, k * p.y + 1.0);
  float spin = uSpin * smoothstep(0.55, 1.0, t);
  float theta = atan(cp.x, cp.y) + spin;
  float uRaw = (theta / k) / uAspect + 0.5;
  float vCurl = (k * dot(p, p) + 2.0 * p.y) / (length(cp) + 1.0);

  /* distance from the bend's centre, as a fraction of the strip's outer
     radius; the closed state remaps it stereographically so the bottom of
     the photo gathers into a core instead of leaving a hole */
  float rb = 1.0 / k;
  float rr = (vCurl + rb) / (rb + 1.0);
  float h = max(uHorizon, 0.05);
  float vPlanet = atan(max(rr, 0.0) / h) / atan(1.0 / h);
  float closing = smoothstep(0.45, 1.0, t);
  float v = mix(vCurl, vPlanet, closing);
  float u = fold(uRaw);

  /* soft ~1.5px edges: the top of the photo, the bottom (while the core is
     still open), and the two ends of the strip until they meet */
  float pxV = 1.5 / mix(z, (rb + 1.0) * z * 0.4, closing);
  float inside = smoothstep(-pxV, pxV, v) * smoothstep(1.0 + pxV, 1.0 - pxV, v);
  float pxU = 1.5 / (z * uAspect);
  float ends = smoothstep(-0.5 - pxU, -0.5 + pxU, uRaw) * smoothstep(1.5 + pxU, 1.5 - pxU, uRaw);
  ends = mix(ends, 1.0, smoothstep(0.985, 1.0, t));
  float alpha = inside * ends;

  vec3 color = texture2D(uImage, vec2(u, clamp(v, 0.0, 1.0))).rgb;

  /* a little depth on the closed disc: darker toward the limb */
  float limb = smoothstep(0.55, 1.0, rr) * closing;
  color *= 1.0 - 0.22 * limb;

  /* atmosphere: a soft halo of the world's wash just outside the rim */
  float halo = closing * uGlowStrength * 0.6 * exp(-max(rr - 1.0, 0.0) * 9.0) * step(1.0, rr);

  /* premultiplied output */
  vec3 outColor = color * alpha + uGlow * halo * (1.0 - alpha);
  float outAlpha = alpha + halo * (1.0 - alpha);

  gl_FragColor = vec4(outColor, outAlpha);
}
`
