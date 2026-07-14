import { pocketWorldJourney, type PocketWorldSceneId } from '@/content/pocket-worlds-journey'

export const POCKET_WORLD_MEDIA_MANIFEST_URL = '/media/pocket-worlds/manifests/web-manifest.json'

export interface PocketWorldMediaAsset {
  id: string
  desktop: string
  mobile: string
  poster: string
  mobilePoster: string
  still: string
  duration: number | null
  desktopBytes: number | null
  mobileBytes: number | null
}

export interface PocketWorldSceneMediaAsset extends PocketWorldMediaAsset {
  id: PocketWorldSceneId
}

export interface PocketWorldMediaManifest {
  version: 1
  ready: boolean
  architecture: 'A' | 'B'
  generatedAt: string | null
  model: string | null
  sections: PocketWorldSceneMediaAsset[]
  connectors: PocketWorldMediaAsset[]
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isNullableNumber(value: unknown) {
  return value === null || (typeof value === 'number' && Number.isFinite(value) && value >= 0)
}

function isMediaPath(value: unknown) {
  return typeof value === 'string' && value.startsWith('/media/pocket-worlds/')
}

function isAsset(value: unknown): value is PocketWorldMediaAsset {
  if (!isRecord(value)) {
    return false
  }

  return (
    typeof value.id === 'string' &&
    isMediaPath(value.desktop) &&
    isMediaPath(value.mobile) &&
    isMediaPath(value.poster) &&
    isMediaPath(value.mobilePoster) &&
    isMediaPath(value.still) &&
    isNullableNumber(value.duration) &&
    isNullableNumber(value.desktopBytes) &&
    isNullableNumber(value.mobileBytes)
  )
}

export function isPocketWorldMediaManifest(value: unknown): value is PocketWorldMediaManifest {
  if (!isRecord(value)) {
    return false
  }

  if (
    value.version !== 1 ||
    typeof value.ready !== 'boolean' ||
    (value.architecture !== 'A' && value.architecture !== 'B') ||
    (value.generatedAt !== null && typeof value.generatedAt !== 'string') ||
    (value.model !== null && typeof value.model !== 'string') ||
    !Array.isArray(value.sections) ||
    !Array.isArray(value.connectors)
  ) {
    return false
  }

  return value.sections.every(isAsset) && value.connectors.every(isAsset)
}

function hasVerifiedAssetMetadata(asset: PocketWorldMediaAsset) {
  return (
    typeof asset.duration === 'number' &&
    asset.duration > 0 &&
    typeof asset.desktopBytes === 'number' &&
    asset.desktopBytes > 0 &&
    typeof asset.mobileBytes === 'number' &&
    asset.mobileBytes > 0
  )
}

function hasExactIds(assets: PocketWorldMediaAsset[], expectedIds: string[]) {
  return (
    assets.length === expectedIds.length &&
    new Set(assets.map((asset) => asset.id)).size === assets.length &&
    expectedIds.every((id) => assets.some((asset) => asset.id === id))
  )
}

export function isCompletePocketWorldMediaManifest(manifest: PocketWorldMediaManifest) {
  if (!manifest.ready) {
    return false
  }

  const sceneIds = pocketWorldJourney.map((scene) => scene.id)
  const connectorIds =
    manifest.architecture === 'B'
      ? pocketWorldJourney
          .slice(0, -1)
          .map((scene, index) => `${scene.id}-to-${pocketWorldJourney[index + 1].id}`)
      : []

  return (
    hasExactIds(manifest.sections, sceneIds) &&
    hasExactIds(manifest.connectors, connectorIds) &&
    [...manifest.sections, ...manifest.connectors].every(hasVerifiedAssetMetadata)
  )
}
