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
      name: 'cloudinary',
      title: 'Cloudinary image',
      type: 'cloudinaryAssetRef',
      group: 'editorial',
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
      description: 'Describe the image for someone who cannot see it.',
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
      name: 'captureDate',
      title: 'Capture date',
      type: 'datetime',
      group: 'capture',
    }),
    defineField({
      name: 'camera',
      title: 'Camera',
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
      media: 'cloudinary.asset',
      publicId: 'cloudinary.asset.public_id',
    },
    prepare({ title, subtitle, media, publicId }) {
      return {
        title: title || publicId || 'Untitled photo',
        subtitle: subtitle ? `${subtitle} · ${publicId ?? ''}` : publicId,
        media,
      }
    },
  },
})
