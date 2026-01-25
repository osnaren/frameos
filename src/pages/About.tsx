import ContentSection from '@components/about/ContentSection';
import Hero from '@components/about/Hero';
import ImageGrid from '@components/about/ImageGrid';
import { useAboutContent } from '@hooks/useAboutContent';
import { useLenis } from '@hooks/useLenis';
import { motion } from 'framer-motion';

export default function About() {
  useLenis();
  const { content, isLoading, error } = useAboutContent();

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <p className="text-red-500">Failed to load content. Please try again later.</p>
      </div>
    );
  }

  if (isLoading || !content) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <title>About | PhotoFolio</title>
      <meta name="description" content="Learn about my photography journey and approach" />

      <div className="min-h-screen">
        <Hero />

        <motion.div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <ContentSection title={content.journeyTitle} content={content.journeyContent} />

          <ImageGrid images={content.images} />

          <ContentSection title={content.approachTitle} content={content.approachContent} align="right" />
        </motion.div>
      </div>
    </>
  );
}
