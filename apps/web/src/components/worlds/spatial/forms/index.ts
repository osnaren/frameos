import { basin } from './basin'
import { coast } from './coast'
import { plateau } from './plateau'
import { table } from './table'
import { wetland } from './wetland'

import type { WorldForm } from '../kit/types'

/**
 * Every landform a world can be built on.
 *
 * A CMS world document names one of these in its `form` field. Adding a world
 * that reuses a landform is a CMS entry and nothing else; a world that needs
 * a genuinely new design is one module here and one line in this map.
 *
 * `FORM_OPTIONS` is what the Studio's picker offers, so the two can never
 * drift apart — a form that exists is always selectable, and a form that is
 * removed disappears from the picker.
 */

export const FORMS: Record<string, WorldForm> = {
  [coast.id]: coast,
  [plateau.id]: plateau,
  [basin.id]: basin,
  [wetland.id]: wetland,
  [table.id]: table,
}

export const FORM_OPTIONS = Object.values(FORMS).map((form) => ({
  value: form.id,
  title: form.title,
}))

/**
 * The form a world should be drawn with.
 *
 * Falls back by slug for the worlds that shipped before the field existed,
 * then gives up and returns null — a world with no form still renders as a
 * DOM card in the list, it simply has no scene.
 */
const LEGACY_BY_SLUG: Record<string, string> = {
  wander: 'coast',
  'sacred-geometry': 'plateau',
  'small-wonders': 'basin',
  'living-things': 'wetland',
  'at-the-table': 'table',
}

export function formFor(world: { slug: string; form?: string | null }): WorldForm | null {
  const named = world.form ? FORMS[world.form] : undefined
  if (named) {
    return named
  }
  const legacy = LEGACY_BY_SLUG[world.slug]
  return legacy ? (FORMS[legacy] ?? null) : null
}
