import { useState, useEffect } from 'react';

/**
 * Debounces a value — only updates after `delay` ms of no changes.
 * Prevents excessive API calls on rapid input.
 */
export function useDebounce(value, delay = 400) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);

  return debounced;
}
