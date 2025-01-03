import ContentSection from '@components/about/ContentSection';
import Hero from '@components/about/Hero';
import ImageGrid from '@components/about/ImageGrid';
import { useAboutContent } from '@hooks/useAboutContent';
import { useLenis } from '@hooks/useLenis';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';

export default function About() {
  useLenis();
  const { content, isLoading, error } = useAboutContent();

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-red-500">Failed to load content. Please try again later.</p>
      </div>
    );
  }

  if (isLoading || !content) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-[var(--color-primary)] border-t-transparent" />
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>About | PhotoFolio</title>
        <meta name="description" content="Learn about my photography journey and approach" />
      </Helmet>

      <div className="min-h-screen">
        <Hero />

        <motion.div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <ContentSection title={content.journeyTitle} content={content.journeyContent} />

          <ImageGrid images={content.images} />

          <ContentSection title={content.approachTitle} content={content.approachContent} align="right" />
        </motion.div>
      </div>
    </>
  );
}
