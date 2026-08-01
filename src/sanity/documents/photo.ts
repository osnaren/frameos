import { defineField, defineType } from 'sanity'

const WORLD_OPTIONS = [
  { title: 'Wander', value: 'wander' },
  { title: 'Sacred Geometry', value: 'sacred-geometry' },
  { title: 'Small Wonders', value: 'small-wonders' },
  { title: 'Living Things', value: 'living-things' },
  { title: 'Table Notes', value: 'at-the-table' },
]

export const photoType = defineType({
  name: 'photo',
  title: 'Photo',
  type: 'document',
  groups: [
    { name: 'editorial', title: 'Editorial', default: true },
    { name: 'capture', title: 'Capture data' },
    { name: 'organization', title: 'Organization' },
  ],
  fields: [
    defineField({
      name: 'image',
      title: 'Photograph',
      type: 'image',
      group: 'editorial',
      options: {
        hotspot: true,
        metadata: ['exif', 'location', 'palette', 'lqip', 'blurhash'],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      description: 'Used in the photo\u2019s public URL: /photos/<slug>.',
      type: 'slug',
      group: 'editorial',
      options: { source: 'title', maxLength: 96 },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      group: 'editorial',
      validation: (rule) => rule.required().max(100),
    }),
    defineField({
      name: 'alt',
      title: 'Alternative text',
      description: 'Describe the image for someone who cannot see it. Required to publish.',
      type: 'string',
      group: 'editorial',
      validation: (rule) => rule.required().max(220),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'Longer editorial context shown on the individual photo page.',
      type: 'text',
      rows: 5,
      group: 'editorial',
    }),
    defineField({
      name: 'caption',
      title: 'Caption',
      type: 'text',
      rows: 3,
      group: 'editorial',
    }),
    defineField({
      name: 'archived',
      title: 'Archived',
      description: 'Hide this photo from every public page without deleting it.',
      type: 'boolean',
      initialValue: false,
      group: 'organization',
    }),
    defineField({
      name: 'world',
      title: 'World',
      type: 'string',
      group: 'organization',
      options: { list: WORLD_OPTIONS, layout: 'radio' },
    }),
    defineField({
      name: 'series',
      title: 'Series',
      type: 'string',
      group: 'organization',
    }),
    defineField({
      name: 'locationLabel',
      title: 'Location',
      type: 'string',
      group: 'organization',
    }),
    defineField({
      name: 'tags',
      title: 'Tags',
      type: 'array',
      of: [{ type: 'string' }],
      options: { layout: 'tags' },
      group: 'organization',
    }),
    defineField({
      name: 'captureDate',
      title: 'Capture date',
      description: 'Auto-extracted from EXIF when present; override here if needed.',
      type: 'datetime',
      group: 'capture',
    }),
    defineField({
      name: 'camera',
      title: 'Camera',
      description: 'Auto-extracted from EXIF when present; override here if needed.',
      type: 'string',
      group: 'capture',
    }),
    defineField({
      name: 'lens',
      title: 'Lens',
      type: 'string',
      group: 'capture',
    }),
    defineField({
      name: 'focalLength',
      title: 'Focal length',
      type: 'string',
      group: 'capture',
    }),
    defineField({
      name: 'iso',
      title: 'ISO',
      type: 'string',
      group: 'capture',
    }),
    defineField({
      name: 'shutterSpeed',
      title: 'Shutter speed',
      type: 'string',
      group: 'capture',
    }),
    defineField({
      name: 'aperture',
      title: 'Aperture',
      type: 'string',
      group: 'capture',
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort order',
      type: 'number',
      group: 'organization',
      initialValue: 0,
      validation: (rule) => rule.integer(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'world',
      media: 'image',
      archived: 'archived',
    },
    prepare({ title, subtitle, media, archived }) {
      return {
        title: title || 'Untitled photo',
        subtitle: [subtitle, archived ? 'archived' : undefined].filter(Boolean).join(' · '),
        media,
      }
    },
  },
})
