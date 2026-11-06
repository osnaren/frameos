export const NAV_LINKS = [
  { to: '/', label: 'Worlds' },
  { to: '/archive', label: 'Index' },
  { to: '/notes', label: 'Field Notes' },
  { to: '/signal', label: 'Signal' },
] as const

export function isNavigationLinkActive(pathname: string, to: (typeof NAV_LINKS)[number]['to']) {
  if (to === '/') {
    return pathname === '/' || pathname.startsWith('/worlds/')
  }

  if (to === '/archive') {
    return pathname === '/archive' || pathname.startsWith('/photos/')
  }

  return pathname === to
}
