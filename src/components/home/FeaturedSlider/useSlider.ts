import { useCallback, useEffect, useState } from 'react';

export function useSlider(length: number) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const next = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % length);
  }, [length]);

  const prev = useCallback(() => {
    setCurrentIndex((previous) => (previous - 1 + length) % length);
  }, [length]);

  const pause = () => setIsPaused(true);
  const resume = () => setIsPaused(false);

  useEffect(() => {
    if (isPaused) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [isPaused, next]);

  return { currentIndex, next, prev, pause, resume };
}
