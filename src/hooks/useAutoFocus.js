import { useEffect, useRef } from 'react';

/** Focuses the referenced element once on mount (a lint-friendly alternative to autoFocus). */
export function useAutoFocus() {
  const ref = useRef(null);
  useEffect(() => {
    ref.current?.focus();
  }, []);
  return ref;
}
