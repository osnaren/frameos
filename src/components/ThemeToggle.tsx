import { useEffect, useState } from 'react'

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

  function cycleMode() {
    const nextMode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]
    setMode(nextMode)
    applyThemeMode(nextMode)
    window.localStorage.setItem('theme', nextMode)
  }

  const nextMode = ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length]
  const stateLabel = mode === 'auto' ? 'Auto (follows your system)' : mode
  const label = `Theme: ${stateLabel}. Click to switch to ${nextMode}.`
  const glyph = mode === 'light' ? '○' : mode === 'dark' ? '●' : '◐'

  return (
    <button
      type="button"
      onClick={cycleMode}
      aria-label={label}
      title={label}
      className="inline-flex cursor-pointer items-center gap-2 rounded-full border border-(--line) bg-(--panel) px-4 py-2.5 text-[0.72rem] font-semibold tracking-[0.16em] uppercase text-(--ink) shadow-[0_14px_30px_var(--shadow)] transition hover:-translate-y-0.5"
    >
      <span aria-hidden="true" className="text-[0.6rem]">
        {glyph}
      </span>
      {mode === 'auto' ? 'Auto' : mode === 'dark' ? 'Dark' : 'Light'}
    </button>
  )
}
