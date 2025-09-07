// Performance monitoring and optimization utilities

interface PerformanceMetrics {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  metadata?: Record<string, any>;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetrics> = new Map();
  private observers: PerformanceObserver[] = [];

  constructor() {
    this.initializeObservers();
  }

  private initializeObservers() {
    // Observe navigation timing
    if ('PerformanceObserver' in window) {
      try {
        const navigationObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'navigation') {
              this.logNavigationMetrics(entry as PerformanceNavigationTiming);
            }
          });
        });
        navigationObserver.observe({ entryTypes: ['navigation'] });
        this.observers.push(navigationObserver);

        // Observe resource loading
        const resourceObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          entries.forEach((entry) => {
            if (entry.entryType === 'resource') {
              this.logResourceMetrics(entry as PerformanceResourceTiming);
            }
          });
        });
        resourceObserver.observe({ entryTypes: ['resource'] });
        this.observers.push(resourceObserver);

        // Observe largest contentful paint
        const lcpObserver = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          const lastEntry = entries[entries.length - 1];
          console.log('LCP:', lastEntry.startTime);
        });
        lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
        this.observers.push(lcpObserver);

        // Observe first input delay
        // Observe first input delay
const fidObserver = new PerformanceObserver((list) => {
  const entries = list.getEntries();
  entries.forEach((entry) => {
    // Cast to PerformanceEventTiming for FID entries
    const fidEntry = entry as PerformanceEventTiming;
    if (fidEntry.processingStart) {
      console.log('FID:', fidEntry.processingStart - fidEntry.startTime);
    }
  });
});
fidObserver.observe({ entryTypes: ['first-input'] });
this.observers.push(fidObserver);

      } catch (error) {
        console.warn('Performance observers not supported:', error);
      }
    }
  }

  private logNavigationMetrics(entry: PerformanceNavigationTiming) {
  const metrics = {
    'DNS Lookup': entry.domainLookupEnd - entry.domainLookupStart,
    'TCP Connection': entry.connectEnd - entry.connectStart,
    'TLS Handshake': entry.connectEnd - entry.secureConnectionStart,
    'Request': entry.responseStart - entry.requestStart,
    'Response': entry.responseEnd - entry.responseStart,
    'DOM Processing': entry.domComplete - entry.domContentLoadedEventStart, // Changed from domLoading
    'Load Complete': entry.loadEventEnd - entry.loadEventStart,
    'Total': entry.loadEventEnd - entry.fetchStart, // Changed from navigationStart
  };

  console.group('Navigation Performance Metrics');
  Object.entries(metrics).forEach(([name, value]) => {
    if (value > 0) {
      console.log(`${name}: ${value.toFixed(2)}ms`);
    }
  });
  console.groupEnd();
}

  private logResourceMetrics(entry: PerformanceResourceTiming) {
    // Only log slow resources (>100ms)
    if (entry.duration > 100) {
      console.log(`Slow resource: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
    }
  }

  // Start timing a custom operation
  startTiming(name: string, metadata?: Record<string, any>) {
    this.metrics.set(name, {
      name,
      startTime: performance.now(),
      metadata,
    });
  }

  // End timing a custom operation
  endTiming(name: string) {
    const metric = this.metrics.get(name);
    if (metric) {
      const endTime = performance.now();
      const duration = endTime - metric.startTime;
      
      metric.endTime = endTime;
      metric.duration = duration;
      
      console.log(`${name}: ${duration.toFixed(2)}ms`);
      
      // Log slow operations
      if (duration > 100) {
        console.warn(`Slow operation detected: ${name} (${duration.toFixed(2)}ms)`);
      }
    }
  }

  // Get all metrics
  getMetrics(): PerformanceMetrics[] {
    return Array.from(this.metrics.values());
  }

  // Clear all metrics
  clearMetrics() {
    this.metrics.clear();
  }

  // Cleanup observers
  destroy() {
    this.observers.forEach(observer => observer.disconnect());
    this.observers = [];
    this.metrics.clear();
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor();

// Utility functions for performance optimization
export const performanceUtils = {
  // Debounce function calls
  debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout;
    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  },

  // Throttle function calls
  throttle<T extends (...args: any[]) => any>(
    func: T,
    limit: number
  ): (...args: Parameters<T>) => void {
    let inThrottle: boolean;
    return (...args: Parameters<T>) => {
      if (!inThrottle) {
        func(...args);
        inThrottle = true;
        setTimeout(() => (inThrottle = false), limit);
      }
    };
  },

  // Measure function execution time
  measureExecution<T extends (...args: any[]) => any>(
    func: T,
    name?: string
  ): T {
    return ((...args: Parameters<T>) => {
      const functionName = name || func.name || 'anonymous';
      performanceMonitor.startTiming(functionName);
      const result = func(...args);
      performanceMonitor.endTiming(functionName);
      return result;
    }) as T;
  },

  // Check if device has limited resources
  isLowEndDevice(): boolean {
    // Check for various indicators of low-end devices
    const connection = (navigator as any).connection;
    const hardwareConcurrency = navigator.hardwareConcurrency || 1;
    const deviceMemory = (navigator as any).deviceMemory || 1;

    return (
      hardwareConcurrency <= 2 ||
      deviceMemory <= 2 ||
      (connection && connection.effectiveType === 'slow-2g') ||
      (connection && connection.effectiveType === '2g')
    );
  },

  // Get performance recommendations
  getPerformanceRecommendations(): string[] {
    const recommendations: string[] = [];
    
    if (this.isLowEndDevice()) {
      recommendations.push('Consider reducing animations and visual effects');
      recommendations.push('Enable performance mode in settings');
    }

    const metrics = performanceMonitor.getMetrics();
    const slowOperations = metrics.filter(m => m.duration && m.duration > 100);
    
    if (slowOperations.length > 0) {
      recommendations.push('Some operations are running slowly. Check console for details.');
    }

    return recommendations;
  },
};

// React hooks for performance monitoring (separate file to avoid circular imports)
export function createPerformanceHooks() {
  if (typeof window === 'undefined') return null;
  
  const React = (window as any).React;
  if (!React) return null;

  return {
    usePerformanceMonitor() {
      const startTiming = React.useCallback((name: string, metadata?: Record<string, any>) => {
        performanceMonitor.startTiming(name, metadata);
      }, []);

      const endTiming = React.useCallback((name: string) => {
        performanceMonitor.endTiming(name);
      }, []);

      const measureComponent = React.useCallback((componentName: string) => {
        React.useEffect(() => {
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
    },

    withPerformanceMonitoring<P extends Record<string, any>>(
  Component: React.ComponentType<P>,
  componentName?: string
): React.ComponentType<P> {
  const name = componentName || Component.displayName || Component.name || 'Component';
  
  const renderFunction = (props: P, ref: any) => {
    const { measureComponent } = this.usePerformanceMonitor();
    
    React.useEffect(() => {
      measureComponent(name);
    }, [measureComponent]);

    return React.createElement(Component, { ...props, ref });
  };

  const WrappedComponent = React.forwardRef(renderFunction);
  WrappedComponent.displayName = `withPerformanceMonitoring(${name})`;
  
  return React.memo(WrappedComponent) as React.ComponentType<P>;
}

  };
}
