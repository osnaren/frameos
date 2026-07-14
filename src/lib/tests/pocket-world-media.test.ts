import { describe, expect, it } from 'vitest'

import {
  isCompletePocketWorldMediaManifest,
  isPocketWorldMediaManifest,
  type PocketWorldMediaManifest,
} from '@/lib/pocket-world-media'

const asset = {
  id: 'wander',
  desktop: '/media/pocket-worlds/master/wander.mp4',
  mobile: '/media/pocket-worlds/mobile/wander.mp4',
  poster: '/media/pocket-worlds/posters/wander.webp',
  mobilePoster: '/media/pocket-worlds/posters/wander-mobile.webp',
  still: '/media/pocket-worlds/stills/wander.webp',
  duration: 8,
  desktopBytes: 10_000,
  mobileBytes: 5_000,
}

describe('Pocket Worlds media manifest', () => {
  it('accepts a complete versioned manifest', () => {
    expect(
      isPocketWorldMediaManifest({
        version: 1,
        ready: true,
        architecture: 'B',
        generatedAt: '2026-07-14T00:00:00.000Z',
        model: 'seedance_2_0',
        sections: [asset],
        connectors: [],
      })
    ).toBe(true)
  })

  it('rejects media outside the Pocket Worlds asset namespace', () => {
    expect(
      isPocketWorldMediaManifest({
        version: 1,
        ready: true,
        architecture: 'B',
        generatedAt: null,
        model: null,
        sections: [{ ...asset, desktop: 'https://example.com/wander.mp4' }],
        connectors: [],
      })
    ).toBe(false)
  })
})

const sceneIds = ['wander', 'sacred-geometry', 'small-wonders', 'living-things', 'table-notes']
const connectorIds = [
  'wander-to-sacred-geometry',
  'sacred-geometry-to-small-wonders',
  'small-wonders-to-living-things',
  'living-things-to-table-notes',
]

function completeManifest(architecture: 'A' | 'B' = 'B'): PocketWorldMediaManifest {
  return {
    version: 1,
    ready: true,
    architecture,
    generatedAt: '2026-07-14T00:00:00.000Z',
    model: 'seedance_2_0',
    sections: sceneIds.map((id) => ({ ...asset, id })) as PocketWorldMediaManifest['sections'],
    connectors: architecture === 'B' ? connectorIds.map((id) => ({ ...asset, id })) : [],
  }
}

describe('Pocket Worlds ready-state contract', () => {
  it('accepts the exact frame-locked architecture B chain', () => {
    expect(isCompletePocketWorldMediaManifest(completeManifest())).toBe(true)
  })

  it('accepts an architecture A chain without connectors', () => {
    expect(isCompletePocketWorldMediaManifest(completeManifest('A'))).toBe(true)
  })

  it('rejects duplicated or incorrectly named connectors', () => {
    const manifest = completeManifest()
    manifest.connectors[3] = { ...manifest.connectors[2] }

    expect(isCompletePocketWorldMediaManifest(manifest)).toBe(false)
  })

  it('rejects a ready manifest without measured media metadata', () => {
    const manifest = completeManifest()
    manifest.sections[0] = { ...manifest.sections[0], duration: null }

    expect(isCompletePocketWorldMediaManifest(manifest)).toBe(false)
  })
})
