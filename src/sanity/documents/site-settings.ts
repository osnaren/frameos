import { defineField, defineType } from 'sanity'

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site settings',
  type: 'document',
  fields: [
    defineField({
      name: 'brandMark',
      type: 'string',
      description: 'Short mark used in compact UI areas.',
    }),
    defineField({
      name: 'title',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'location',
      type: 'string',
    }),
    defineField({
      name: 'email',
      type: 'string',
    }),
    defineField({
      name: 'socials',
      type: 'array',
      of: [{ type: 'socialLink' }],
    }),
    defineField({
      name: 'seo',
      type: 'seo',
      validation: (rule) => rule.required(),
    }),
  ],
})
