import { aboutPageType } from '@/sanity/documents/about-page'
import { contactPageType } from '@/sanity/documents/contact-page'
import { homePageType } from '@/sanity/documents/home-page'
import { siteSettingsType } from '@/sanity/documents/site-settings'
import { cloudinaryAssetRefType } from '@/sanity/objects/cloudinary-asset-ref'
import { ctaType } from '@/sanity/objects/cta'
import { seoType } from '@/sanity/objects/seo'
import { socialLinkType } from '@/sanity/objects/social-link'

export const schemaTypes = [
  siteSettingsType,
  homePageType,
  aboutPageType,
  contactPageType,
  seoType,
  socialLinkType,
  ctaType,
  cloudinaryAssetRefType,
]
