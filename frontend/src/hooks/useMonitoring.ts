import { useEffect, useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { monitoring } from '@/lib/monitoring';

interface UseMonitoringOptions {
  trackPageViews?: boolean;
  trackUserActions?: boolean;
  trackPerformance?: boolean;
}

export function useMonitoring(options: UseMonitoringOptions = {}) {
  const location = useLocation();
  const {
    trackPageViews = true,
    trackUserActions = true,
    trackPerformance = true,
  } = options;

  // Track page views
  useEffect(() => {
    if (trackPageViews) {
      monitoring.trackPageView(location.pathname, {
        search: location.search,
        hash: location.hash,
      });
    }
  }, [location, trackPageViews]);

  // Track performance metrics
  useEffect(() => {
    if (!trackPerformance) return;

    const trackWebVitals = async () => {
      try {
        const { getCLS, getFID, getFCP, getLCP, getTTFB } = await import('web-vitals');
        
        getCLS((metric) => {
          monitoring.trackPerformanceMetric({
            name: 'CLS',
            value: metric.value,
            timestamp: Date.now(),
            metadata: { id: metric.id, rating: metric.rating },
          });
        });

        getFID((metric) => {
          monitoring.trackPerformanceMetric({
            name: 'FID',
            value: metric.value,
            timestamp: Date.now(),
            metadata: { id: metric.id, rating: metric.rating },
          });
        });

        getFCP((metric) => {
          monitoring.trackPerformanceMetric({
            name: 'FCP',
            value: metric.value,
            timestamp: Date.now(),
            metadata: { id: metric.id, rating: metric.rating },
          });
        });

        getLCP((metric) => {
          monitoring.trackPerformanceMetric({
            name: 'LCP',
            value: metric.value,
            timestamp: Date.now(),
            metadata: { id: metric.id, rating: metric.rating },
          });
        });

        getTTFB((metric) => {
          monitoring.trackPerformanceMetric({
            name: 'TTFB',
            value: metric.value,
            timestamp: Date.now(),
            metadata: { id: metric.id, rating: metric.rating },
          });
        });
      } catch (error) {
        console.warn('Web Vitals not available:', error);
      }
    };

    trackWebVitals();
  }, [trackPerformance]);

  // Utility functions
  const trackAction = useCallback((action: string, metadata?: Record<string, any>) => {
    if (trackUserActions) {
      monitoring.trackUserAction(action, metadata);
    }
  }, [trackUserActions]);

  const trackError = useCallback((error: Error, context?: Record<string, any>) => {
    monitoring.captureException(error, context);
  }, []);

  const addBreadcrumb = useCallback((message: string, category?: string, level?: 'info' | 'warning' | 'error') => {
    monitoring.addBreadcrumb(message, category, level);
  }, []);

  const setUserId = useCallback((userId: string) => {
    monitoring.setUserId(userId);
  }, []);

  return {
    trackAction,
    trackError,
    addBreadcrumb,
    setUserId,
  };
}