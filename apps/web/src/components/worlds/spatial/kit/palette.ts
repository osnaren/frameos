import * as THREE from 'three'

import type { WorldMood } from '@/types/content'

/**
 * A world's colour, derived from the three tones the CMS holds.
 *
 * Every world document carries a `mood` — an ambient wash, a depth tone and a
 * focus accent — so recolouring a world is an edit rather than a deploy. This
 * turns those three into the full set the model needs.
 *
 * The important part is `mute`. These scenes are built from primitives, and
 * the single thing that decides whether that reads as a crafted model or as a
 * cheap game level is saturation. An editor can put any hex they like in the
 * CMS; every tone that touches the ground is passed through a saturation
 * ceiling on the way in, so the model discipline cannot be edited away by
 * accident. Only the accent — the captured light, one band on a structure —
 * is allowed to be a real colour.
 */

/** Pulls a colour back under a saturation ceiling, keeping its hue and value. */
function mute(color: THREE.Color, ceiling: number) {
  const hsl = { h: 0, s: 0, l: 0 }
  color.getHSL(hsl)
  return color.clone().setHSL(hsl.h, Math.min(hsl.s, ceiling), hsl.l)
}

/** Pushes a colour to a target lightness without touching its hue. */
function atLightness(color: THREE.Color, lightness: number) {
  const hsl = { h: 0, s: 0, l: 0 }
  color.getHSL(hsl)
  return color.clone().setHSL(hsl.h, hsl.s, lightness)
}

function mix(a: THREE.Color, b: THREE.Color, amount: number) {
  return a.clone().lerp(b, amount)
}

/** Ground tones a form can override when its material is not earth and grass. */
export interface GroundTones {
  /** Lowest terraces, at the base's edge. */
  low: string
  /** The middle of the model. */
  mid: string
  /** The high terraces. */
  high: string
  /** Exposed cut faces. */
  cut: string
  /** The shaded side of a cut. */
  cutDeep: string
  /** Anything built rather than grown. */
  built: string
}

/** The default earth-and-grass set, used by any form that does not override. */
export const EARTH_TONES: GroundTones = {
  low: '#dccdb0',
  mid: '#a6b58e',
  high: '#bdbda8',
  cut: '#b3aea4',
  cutDeep: '#8b877f',
  built: '#c3ae90',
}

/** How saturated anything touching the ground is ever allowed to be. */
const GROUND_CEILING = 0.3

export type WorldPalette = ReturnType<typeof buildWorldPalette>

export function buildWorldPalette(mood: WorldMood, tones: GroundTones = EARTH_TONES) {
  const wash = new THREE.Color(mood.wash)
  const deep = new THREE.Color(mood.deep)
  const accent = new THREE.Color(mood.accent)

  const ground = (hex: string) => mute(new THREE.Color(hex), GROUND_CEILING)

  /* The wash sets the key the whole world is played in: the base it sits on,
     the haze it recedes into, and the light it is lit by. */
  const base = atLightness(mute(wash, 0.22), 0.82)
  const haze = atLightness(mute(wash, 0.14), 0.88)

  return {
    /* ---- ground washes, laid over one another by elevation ---- */
    low: ground(tones.low),
    mid: ground(tones.mid),
    high: ground(tones.high),
    cut: ground(tones.cut),
    cutDeep: ground(tones.cutDeep),
    built: ground(tones.built),
    /* the tone right at the base's edge, damp or dusty */
    edge: mix(ground(tones.low), deep, 0.14),
    /* the deepest the model goes before it is only shadow */
    sunk: mix(ground(tones.cutDeep), deep, 0.45),
    /* top faces catching the key light */
    lit: atLightness(ground(tones.high), 0.86),

    /* ---- the base the model is set on ---- */
    baseSurface: base,
    baseShallow: atLightness(mute(wash, 0.16), 0.9),
    baseLine: atLightness(mute(wash, 0.26), 0.72),

    /* ---- atmosphere ---- */
    haze,
    skyHorizon: atLightness(mute(wash, 0.1), 0.93),
    skyZenith: atLightness(mute(wash, 0.2), 0.86),
    sunGlow: new THREE.Color('#fff4dd'),

    /* ---- light ---- */
    sunLight: new THREE.Color('#fffaf1'),
    skyFill: atLightness(mute(wash, 0.2), 0.88),
    groundFill: atLightness(mute(wash, 0.14), 0.78),

    /* ---- the one thing allowed to be a colour ---- */
    /**
     * The captured light. The core is warm white in every world — light is
     * light — and only the spill around it takes the world's accent, which is
     * what a coloured source actually looks like. Deriving the core from the
     * accent instead makes a blue world's thread read as a bare white line
     * and a green world's as a highlighter.
     */
    routeCore: new THREE.Color('#fff6e4'),
    routeGlow: atLightness(mute(accent, 0.5), 0.66),
    /**
     * A single painted mark on the destination structure.
     *
     * Muted much harder than the light is, and the ceiling is applied *after*
     * the lightness push — raising a mid-saturation colour's lightness makes
     * it read far more vividly than its saturation number suggests, which is
     * how a muted forest green arrives on a roof looking like mint.
     */
    mark: mute(atLightness(accent, 0.58), 0.22),
  }
}
