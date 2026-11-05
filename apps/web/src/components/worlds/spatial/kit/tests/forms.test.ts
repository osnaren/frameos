import { describe, expect, it } from 'vitest'

import { getJourneyWorlds } from '@/content/worlds'

import { FORMS, formFor } from '../../forms'
import { maxReach, quantise } from '../contour'
import { worldRoute } from '../route'

import type { WorldForm } from '../types'

/**
 * Every world is generated, so these guard the properties the composition
 * depends on — for all of them at once. If a new form is added and one of
 * these breaks, that world has a hole in it: land running off the cut edge
 * of its board, a route wading through the base, or a destination sunk.
 */

const forms = Object.values(FORMS)

describe('the form registry', () => {
  it('registers every form under its own id', () => {
    for (const [key, form] of Object.entries(FORMS)) {
      expect(form.id).toBe(key)
    }
  })

  it('gives every world on the home journey a form', () => {
    const worlds = getJourneyWorlds()
    expect(worlds.length).toBeGreaterThan(0)
    for (const world of worlds) {
      expect(formFor(world), `no form for ${world.slug}`).not.toBeNull()
    }
  })

  it('falls back to nothing rather than guessing for an unknown world', () => {
    expect(formFor({ slug: 'not-a-world' })).toBeNull()
  })
})

describe.each(forms.map((form) => [form.id, form] as const))('%s', (_id, form: WorldForm) => {
  it('keeps the land inside its own board', () => {
    const half = form.board.span / 2
    const reach = maxReach(form.board)

    /* the land must be gone before the mesh runs out, in every direction */
    expect(Math.abs(form.board.extent.x) + reach).toBeLessThan(half)
    expect(Math.abs(form.board.extent.z) + reach).toBeLessThan(half)

    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 12) {
      const x = form.board.extent.x + Math.cos(angle) * reach
      const z = form.board.extent.z + Math.sin(angle) * reach
      expect(form.height(x, z)).toBeLessThan(0)
    }

    for (const [x, z] of [
      [-half, 0],
      [half, 0],
      [0, -half],
      [0, half],
      [-half, -half],
      [half, half],
    ]) {
      expect(form.height(x, z)).toBeLessThan(0)
    }
  })

  it('stands its destination clear of the base', () => {
    expect(form.height(form.destination.x, form.destination.z)).toBeGreaterThan(0.3)
  })

  it('keeps the route on solid ground, ending at the destination', () => {
    const route = worldRoute(form)

    for (let i = 0; i <= 60; i++) {
      const point = route.curve.getPointAt(i / 60)
      expect(route.groundAt(point.x, point.z)).toBeGreaterThan(0.1)
      if (form.shoreAt) {
        expect(point.x).toBeLessThan(form.shoreAt(point.z))
      }
    }

    const end = route.curve.getPointAt(1)
    expect(Math.hypot(end.x - form.destination.x, end.z - form.destination.z)).toBeLessThan(2)
  })

  it('quantises land onto contour levels and leaves the base alone', () => {
    const stepped = quantise(
      form.height(form.destination.x, form.destination.z),
      form.board.contourStep
    )
    /* an exact multiple of the step — compared as a level, because a float
       modulo of two decimals is never exactly zero */
    const level = stepped / form.board.contourStep
    expect(level).toBeCloseTo(Math.round(level), 6)
    expect(quantise(-1.4, form.board.contourStep)).toBe(-1.4)
  })

  it('authors both camera paths, anchored end to end', () => {
    for (const keys of [form.camera.desktop, form.camera.mobile]) {
      expect(keys.length).toBeGreaterThanOrEqual(4)
      expect(keys[0].at).toBe(0)
      expect(keys.at(-1)!.at).toBe(1)
      /* keys must climb, or the sampler picks the wrong pair */
      for (let i = 1; i < keys.length; i++) {
        expect(keys[i].at).toBeGreaterThan(keys[i - 1].at)
      }
    }
  })

  it('keeps the mesh dense relative to its contour step', () => {
    /* A cell wider than the step smears each level change into a ramp, and
       the model stops reading as cut card. */
    const cell = form.board.span / form.board.segments.full
    expect(cell).toBeLessThan(form.board.contourStep)
  })
})
