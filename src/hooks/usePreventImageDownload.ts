import { useEffect } from 'react';

export function usePreventImageDownload() {
  useEffect(() => {
    const preventDefault = (e: Event) => {
      e.preventDefault();
    };

    const handleKeydown = (e: KeyboardEvent) => {
      if (e.key === 'PrintScreen' || (e.ctrlKey && (e.key === 'c' || e.key === 'C'))) {
        preventDefault(e);
      }
    };

    document.addEventListener('contextmenu', preventDefault);
    document.addEventListener('keydown', handleKeydown);
    document.addEventListener('dragstart', preventDefault);
    document.addEventListener('copy', preventDefault);

    return () => {
      document.removeEventListener('contextmenu', preventDefault);
      document.removeEventListener('keydown', handleKeydown);
      document.removeEventListener('dragstart', preventDefault);
      document.removeEventListener('copy', preventDefault);
    };
  }, []);
}
