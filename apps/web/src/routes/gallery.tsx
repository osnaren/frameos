import { createFileRoute, redirect } from '@tanstack/react-router'

/** Legacy route: the gallery is now the Index at /archive (permanent, for search engines). */
export const Route = createFileRoute('/gallery')({
  validateSearch: (search: Record<string, unknown>) => ({
    category: typeof search.category === 'string' ? search.category : undefined,
  }),
  beforeLoad: ({ search }) => {
    throw redirect({
      to: '/archive',
      search: search.category ? { world: search.category } : {},
      statusCode: 301,
    })
  },
})
