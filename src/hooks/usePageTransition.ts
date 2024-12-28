import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

export function usePageTransition() {
  const location = useLocation();

  useEffect(() => {
    // Scroll to top on page change
    window.scrollTo(0, 0);

    // Preload images for the next page
    const preloadImages = () => {
      const images = document.querySelectorAll('img[data-src]');
      images.forEach((img) => {
        if (img instanceof HTMLImageElement) {
          const dataSrc = img.dataset.src;
          if (dataSrc) {
            // Safely set the src attribute using native DOM method
            img.setAttribute('src', dataSrc);
            // Remove the data-src attribute after setting
            img.removeAttribute('data-src');
          }
        }
      });
    };

    // Execute preload after a short delay to prioritize critical resources
    const timeoutId = setTimeout(preloadImages, 300);

    return () => clearTimeout(timeoutId);
  }, [location.pathname]);
}
