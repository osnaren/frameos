import {defineField, defineType} from 'sanity'

export const contactPageType = defineType({
  name: 'contactPage',
  title: 'Contact page',
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
      name: 'email',
      type: 'string',
    }),
    defineField({
      name: 'socials',
      type: 'array',
      of: [{type: 'socialLink'}],
    }),
    defineField({
      name: 'seo',
      type: 'seo',
      validation: (rule) => rule.required(),
    }),
  ],
})
