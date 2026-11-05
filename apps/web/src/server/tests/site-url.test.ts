import { describe, expect, it } from 'vitest'

import { getRequestOrigin } from '@/server/http/site-origin'
import { normalizeOrigin, resolveSiteOrigin } from '@/server/site-url'

describe('resolveSiteOrigin', () => {
  const requestOrigin = 'https://frameos-git-branch.vercel.app'

  it('prefers an explicitly configured site URL, reduced to its origin', () => {
    expect(
      resolveSiteOrigin({
        configuredUrl: 'https://frameos.example/some/path/',
        vercelEnv: 'production',
        vercelProductionHost: 'frameos.vercel.app',
        requestOrigin,
      })
    ).toBe('https://frameos.example')
  })

  it('ignores a malformed configured URL instead of failing', () => {
    expect(resolveSiteOrigin({ configuredUrl: 'frameos.example', requestOrigin })).toBe(
      requestOrigin
    )
    expect(resolveSiteOrigin({ configuredUrl: 'ftp://frameos.example', requestOrigin })).toBe(
      requestOrigin
    )
  })

  it("uses Vercel's production domain on production deployments", () => {
    expect(
      resolveSiteOrigin({
        vercelEnv: 'production',
        vercelProductionHost: 'frameos.example',
        requestOrigin: 'https://frameos-abc123.vercel.app',
      })
    ).toBe('https://frameos.example')
  })

  it('keeps preview deployments self-referential', () => {
    expect(
      resolveSiteOrigin({
        vercelEnv: 'preview',
        vercelProductionHost: 'frameos.example',
        requestOrigin,
      })
    ).toBe(requestOrigin)
  })

  it('falls back to the request origin', () => {
    expect(resolveSiteOrigin({ requestOrigin: 'http://localhost:3000' })).toBe(
      'http://localhost:3000'
    )
  })
})

describe('normalizeOrigin', () => {
  it('treats blank values as unset', () => {
    expect(normalizeOrigin('   ')).toBeUndefined()
    expect(normalizeOrigin(undefined)).toBeUndefined()
  })
})

describe('getRequestOrigin', () => {
  it('honours the first forwarded proto/host pair', () => {
    const request = new Request('http://127.0.0.1:3000/photos/the-sea', {
      headers: { 'x-forwarded-proto': 'https, http', 'x-forwarded-host': 'frameos.example' },
    })

    expect(getRequestOrigin(request)).toBe('https://frameos.example')
  })

  it('uses the request URL without forwarded headers', () => {
    expect(getRequestOrigin(new Request('http://localhost:3211/notes'))).toBe(
      'http://localhost:3211'
    )
  })
})
