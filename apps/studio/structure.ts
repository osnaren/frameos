import type {StructureResolver} from 'sanity/structure'

/**
 * Documents that exist exactly once. Pinned to a single fixed node in the
 * desk structure (no "create new" duplicates) and stripped of the
 * delete/duplicate actions in sanity.config.ts so there is always exactly
 * one of each.
 */
export const SINGLETON_TYPES = ['siteSettings', 'homePage', 'aboutPage', 'contactPage'] as const

export function isSingletonType(schemaType: string) {
  return (SINGLETON_TYPES as readonly string[]).includes(schemaType)
}

export const structure: StructureResolver = (S) =>
  S.list()
    .title('Content')
    .items([
      S.listItem()
        .title('Site settings')
        .id('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.listItem()
        .title('Home page')
        .id('homePage')
        .child(S.document().schemaType('homePage').documentId('homePage')),
      S.listItem()
        .title('About page')
        .id('aboutPage')
        .child(S.document().schemaType('aboutPage').documentId('aboutPage')),
      S.listItem()
        .title('Contact page')
        .id('contactPage')
        .child(S.document().schemaType('contactPage').documentId('contactPage')),
      S.divider(),
      ...S.documentTypeListItems().filter((item) => !isSingletonType(item.getId() ?? '')),
    ])
