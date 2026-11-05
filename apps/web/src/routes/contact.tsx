import { createFileRoute, redirect } from '@tanstack/react-router'

/** Legacy route: contact lives at /signal (permanent, so search engines move the URL). */
export const Route = createFileRoute('/contact')({
  beforeLoad: () => {
    throw redirect({ to: '/signal', statusCode: 301 })
  },
})
