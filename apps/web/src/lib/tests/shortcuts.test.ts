import { describe, expect, it } from 'vitest'

import { orderShortcutGroups, SHORTCUT_GROUPS, shortcutScopeFor } from '@/lib/shortcuts'

describe('keyboard shortcuts', () => {
  it('maps each page to the shortcuts that matter there', () => {
    expect(shortcutScopeFor('/photos/leaf-after-rain')).toBe('photo')
    expect(shortcutScopeFor('/archive')).toBe('index')
    expect(shortcutScopeFor('/worlds/small-wonders')).toBe('world')
    expect(shortcutScopeFor('/')).toBe('everywhere')
    expect(shortcutScopeFor('/notes')).toBe('everywhere')
  })

  it('leads with the current page and keeps every group', () => {
    const ordered = orderShortcutGroups('photo')
    expect(ordered[0].scope).toBe('photo')
    expect(ordered).toHaveLength(SHORTCUT_GROUPS.length)
    expect(new Set(ordered.map((group) => group.scope)).size).toBe(SHORTCUT_GROUPS.length)
  })
})
