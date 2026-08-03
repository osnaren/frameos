import { defineField, defineType } from 'sanity'

export const ctaType = defineType({
  name: 'cta',
  title: 'Call to action',
  type: 'object',
  fields: [
    defineField({
      name: 'label',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'href',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
  ],
})
