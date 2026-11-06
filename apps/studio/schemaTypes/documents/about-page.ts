import {defineField, defineType} from 'sanity'

export const aboutPageType = defineType({
  name: 'aboutPage',
  title: 'About page',
  type: 'document',
  fields: [
    defineField({
      name: 'headline',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'body',
      type: 'array',
      of: [{type: 'text'}],
      validation: (rule) => rule.required().min(1),
    }),
    defineField({
      name: 'photoHighlights',
      type: 'array',
      of: [{type: 'reference', to: [{type: 'photo'}]}],
      validation: (rule) => rule.required().min(1).max(6),
    }),
    defineField({
      name: 'seo',
      type: 'seo',
      validation: (rule) => rule.required(),
    }),
  ],
})
