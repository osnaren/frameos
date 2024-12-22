import useSWR from 'swr';

import { getAllPhotos, getFeaturedPhotos, getPhotoByEntryId, getPhotosByCategory } from '../lib/contentful';
import type { Photo } from '../types/photo';

export function useAllPhotos() {
  const { data, error, isLoading } = useSWR<Photo[]>('photos', getAllPhotos);

  return {
    photos: data || [],
    isLoading,
    error,
  };
}

export function useFeaturedPhotos() {
  const { data, error, isLoading } = useSWR<Photo[]>('featured-photos', getFeaturedPhotos);

  return {
    photos: data || [],
    isLoading,
    error,
  };
}

export function usePhotosByCategory(category: string) {
  const { data, error, isLoading } = useSWR<Photo[]>(['photos', category], () => getPhotosByCategory(category));

  return {
    photos: data || [],
    isLoading,
    error,
  };
}

export function usePhotoById(id: string) {
  const { data, error, isLoading } = useSWR<Photo | null>(id, () => getPhotoByEntryId(id));

  return {
    photo: data,
    isLoading,
    error,
  };
}
