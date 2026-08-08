import ImageIcon from '@sanity/icons/Image'
import {defineField, defineType} from 'sanity'

export const photoType = defineType({
  name: 'photo',
  title: 'Photo',
  type: 'document',
  icon: ImageIcon,
  groups: [
    {name: 'editorial', title: 'Editorial', default: true},
    {name: 'capture', title: 'Capture data'},
    {name: 'organization', title: 'Organization'},
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
      options: {source: 'title', maxLength: 96},
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
      name: 'worldRef',
      title: 'World',
      description: 'The collection this photograph belongs to.',
      type: 'reference',
      to: [{type: 'world'}],
      group: 'organization',
      validation: (rule) =>
        rule.custom((value, context) =>
          value || context.document?.world ? true : 'Select a world before publishing.',
        ),
    }),
    defineField({
      name: 'world',
      title: 'World slug (legacy)',
      description: 'Preserved while existing documents move to the World reference above.',
      type: 'string',
      group: 'organization',
      deprecated: {reason: 'Use the World reference. This value remains available for migration.'},
      readOnly: true,
      hidden: ({value}) => value === undefined,
      initialValue: undefined,
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
      of: [{type: 'string'}],
      options: {layout: 'tags'},
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
      worldTitle: 'worldRef.name',
      media: 'image',
      archived: 'archived',
    },
    prepare({title, subtitle, worldTitle, media, archived}) {
      return {
        title: title || 'Untitled photo',
        subtitle: [worldTitle || subtitle, archived ? 'archived' : undefined]
          .filter(Boolean)
          .join(' \u00b7 '),
        media,
      }
    },
  },
})
