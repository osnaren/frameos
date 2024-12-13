import { useState } from 'react';

export function useSlider(length: number) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const next = () => {
    setCurrentIndex((prev) => (prev + 1) % length);
  };

  const prev = () => {
    setCurrentIndex((prev) => (prev - 1 + length) % length);
  };

  return { currentIndex, next, prev };
}
