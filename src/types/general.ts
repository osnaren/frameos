export enum GeneralContentType {
  HOME_HERO = 'home-hero',
  SITE_CONFIG = 'site-config',
}

// Base interface for all general content
export interface BaseGeneralContent {
  readonly _type: GeneralContentType;
}

export interface HomeHeroData extends BaseGeneralContent {
  readonly _type: GeneralContentType.HOME_HERO;
  heroTitle: string;
  heroTagline: string;
  heroImageId: string;
}

export interface SiteConfigData extends BaseGeneralContent {
  readonly _type: GeneralContentType.SITE_CONFIG;
  siteName: string;
  description: string;
  socialLinks?: {
    platform: string;
    url: string;
  }[];
}

export type GeneralDataType = {
  [GeneralContentType.HOME_HERO]: HomeHeroData;
  [GeneralContentType.SITE_CONFIG]: SiteConfigData;
};

export interface General<T extends GeneralContentType> {
  readonly id: T;
  readonly data: GeneralDataType[T];
}
