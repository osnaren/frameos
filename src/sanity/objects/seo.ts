import { defineField, defineType } from 'sanity'

export const seoType = defineType({
  name: 'seo',
  title: 'SEO',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required().max(180),
    }),
    defineField({
      name: 'imagePublicId',
      type: 'string',
      description: 'Optional photo slug to use for OG image generation.',
    }),
  ],
})
