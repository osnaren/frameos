import { useEffect } from 'react';

export function usePreventImageDownload() {
  useEffect(() => {
    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('keydown', (e) => {
      if (e.key === 'PrintScreen') {
        preventDefault(e);
      }
      if (e.ctrlKey && (e.key === 'c' || e.key === 'C')) {
        preventDefault(e);
      }
    });

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
    };
  }, []);
}
