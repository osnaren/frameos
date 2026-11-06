import { useEffect, useState } from 'react'

import { useRouterState } from '@tanstack/react-router'
import { Keyboard } from 'lucide-react'

import { Dialog, DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog'
import {
  isPlainKeypress,
  OPEN_SHORTCUTS_EVENT,
  orderShortcutGroups,
  shortcutScopeFor,
} from '@/lib/shortcuts'

/**
 * The `?` panel: every keyboard shortcut on the site, with the ones for the
 * current page first. Mounted once in the root layout.
 */
export function KeyboardShortcuts() {
  const [open, setOpen] = useState(false)
  const pathname = useRouterState({ select: (state) => state.location.pathname })
  const groups = orderShortcutGroups(shortcutScopeFor(pathname))

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== '?' || !isPlainKeypress(event, { allowShift: true })) return
      event.preventDefault()
      setOpen((current) => !current)
    }
    const handleOpen = () => setOpen(true)

    window.addEventListener('keydown', handleKey)
    window.addEventListener(OPEN_SHORTCUTS_EVENT, handleOpen)
    return () => {
      window.removeEventListener('keydown', handleKey)
      window.removeEventListener(OPEN_SHORTCUTS_EVENT, handleOpen)
    }
  }, [])

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="shortcuts-panel" showCloseButton>
        <div className="shortcuts-panel-head">
          <Keyboard aria-hidden="true" />
          <div>
            <DialogTitle className="shortcuts-panel-title display-font">
              Keyboard shortcuts
            </DialogTitle>
            <DialogDescription className="shortcuts-panel-description">
              Press <kbd>?</kbd> anywhere to open or close this.
            </DialogDescription>
          </div>
        </div>
        <div className="shortcuts-panel-groups">
          {groups.map((group, index) => (
            <section
              key={group.scope}
              className="shortcuts-group"
              data-current={index === 0 && group.scope !== 'everywhere' ? '' : undefined}
              aria-labelledby={`shortcuts-${group.scope}`}
            >
              <h3 id={`shortcuts-${group.scope}`} className="shortcuts-group-title">
                {group.title}
                {index === 0 && group.scope !== 'everywhere' ? (
                  <span className="shortcuts-group-here">This page</span>
                ) : null}
              </h3>
              <dl>
                {group.shortcuts.map((shortcut) => (
                  <div key={shortcut.label}>
                    <dt>
                      {shortcut.keys.map((key) => (
                        <kbd key={key}>{key}</kbd>
                      ))}
                    </dt>
                    <dd>{shortcut.label}</dd>
                  </div>
                ))}
              </dl>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
