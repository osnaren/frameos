import { createRouter as createTanStackRouter } from '@tanstack/react-router'

import { PageSkeleton } from './components/layout/RouteSkeletons'
import { routeTree } from './routeTree.gen'

export function getRouter() {
  const router = createTanStackRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreload: 'intent',
    defaultPreloadStaleTime: 0,
    defaultViewTransition: true,
    // Navigations that resolve quickly (most do — routes preload on intent)
    // never show a skeleton; slower ones show one after a beat and hold it
    // long enough not to flicker.
    defaultPendingMs: 280,
    defaultPendingMinMs: 420,
    defaultPendingComponent: PageSkeleton,
  })

  return router
}

declare module '@tanstack/react-router' {
  interface Register {
    router: ReturnType<typeof getRouter>
  }
}
