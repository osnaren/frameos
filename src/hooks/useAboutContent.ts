import type { AboutContent } from '@/types/about';
import { getAboutContent } from '@lib/contentful/about';
import useSWR from 'swr';

export function useAboutContent() {
  const { data, error, isLoading } = useSWR<AboutContent>('about', getAboutContent);

  return {
    content: data,
    isLoading,
    error,
  };
}
