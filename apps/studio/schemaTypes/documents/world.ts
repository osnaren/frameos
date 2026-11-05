import EarthGlobeIcon from '@sanity/icons/EarthGlobe'
import {defineField, defineType} from 'sanity'

const hexColor = /^#[0-9a-f]{6}$/i

export const worldType = defineType({
  name: 'world',
  title: 'World',
  type: 'document',
  icon: EarthGlobeIcon,
  groups: [
    {name: 'editorial', title: 'Editorial', default: true},
    {name: 'organization', title: 'Organization'},
    {name: 'atmosphere', title: 'Atmosphere'},
  ],
  fields: [
    defineField({
      name: 'name',
      title: 'Name',
      type: 'string',
      group: 'editorial',
      validation: (rule) => rule.required().max(64),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      description: 'Used in the public URL: /worlds/<slug>.',
      type: 'slug',
      group: 'editorial',
      options: {source: 'name', maxLength: 72},
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'line',
      title: 'One-line statement',
      description: 'The short thought that introduces this collection.',
      type: 'string',
      group: 'editorial',
      validation: (rule) => rule.required().max(140),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      description: 'Optional context used by search, sharing, and future collection views.',
      type: 'text',
      rows: 3,
      group: 'editorial',
      validation: (rule) => rule.max(320),
    }),
    defineField({
      name: 'heroPhoto',
      title: 'Lead photograph',
      description: 'The representative frame for navigation and sharing surfaces.',
      type: 'reference',
      to: [{type: 'photo'}],
      group: 'editorial',
    }),
    defineField({
      name: 'status',
      title: 'Visibility',
      type: 'string',
      initialValue: 'active',
      group: 'organization',
      options: {
        layout: 'radio',
        list: [
          {title: 'Active', value: 'active'},
          {title: 'Hidden', value: 'hidden'},
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sortOrder',
      title: 'Navigation order',
      description: 'Lower numbers appear first in world navigation and filters.',
      type: 'number',
      initialValue: 100,
      group: 'organization',
      validation: (rule) => rule.required().integer().min(0),
    }),
    defineField({
      name: 'form',
      title: 'Model form',
      description:
        'Which miniature landform this world is built on. The three tones below colour it; ' +
        'this decides its shape, its destination and what is scattered across it. Leave empty ' +
        'and the world appears in the index and its own collection, but has no scene on the ' +
        'home journey.',
      type: 'string',
      group: 'atmosphere',
      options: {
        list: [
          {title: 'Coast — headland and lighthouse', value: 'coast'},
          {title: 'Plateau — a stepped mesa and a temple', value: 'plateau'},
          {title: 'Basin — a shallow bowl and a lens', value: 'basin'},
          {title: 'Wetland — braided channels and a hide', value: 'wetland'},
          {title: 'Table — a cloth and a place laid', value: 'table'},
        ],
      },
    }),
    defineField({
      name: 'mood',
      title: 'Photographic atmosphere',
      description: 'A restrained three-tone palette sampled or art-directed for this world.',
      type: 'object',
      group: 'atmosphere',
      fields: [
        defineField({
          name: 'wash',
          title: 'Ambient wash',
          type: 'string',
          validation: (rule) => rule.required().regex(hexColor, {name: 'hex color', invert: false}),
        }),
        defineField({
          name: 'deep',
          title: 'Depth tone',
          type: 'string',
          validation: (rule) => rule.required().regex(hexColor, {name: 'hex color', invert: false}),
        }),
        defineField({
          name: 'accent',
          title: 'Focus accent',
          type: 'string',
          validation: (rule) => rule.required().regex(hexColor, {name: 'hex color', invert: false}),
        }),
      ],
      validation: (rule) => rule.required(),
    }),
    defineField({name: 'seo', title: 'Search and sharing', type: 'seo', group: 'editorial'}),
  ],
  orderings: [
    {
      title: 'Navigation order',
      name: 'navigationOrder',
      by: [
        {field: 'sortOrder', direction: 'asc'},
        {field: 'name', direction: 'asc'},
      ],
    },
  ],
  preview: {
    select: {title: 'name', subtitle: 'line', media: 'heroPhoto.image', status: 'status'},
    prepare({title, subtitle, media, status}) {
      return {
        title: title || 'Untitled world',
        subtitle: [status === 'hidden' ? 'Hidden' : undefined, subtitle]
          .filter(Boolean)
          .join(' · '),
        media,
      }
    },
  },
})
