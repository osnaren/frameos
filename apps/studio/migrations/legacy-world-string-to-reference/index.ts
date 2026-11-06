import {at, defineMigration, setIfMissing, unset} from 'sanity/migrate'

const WORLD_ID_QUERY = `
  *[
    _type == "world" &&
    slug.current == $slug &&
    !(_id in path("drafts.**"))
  ][0]._id
`

export default defineMigration({
  title: 'Move photo world strings to world references',
  documentTypes: ['photo'],
  filter: 'defined(world) && !defined(worldRef)',
  migrate: {
    async document(document, context) {
      const legacyWorld = typeof document.world === 'string' ? document.world.trim() : ''

      if (!legacyWorld) return []

      const worldId = await context.client.fetch<string | null>(WORLD_ID_QUERY, {
        slug: legacyWorld,
      })

      // Leave unmatched photos untouched so the migration is safe to rerun
      // after an editor creates the missing world document.
      if (!worldId) return []

      return [
        at('worldRef', setIfMissing({_type: 'reference', _ref: worldId})),
        at('world', unset()),
      ]
    },
  },
})
