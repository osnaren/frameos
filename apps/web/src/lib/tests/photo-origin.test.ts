import { describe, expect, it } from 'vitest'

import {
  carryPhotoOrigin,
  describePhotoOrigin,
  fallbackPhotoOrigin,
  photoOriginState,
  readPhotoOrigin,
} from '@/lib/photo-origin'

const names: Record<string, string> = { wander: 'Wander', 'at-the-table': 'Table Notes' }
const worldName = (slug: string) => names[slug]

describe('photo origin', () => {
  it('round-trips through history state', () => {
    const origin = { kind: 'archive', filters: { tag: 'rain' }, viaHistory: true } as const
    expect(readPhotoOrigin({ __TSR_index: 3, ...photoOriginState(origin) })).toEqual(origin)

    const world = { kind: 'world', world: 'wander', viaHistory: false } as const
    expect(readPhotoOrigin(photoOriginState(world))).toEqual(world)
  })

  it('treats missing or malformed state as unknown', () => {
    expect(readPhotoOrigin(undefined)).toBeNull()
    expect(readPhotoOrigin({ photoOrigin: { kind: 'world' } })).toBeNull()
    expect(readPhotoOrigin({ photoOrigin: { kind: 'elsewhere' } })).toBeNull()
    expect(
      readPhotoOrigin({ photoOrigin: { kind: 'archive', filters: { tag: 7, world: 'wander' } } })
    ).toEqual({ kind: 'archive', filters: { world: 'wander' }, viaHistory: false })
  })

  it('carries an origin forward and nothing when there is none', () => {
    const origin = { kind: 'world', world: 'wander', viaHistory: true } as const
    expect(carryPhotoOrigin(origin)).toEqual({ photoOrigin: origin })
    expect(carryPhotoOrigin(null)).toEqual({})
  })

  it('falls back to the photo world, or the Index when the world is not public', () => {
    expect(fallbackPhotoOrigin('wander', ['wander'])).toEqual({
      kind: 'world',
      world: 'wander',
      viaHistory: false,
    })
    expect(fallbackPhotoOrigin('people', ['wander']).kind).toBe('archive')
    expect(fallbackPhotoOrigin(undefined, ['wander']).kind).toBe('archive')
  })

  it('describes the destination in words', () => {
    expect(
      describePhotoOrigin({ kind: 'world', world: 'wander', viaHistory: false }, worldName)
    ).toBe('Wander')
    expect(
      describePhotoOrigin({ kind: 'archive', filters: {}, viaHistory: false }, worldName)
    ).toBe('Index')
    expect(
      describePhotoOrigin(
        { kind: 'archive', filters: { world: 'at-the-table', tag: 'meal' }, viaHistory: true },
        worldName
      )
    ).toBe('Index · Table Notes · #meal')
  })
})
