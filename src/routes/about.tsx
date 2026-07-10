import { createFileRoute, redirect } from '@tanstack/react-router'

/** Legacy route: the about story lives at /notes (Field Notes). */
export const Route = createFileRoute('/about')({
  beforeLoad: () => {
    throw redirect({ to: '/notes' })
  },
})
