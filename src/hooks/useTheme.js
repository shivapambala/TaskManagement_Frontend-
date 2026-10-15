import { useCallback, useState } from 'react';
import { storage } from '../utils/storage';

export function useTheme() {
  const [theme, setTheme] = useState(() => document.documentElement.dataset.theme || 'light');

  const toggle = useCallback(() => {
    setTheme((current) => {
      const next = current === 'dark' ? 'light' : 'dark';
      document.documentElement.dataset.theme = next;
      storage.set('tf.theme', next);
      return next;
    });
  }, []);

  return [theme, toggle];
}
