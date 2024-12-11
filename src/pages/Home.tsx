import React from 'react';
import { Helmet } from 'react-helmet-async';
import FeaturedCarousel from '../components/home/FeaturedCarousel';
import Photographer from '../components/home/Photographer';

export default function Home() {
  return (
    <>
      <Helmet>
        <title>PhotoFolio | Professional Photography Portfolio</title>
        <meta
          name="description"
          content="Welcome to my photography portfolio showcasing professional photography across various genres including portraits, landscapes, and street photography."
        />
      </Helmet>

      <main>
        <FeaturedCarousel />
        <Photographer />
      </main>
    </>
  );
}