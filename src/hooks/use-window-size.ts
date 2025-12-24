// Custom hook for window size with debouncing

import { useState, useEffect, useMemo } from 'react';

interface WindowSize {
  width: number;
  height: number;
}

export function useWindowSize(): WindowSize {
  const [windowSize, setWindowSize] = useState<WindowSize>({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? window.innerHeight : 1080
  });

  useEffect(() => {
    let timeoutId: ReturnType<typeof setTimeout>;

    const handleResize = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        setWindowSize({
          width: window.innerWidth,
          height: window.innerHeight
        });
      }, 100); // Debounce by 100ms
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
    };
  }, []);

  return windowSize;
}

// Hook to calculate max comparisons based on screen width
export function useMaxComparisons(userLimit: number | null = null): number {
  const { width: screenWidth } = useWindowSize();

  const screenMaxComparisons = useMemo(() => {
    const metricColumnWidth = 160;
    const comparisonColumnWidth = 230;
    const padding = 150;
    const availableWidth = screenWidth - metricColumnWidth - padding;
    const calculated = Math.floor(availableWidth / comparisonColumnWidth);
    return Math.max(2, Math.min(24, calculated));
  }, [screenWidth]);

  const maxComparisons = userLimit !== null
    ? Math.min(userLimit, screenMaxComparisons)
    : Math.min(6, screenMaxComparisons);

  return maxComparisons;
}
