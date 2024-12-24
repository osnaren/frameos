import type { General } from '@ctypes/contentful';
import useSWR from 'swr';

import { getGeneralById } from '../lib/contentful';

export function useHomeHero() {
  const { data, error, isLoading } = useSWR<General>(['general', 'home-hero'], () => getGeneralById('home-hero'));

  return {
    photos: data || [],
    isLoading,
    error,
  };
}
