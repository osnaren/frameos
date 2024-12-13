import { FONT_WEIGHTS, FONT_FAMILIES, TYPE_SCALE } from './constants';

export type FontWeight = (typeof FONT_WEIGHTS)[keyof typeof FONT_WEIGHTS];
export type FontFamily = (typeof FONT_FAMILIES)[keyof typeof FONT_FAMILIES];
export type TypeScale = (typeof TYPE_SCALE)[keyof typeof TYPE_SCALE];

export interface FontConfig {
  family: FontFamily;
  weight: FontWeight;
  size: TypeScale;
}
