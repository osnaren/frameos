/**
 * The site's keyboard shortcuts, in one place: the help panel (press ?)
 * renders this list, and the handlers use the helpers below so every
 * shortcut ignores typing, modified keys and keys an open overlay owns.
 */

export type ShortcutScope = 'everywhere' | 'index' | 'viewer' | 'photo' | 'world'

export interface Shortcut {
  keys: string[]
  label: string
}

export interface ShortcutGroup {
  scope: ShortcutScope
  title: string
  shortcuts: Shortcut[]
}

export const SHORTCUT_GROUPS: ShortcutGroup[] = [
  {
    scope: 'everywhere',
    title: 'Everywhere',
    shortcuts: [
      { keys: ['?'], label: 'Show these shortcuts' },
      { keys: ['Esc'], label: 'Close whatever is open' },
    ],
  },
  {
    scope: 'photo',
    title: 'Photograph',
    shortcuts: [
      { keys: ['←', '→'], label: 'Previous / next in this world' },
      { keys: ['Home', 'End'], label: 'First / last in this world' },
      { keys: ['F'], label: 'Full screen' },
      { keys: ['I'], label: 'Capture data' },
      { keys: ['Esc'], label: 'Back to where you came from' },
    ],
  },
  {
    scope: 'viewer',
    title: 'Lightbox & full screen',
    shortcuts: [
      { keys: ['←', '→'], label: 'Previous / next' },
      { keys: ['Home', 'End'], label: 'First / last (Index)' },
      { keys: ['+', '−'], label: 'Zoom in / out' },
      { keys: ['0'], label: 'Fit to screen' },
      { keys: ['Esc'], label: 'Close' },
    ],
  },
  {
    scope: 'index',
    title: 'Index',
    shortcuts: [
      { keys: ['←', '↑', '→', '↓'], label: 'Move between frames' },
      { keys: ['Enter'], label: 'Open in the lightbox' },
    ],
  },
  {
    scope: 'world',
    title: 'World ring',
    shortcuts: [
      { keys: ['←', '→'], label: 'Turn the ring (focus it first)' },
      { keys: ['Enter'], label: 'Open the frame in front' },
    ],
  },
]

/** Which group is most relevant on a given page, so the panel can lead with it. */
export function shortcutScopeFor(pathname: string): ShortcutScope {
  if (pathname.startsWith('/photos/')) return 'photo'
  if (pathname.startsWith('/archive')) return 'index'
  if (pathname.startsWith('/worlds/')) return 'world'
  return 'everywhere'
}

/** The panel's order: the current page's group first, then the rest as listed. */
export function orderShortcutGroups(scope: ShortcutScope, groups = SHORTCUT_GROUPS) {
  const current = groups.filter((group) => group.scope === scope)
  return [...current, ...groups.filter((group) => group.scope !== scope)]
}

/** Any part of the app can open the panel (e.g. the footer button) by dispatching this. */
export const OPEN_SHORTCUTS_EVENT = 'frameos:shortcuts'

export function openKeyboardShortcuts() {
  window.dispatchEvent(new Event(OPEN_SHORTCUTS_EVENT))
}

export function isTypingTarget(target: EventTarget | null) {
  return (
    target instanceof HTMLElement &&
    Boolean(target.closest('input, textarea, select, [contenteditable="true"]'))
  )
}

/**
 * True for a bare keypress meant for the page: not typed into a field, not a
 * browser/OS chord, and not already handled. Shift is allowed only when the
 * caller says so (it's how `?` is typed).
 */
export function isPlainKeypress(event: KeyboardEvent, { allowShift = false } = {}) {
  return !(
    event.defaultPrevented ||
    event.altKey ||
    event.ctrlKey ||
    event.metaKey ||
    (event.shiftKey && !allowShift) ||
    event.isComposing ||
    isTypingTarget(event.target)
  )
}
