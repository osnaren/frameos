import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'

import { schemaTypes } from './src/sanity/schema'
import { isSingletonType, structure } from './src/sanity/structure'

const projectId = process.env.SANITY_PROJECT_ID ?? 'placeholder-project'
const dataset = process.env.SANITY_DATASET ?? 'production'

export default defineConfig({
  name: 'default',
  title: process.env.SANITY_STUDIO_PROJECT_TITLE ?? 'FrameOS Studio',
  projectId,
  dataset,
  plugins: [structureTool({ structure }), visionTool()],
  schema: {
    types: schemaTypes,
  },
  document: {
    // Singletons (site settings + the three pages) can be edited and
    // published, but never duplicated or deleted — there is always exactly
    // one document of each of these types.
    actions: (prev, context) =>
      isSingletonType(context.schemaType)
        ? prev.filter(({ action }) => action !== 'delete' && action !== 'duplicate')
        : prev,
  },
})
