import React from 'react';
import { Helmet } from 'react-helmet-async';
import { motion } from 'framer-motion';

export default function About() {
  return (
    <>
      <Helmet>
        <title>About | PhotoFolio</title>
        <meta name="description" content="Learn about my photography journey" />
      </Helmet>
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="prose prose-lg max-w-none"
        >
          <h1 className="text-4xl font-bold mb-8">About Me</h1>
          <div className="grid md:grid-cols-2 gap-8 items-center mb-12">
            <img src="/photographer.jpg" alt="Photographer" className="rounded-lg shadow-lg" />
            <div>
              <p className="text-gray-600">
                With over a decade of experience in photography, I've developed a passion for capturing the essence of
                moments that tell compelling stories. My journey began with a simple point-and-shoot camera and has
                evolved into a professional career that has taken me across the globe.
              </p>
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-4">My Journey</h2>
          <p className="text-gray-600 mb-6">
            What started as a hobby quickly turned into a lifelong passion. I've had the privilege of working with
            amazing clients and capturing countless special moments. From intimate weddings to vast landscapes, each
            photo tells its own unique story.
          </p>
          <h2 className="text-2xl font-bold mb-4">My Approach</h2>
          <p className="text-gray-600 mb-6">
            I believe in creating authentic, timeless images that capture genuine emotions and natural beauty. My style
            combines technical expertise with artistic vision, resulting in photographs that are both beautiful and
            meaningful.
          </p>
        </motion.div>
      </div>
    </>
  );
}
