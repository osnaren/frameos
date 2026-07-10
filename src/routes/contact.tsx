import { createFileRoute, redirect } from '@tanstack/react-router'

/** Legacy route: contact lives at /signal. */
export const Route = createFileRoute('/contact')({
  beforeLoad: () => {
    throw redirect({ to: '/signal' })
  },
})
