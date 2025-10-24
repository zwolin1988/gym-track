import { useState, useEffect } from "react";

/**
 * Custom hook do debounce warto[ci
 * Opóznia aktualizacj warto[ci o podany czas
 * @param value - Warto[ do zdebounce'owania
 * @param delay - Opóznienie w milisekundach
 * @returns Zdebounce'owana warto[
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
