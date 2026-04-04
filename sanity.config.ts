import { visionTool } from '@sanity/vision'
import { defineConfig } from 'sanity'
import { cloudinarySchemaPlugin } from 'sanity-plugin-cloudinary'

import { schemaTypes } from './src/sanity/schema'

const projectId = process.env.SANITY_PROJECT_ID ?? 'placeholder-project'
const dataset = process.env.SANITY_DATASET ?? 'production'

export default defineConfig({
  name: 'default',
  title: process.env.SANITY_STUDIO_PROJECT_TITLE ?? 'FrameOS Studio',
  projectId,
  dataset,
  plugins: [cloudinarySchemaPlugin(), visionTool()],
  schema: {
    types: schemaTypes,
  },
})
