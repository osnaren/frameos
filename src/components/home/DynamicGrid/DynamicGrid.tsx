import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const categories = [
  { name: 'Nature', image: '/nature.jpg' },
  { name: 'Urban', image: '/urban.jpg' },
  { name: 'Portrait', image: '/portrait.jpg' },
  { name: 'Travel', image: '/travel.jpg' },
  { name: 'Architecture', image: '/architecture.jpg' },
  { name: 'Street', image: '/street.jpg' },
];

export default function DynamicGrid() {
  const gridRef = useRef<HTMLDivElement>(null);
  const itemsRef = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    if (!gridRef.current) return;

    const items = itemsRef.current.filter(Boolean);

    items.forEach((item, index) => {
      gsap.fromTo(
        item,
        {
          opacity: 0,
          y: 50,
          rotateX: -15,
        },
        {
          opacity: 1,
          y: 0,
          rotateX: 0,
          duration: 1,
          ease: 'power3.out',
          scrollTrigger: {
            trigger: item,
            start: 'top bottom-=100',
            end: 'bottom center',
            toggleActions: 'play none none reverse',
          },
          delay: index * 0.2,
        }
      );
    });

    return () => {
      ScrollTrigger.getAll().forEach((trigger) => trigger.kill());
    };
  }, []);

  return (
    <section ref={gridRef} className="py-24 bg-[var(--color-background)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {categories.map((category, index) => (
            <div
              key={category.name}
              ref={(el) => (itemsRef.current[index] = el)}
              className="aspect-square relative rounded-lg overflow-hidden cursor-pointer transform-gpu"
            >
              <motion.div whileHover={{ scale: 1.05 }} className="absolute inset-0">
                <div className="absolute inset-0 bg-gradient-to-br from-black/50 to-transparent" />
                <img src={category.image} alt={category.name} className="w-full h-full object-cover" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h3 className="text-2xl md:text-3xl font-bold text-white">{category.name}</h3>
                </div>
              </motion.div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
