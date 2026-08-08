import { useEffect, useState } from 'react'

import { Monitor, Moon, Sun } from 'lucide-react'

import { Button } from '@/components/ui/button'

type ThemeMode = 'light' | 'dark' | 'auto'

const ORDER: ThemeMode[] = ['light', 'dark', 'auto']

/** Pocket Worlds defaults to the bright experience; dark is a choice. */
function getInitialMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'light'
  }

  const stored = window.localStorage.getItem('theme')
  if (stored === 'light' || stored === 'dark' || stored === 'auto') {
    return stored
  }

  return 'light'
}

function resolveMode(mode: ThemeMode) {
  if (mode !== 'auto') {
    return mode
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

function applyThemeMode(mode: ThemeMode) {
  const resolved = resolveMode(mode)
  const root = document.documentElement

  root.classList.remove('light', 'dark')
  root.classList.add(resolved)
  root.setAttribute('data-theme', resolved)

  if (mode === 'auto') {
    root.setAttribute('data-theme-mode', 'auto')
  } else {
    root.removeAttribute('data-theme-mode')
  }

  root.style.colorScheme = resolved
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>('light')

  useEffect(() => {
    const initialMode = getInitialMode()
    setMode(initialMode)
    applyThemeMode(initialMode)
  }, [])

  useEffect(() => {
    if (mode !== 'auto') {
      return
    }

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const onChange = () => applyThemeMode('auto')

    media.addEventListener('change', onChange)
    return () => {
      media.removeEventListener('change', onChange)
    }
  }, [mode])

  function cycleMode(event: React.MouseEvent<HTMLButtonElement>) {
    const nextMode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]

    const applyChange = () => {
      setMode(nextMode)
      applyThemeMode(nextMode)
      window.localStorage.setItem('theme', nextMode)
    }

    const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const supportsViewTransitions = typeof document.startViewTransition === 'function'

    if (reducedMotion || !supportsViewTransitions) {
      applyChange()
      return
    }

    // An iris opening from the button itself, like a lens stopping down to a new exposure.
    const rect = event.currentTarget.getBoundingClientRect()
    const root = document.documentElement
    root.style.setProperty('--theme-toggle-x', `${rect.left + rect.width / 2}px`)
    root.style.setProperty('--theme-toggle-y', `${rect.top + rect.height / 2}px`)
    root.classList.add('is-theme-transition')

    const transition = document.startViewTransition(applyChange)
    // Rapid clicks can interrupt/skip a transition, which rejects its promises --
    // expected, not an error worth surfacing. All three can reject independently.
    transition.ready.catch(() => {})
    transition.updateCallbackDone.catch(() => {})
    transition.finished
      .catch(() => {})
      .finally(() => {
        root.classList.remove('is-theme-transition')
      })
  }

  const nextMode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]
  const stateLabel = mode === 'auto' ? 'Auto (follows your system)' : mode
  const label = `Theme: ${stateLabel}. Click to switch to ${nextMode}.`
  const Glyph = mode === 'light' ? Sun : mode === 'dark' ? Moon : Monitor

  return (
    <Button
      type="button"
      variant="outline"
      size="icon"
      onClick={cycleMode}
      aria-label={label}
      title={label}
      className="theme-toggle rounded-full"
    >
      <Glyph aria-hidden="true" className="theme-toggle__icon" strokeWidth={1.7} />
    </Button>
  )
}
