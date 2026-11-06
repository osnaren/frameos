import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'
import {schemaTypes} from './schemaTypes'
import {isSingletonType, structure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'FrameOS',

  projectId: '1tyt8kvt',
  dataset: 'production',

  plugins: [structureTool({structure}), visionTool()],

  schema: {
    types: schemaTypes,
  },

  document: {
    // Singletons (site settings + the three pages) can be edited and
    // published, but never duplicated or deleted — there is always exactly
    // one document of each of these types.
    actions: (prev, context) =>
      isSingletonType(context.schemaType)
        ? prev.filter(({action}) => action !== 'delete' && action !== 'duplicate')
        : prev,
  },
})
