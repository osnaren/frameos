import { General, GeneralContentType } from '@ctypes/general';
import { getGeneralById } from '@lib/contentful/general';
import useSWR from 'swr';

export function useHomeHero() {
  const { data, error, isLoading } = useSWR<General<GeneralContentType.HOME_HERO> | null>(
    GeneralContentType.HOME_HERO,
    getGeneralById
  );

  return {
    data,
    isLoading,
    error,
  };
}

export function useGeneral<T extends GeneralContentType>(id: T) {
  const { data, error, isLoading } = useSWR<General<T> | null>(id, getGeneralById);

  return {
    data,
    isLoading,
    error,
  };
}
