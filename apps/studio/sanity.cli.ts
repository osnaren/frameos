import {defineCliConfig} from 'sanity/cli'

export default defineCliConfig({
  api: {
    projectId: '1tyt8kvt',
    dataset: 'production',
  },
  studioHost: 'frameos',
  deployment: {
    /**
     * Enable auto-updates for studios.
     * Learn more at https://www.sanity.io/docs/studio/latest-version-of-sanity#k47faf43faf56
     */
    autoUpdates: true,
  },
  schemaExtraction: {
    enabled: true,
    path: 'schema.json',
  },
  typegen: {
    enabled: true,
    path: '../web/src/**/*.{ts,tsx}',
    schema: 'schema.json',
    generates: '../web/src/sanity.types.ts',
    overloadClientMethods: true,
  },
})
