import { useDrawAnimation } from '@hooks/useDrawAnimation';
import { motion } from 'framer-motion';
import React, { useState } from 'react';

import { iconAnimation } from './animations';

const socialLinks = [
  {
    name: 'Instagram',
    href: 'https://instagram.com/osnaren',
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" fill="currentColor" {...props}>
        <path d="M 11.46875 5 C 7.917969 5 5 7.914063 5 11.46875 L 5 20.53125 C 5 24.082031 7.914063 27 11.46875 27 L 20.53125 27 C 24.082031 27 27 24.085938 27 20.53125 L 27 11.46875 C 27 7.917969 24.085938 5 20.53125 5 Z M 11.46875 7 L 20.53125 7 C 23.003906 7 25 8.996094 25 11.46875 L 25 20.53125 C 25 23.003906 23.003906 25 20.53125 25 L 11.46875 25 C 8.996094 25 7 23.003906 7 20.53125 L 7 11.46875 C 7 8.996094 8.996094 7 11.46875 7 Z M 21.90625 9.1875 C 21.402344 9.1875 21 9.589844 21 10.09375 C 21 10.597656 21.402344 11 21.90625 11 C 22.410156 11 22.8125 10.597656 22.8125 10.09375 C 22.8125 9.589844 22.410156 9.1875 21.90625 9.1875 Z M 16 10 C 12.699219 10 10 12.699219 10 16 C 10 19.300781 12.699219 22 16 22 C 19.300781 22 22 19.300781 22 16 C 22 12.699219 19.300781 10 16 10 Z M 16 12 C 18.222656 12 20 13.777344 20 16 C 20 18.222656 18.222656 20 16 20 C 13.777344 20 12 18.222656 12 16 C 12 13.777344 13.777344 12 16 12 Z" />
      </svg>
    ),
  },
  {
    name: 'X',
    href: 'https://x.com/osnaren',
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" fill="currentColor" {...props}>
        <path d="M 4.0175781 4 L 13.091797 17.609375 L 4.3359375 28 L 6.9511719 28 L 14.246094 19.34375 L 20.017578 28 L 20.552734 28 L 28.015625 28 L 18.712891 14.042969 L 27.175781 4 L 24.560547 4 L 17.558594 12.310547 L 12.017578 4 L 4.0175781 4 z M 7.7558594 6 L 10.947266 6 L 24.279297 26 L 21.087891 26 L 7.7558594 6 z" />
      </svg>
    ),
  },
  {
    name: 'GitHub',
    href: 'https://github.com/osnaren',
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" fill="currentColor" {...props}>
        <path
          fillRule="evenodd"
          d="M 16 4 C 9.371094 4 4 9.371094 4 16 C 4 21.300781 7.4375 25.800781 12.207031 27.386719 C 12.808594 27.496094 13.027344 27.128906 13.027344 26.808594 C 13.027344 26.523438 13.015625 25.769531 13.011719 24.769531 C 9.671875 25.492188 8.96875 23.160156 8.96875 23.160156 C 8.421875 21.773438 7.636719 21.402344 7.636719 21.402344 C 6.546875 20.660156 7.71875 20.675781 7.71875 20.675781 C 8.921875 20.761719 9.554688 21.910156 9.554688 21.910156 C 10.625 23.746094 12.363281 23.214844 13.046875 22.910156 C 13.15625 22.132813 13.46875 21.605469 13.808594 21.304688 C 11.144531 21.003906 8.34375 19.972656 8.34375 15.375 C 8.34375 14.0625 8.8125 12.992188 9.578125 12.152344 C 9.457031 11.851563 9.042969 10.628906 9.695313 8.976563 C 9.695313 8.976563 10.703125 8.65625 12.996094 10.207031 C 13.953125 9.941406 14.980469 9.808594 16 9.804688 C 17.019531 9.808594 18.046875 9.941406 19.003906 10.207031 C 21.296875 8.65625 22.300781 8.976563 22.300781 8.976563 C 22.957031 10.628906 22.546875 11.851563 22.421875 12.152344 C 23.191406 12.992188 23.652344 14.0625 23.652344 15.375 C 23.652344 19.984375 20.847656 20.996094 18.175781 21.296875 C 18.605469 21.664063 18.988281 22.398438 18.988281 23.515625 C 18.988281 25.121094 18.976563 26.414063 18.976563 26.808594 C 18.976563 27.128906 19.191406 27.503906 19.800781 27.386719 C 24.566406 25.796875 28 21.300781 28 16 C 28 9.371094 22.628906 4 16 4 Z"
        />
      </svg>
    ),
  },
  {
    name: 'LinkedIn',
    href: 'https://linkedin.com/in/osnaren',
    icon: (props: React.SVGProps<SVGSVGElement>) => (
      <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" viewBox="0 0 32 32" fill="currentColor" {...props}>
        <path d="M 8.6425781 4 C 7.1835781 4 6 5.181625 6 6.640625 C 6 8.099625 7.182625 9.3085938 8.640625 9.3085938 C 10.098625 9.3085938 11.283203 8.099625 11.283203 6.640625 C 11.283203 5.182625 10.101578 4 8.6425781 4 z M 21.535156 11 C 19.316156 11 18.0465 12.160453 17.4375 13.314453 L 17.373047 13.314453 L 17.373047 11.310547 L 13 11.310547 L 13 26 L 17.556641 26 L 17.556641 18.728516 C 17.556641 16.812516 17.701266 14.960938 20.072266 14.960938 C 22.409266 14.960937 22.443359 17.145609 22.443359 18.849609 L 22.443359 26 L 26.994141 26 L 27 26 L 27 17.931641 C 27 13.983641 26.151156 11 21.535156 11 z M 6.3632812 11.310547 L 6.3632812 26 L 10.923828 26 L 10.923828 11.310547 L 6.3632812 11.310547 z" />
      </svg>
    ),
  },
];

function Corner({ className, isHovered }: { className: string; isHovered: boolean }) {
  const cornerRef = useDrawAnimation(isHovered);

  return <div ref={cornerRef} className={`absolute border-[var(--color-primary)] opacity-0 ${className}`} />;
}

export function SocialLinks() {
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  return (
    <div className="flex space-x-6">
      {socialLinks.map((item) => (
        <div
          key={item.name}
          className="relative"
          onMouseEnter={() => setHoveredItem(item.name)}
          onMouseLeave={() => setHoveredItem(null)}
        >
          <Corner className="border-t-2 border-l-2 left-[-4px] top-[-4px]" isHovered={hoveredItem === item.name} />
          <Corner className="border-b-2 border-r-2 right-[-4px] bottom-[-4px]" isHovered={hoveredItem === item.name} />
          <motion.a
            href={item.href}
            className="text-[var(--color-text)] hover:text-[var(--color-primary)] block"
            variants={iconAnimation}
            whileHover="hover"
            whileTap="tap"
            target="_blank"
            rel="noopener noreferrer"
          >
            <span className="sr-only">{item.name}</span>
            <item.icon className="h-6 w-6" aria-hidden="true" width={32} height={32} />
          </motion.a>
        </div>
      ))}
    </div>
  );
}
