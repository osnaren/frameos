import { motion } from 'framer-motion';
import gsap from 'gsap';
import { useEffect, useRef } from 'react';

export default function HeroText() {
  const containerRef = useRef<HTMLSpanElement>(null);
  const cycleCount = useRef(0);
  const mainTimeline = useRef<gsap.core.Timeline | null>(null);

  useEffect(() => {
    const texts = ['FrameOS', 'FrāmēÖS'];
    let currentIndex = 0;

    const createLetterSpans = (text: string) => {
      if (!containerRef.current) return null;
      containerRef.current.innerHTML = '';

      const letters = text.split('').map((letter) => {
        const span = document.createElement('span');
        span.textContent = letter;
        span.style.opacity = '0';
        containerRef.current?.appendChild(span);
        return span;
      });

      return letters;
    };

    const animateSequence = () => {
      if (!containerRef.current) return null;

      const text = texts[currentIndex];
      const letters = createLetterSpans(text);

      if (!letters) return null;

      const tl = gsap.timeline();

      tl.to(letters as gsap.TweenTarget, {
        opacity: 1,
        duration: 0.5,
        stagger: {
          each: 0.1,
          ease: 'power1.inOut',
        },
      })
        .to(letters as gsap.TweenTarget, {
          opacity: 1,
          duration: 1.5,
        })
        .to(
          letters as gsap.TweenTarget,
          {
            opacity: 0,
            duration: 0.5,
            stagger: {
              each: 0.1,
              ease: 'power1.inOut',
            },
            onComplete: () => {
              if (cycleCount.current >= 3) {
                // Final animation
                const finalLetters = createLetterSpans('FrameOS');
                if (finalLetters && containerRef.current) {
                  gsap.to(finalLetters as gsap.TweenTarget, {
                    opacity: 1,
                    duration: 0.5,
                    stagger: {
                      each: 0.1,
                      ease: 'power1.inOut',
                    },
                  });
                }
              } else {
                currentIndex = (currentIndex + 1) % texts.length;
                cycleCount.current++;
                const nextSequence = animateSequence();
                if (nextSequence) {
                  nextSequence.play();
                }
              }
            },
          },
          '+=0.5'
        );

      return tl;
    };

    const initAnimation = () => {
      const sequence = animateSequence();
      if (!sequence) return;

      mainTimeline.current = sequence;
    };

    initAnimation();

    return () => {
      if (mainTimeline.current) {
        mainTimeline.current.kill();
      }
    };
  }, []);

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
      <motion.h1
        initial={{ opacity: 0, y: -50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="flex items-center justify-center gap-3 text-4xl font-bold text-white sm:text-5xl md:text-6xl lg:text-7xl"
      >
        <span>Welcome to</span>
        <span ref={containerRef} className="inline-flex min-w-[200px] justify-start" />
      </motion.h1>
      <motion.p
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, ease: 'easeOut', delay: 0.3 }}
        className="mt-4 rounded-[10px] border border-white/20 bg-white/10 px-5 py-2.5 text-lg text-gray-300 backdrop-blur-[10px] sm:text-xl md:text-2xl"
      >
        Discover the world through breathtaking photography.
      </motion.p>
    </div>
  );
}
