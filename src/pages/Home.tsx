import React from 'react';
import { Helmet } from 'react-helmet-async';
import Hero from '@components/home/Hero';
import FeaturedSlider from '@components/home/FeaturedSlider';
import DynamicGrid from '@components/home/DynamicGrid';
import { useLenis } from '@hooks/useLenis';

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
        <FeaturedSlider />
        <DynamicGrid />
      </main>
    </>
  );
}
