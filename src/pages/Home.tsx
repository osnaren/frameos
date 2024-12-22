import AboutNumbers from '@components/home/AboutNumbers/AboutNumbers';
import CTASection from '@components/home/CtaSection/CtaSection';
import FeaturedSlider from '@components/home/FeaturedSlider/FeaturedSlider';
import Hero from '@components/home/Hero';
import { useLenis } from '@hooks/useLenis';
import { Helmet } from 'react-helmet-async';

export default function Home() {
  useLenis();

  return (
    <>
      <Helmet>
        <title>PhotoFolio | Professional Photography Portfolio</title>
        <meta
          name="description"
          content="Welcome to my photography portfolio showcasing professional photography across various genres including portraits, landscapes, and street photography."
        />
      </Helmet>

      <main className="overflow-hidden">
        <Hero />
        <AboutNumbers />
        <FeaturedSlider />
        <CTASection />
      </main>
    </>
  );
}
