import useSWR from 'swr';
import { getAboutContent } from '@lib/contentful/about';
import type { AboutContent } from '@ctypes/about';

export function useAboutContent() {
  const { data, error, isLoading } = useSWR<AboutContent>('about', getAboutContent);

  return {
    content: data,
    isLoading,
    error,
  };
}
