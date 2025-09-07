import { useCallback, useEffect } from 'react';
import { performanceMonitor } from '../utils/performance';

// React hook for performance monitoring
export function usePerformanceMonitor() {
  const startTiming = useCallback((name: string, metadata?: Record<string, any>) => {
    performanceMonitor.startTiming(name, metadata);
  }, []);

  const endTiming = useCallback((name: string) => {
    performanceMonitor.endTiming(name);
  }, []);

  const measureComponent = useCallback((componentName: string) => {
    useEffect(() => {
      performanceMonitor.startTiming(`${componentName} mount`);
      return () => {
        performanceMonitor.endTiming(`${componentName} mount`);
      };
    }, [componentName]);
  }, []);

  return {
    startTiming,
    endTiming,
    measureComponent,
    getMetrics: () => performanceMonitor.getMetrics(),
  };
}

export default usePerformanceMonitor;