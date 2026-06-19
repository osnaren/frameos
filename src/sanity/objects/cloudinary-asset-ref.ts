import { defineField, defineType } from 'sanity'

export const cloudinaryAssetRefType = defineType({
  name: 'cloudinaryAssetRef',
  title: 'Cloudinary asset reference',
  type: 'object',
  fields: [
    defineField({
      name: 'asset',
      title: 'Cloudinary asset',
      type: 'cloudinary.asset',
      validation: (rule) => rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'asset.public_id',
      subtitle: 'asset.resource_type',
    },
  },
})
