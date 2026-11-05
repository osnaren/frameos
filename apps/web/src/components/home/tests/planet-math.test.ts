import { describe, expect, it } from 'vitest'

import { orbitPeriod, orbitPlacement, orbitRadius } from '../orrery-math'
import { CHAPTER_PHASES, chapterUnfold, fold, samplePlanetUv } from '../planet/planet-math'

describe('fold', () => {
  it('is the identity across the photo', () => {
    expect(fold(0)).toBeCloseTo(0)
    expect(fold(0.25)).toBeCloseTo(0.25)
    expect(fold(1)).toBeCloseTo(1)
  })

  it('reflects outside the photo so the pair has no seam', () => {
    expect(fold(1.25)).toBeCloseTo(0.75)
    expect(fold(-0.25)).toBeCloseTo(0.25)
    /* both ends of one turn land on the photo's centre column */
    expect(fold(1.5)).toBeCloseTo(fold(-0.5))
  })
})

describe('samplePlanetUv', () => {
  it('gathers the bottom of the photo into the core and puts the sky at the rim', () => {
    expect(samplePlanetUv(0, 0)?.v).toBeCloseTo(0)
    expect(samplePlanetUv(0, 1)?.v).toBeCloseTo(1)
    expect(samplePlanetUv(0.7071, 0.7071)?.v).toBeCloseTo(1, 3)
  })

  it('is empty outside the disc', () => {
    expect(samplePlanetUv(0.8, 0.8)).toBeNull()
  })

  it('puts the centre of the photo straight up', () => {
    expect(samplePlanetUv(0, 0.5)?.u).toBeCloseTo(0.5)
  })

  it('is continuous across the bottom, where the mirrored pair meets', () => {
    const left = samplePlanetUv(-0.0001, -0.5)
    const right = samplePlanetUv(0.0001, -0.5)
    expect(left?.u).toBeCloseTo(right?.u ?? Number.NaN, 3)
  })

  it('gives more of the disc to the ground as the horizon rises', () => {
    const tight = samplePlanetUv(0, 0.5, { horizon: 0.25 })?.v ?? 0
    const broad = samplePlanetUv(0, 0.5, { horizon: 1.1 })?.v ?? 0
    expect(broad).toBeLessThan(tight)
  })
})

describe('chapterUnfold', () => {
  it('holds the planet, unfolds, then holds the photo', () => {
    expect(chapterUnfold(0)).toBe(1)
    expect(chapterUnfold(CHAPTER_PHASES.holdPlanetUntil)).toBe(1)
    expect(chapterUnfold(CHAPTER_PHASES.flatFrom)).toBe(0)
    expect(chapterUnfold(1)).toBe(0)
  })

  it('only ever unfolds as you scroll down', () => {
    let previous = 1
    for (let progress = 0; progress <= 1; progress += 0.01) {
      const t = chapterUnfold(progress)
      expect(t).toBeLessThanOrEqual(previous + 1e-9)
      previous = t
    }
  })
})

describe('orrery', () => {
  it('nests every orbit inside the next', () => {
    const count = 5
    for (let index = 1; index < count; index++) {
      expect(orbitRadius(index, count)).toBeGreaterThan(orbitRadius(index - 1, count))
    }
  })

  it('turns outer orbits more slowly', () => {
    expect(orbitPeriod(4, 5)).toBeGreaterThan(orbitPeriod(0, 5))
  })

  it('keeps every planet inside the box', () => {
    for (let seconds = 0; seconds < 600; seconds += 7) {
      for (let index = 0; index < 8; index++) {
        const { x, y, depth } = orbitPlacement(index, 8, seconds)
        expect(x).toBeGreaterThanOrEqual(0)
        expect(x).toBeLessThanOrEqual(100)
        expect(y).toBeGreaterThanOrEqual(0)
        expect(y).toBeLessThanOrEqual(100)
        expect(depth).toBeGreaterThanOrEqual(0)
        expect(depth).toBeLessThanOrEqual(1)
      }
    }
  })

  it('places a single world sensibly', () => {
    expect(orbitRadius(0, 1)).toBeGreaterThan(0)
  })
})
