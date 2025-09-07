// Monitoring and error tracking utilities
interface MonitoringConfig {
  sentryDsn?: string;
  analyticsId?: string;
  environment: string;
  enableDevtools: boolean;
  logLevel: 'debug' | 'info' | 'warn' | 'error';
}

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, any>;
}

interface ErrorReport {
  message: string;
  stack?: string;
  url: string;
  userAgent: string;
  timestamp: number;
  userId?: string;
  sessionId: string;
  metadata?: Record<string, any>;
}

class MonitoringService {
  private config: MonitoringConfig;
  private sessionId: string;
  private performanceObserver?: PerformanceObserver;

  constructor(config: MonitoringConfig) {
    this.config = config;
    this.sessionId = this.generateSessionId();
    this.initializeMonitoring();
  }

  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  private initializeMonitoring(): void {
    // Initialize Sentry if DSN is provided
    if (this.config.sentryDsn && typeof window !== 'undefined') {
      this.initializeSentry();
    }

    // Initialize performance monitoring
    this.initializePerformanceMonitoring();

    // Initialize error tracking
    this.initializeErrorTracking();

    // Initialize analytics
    if (this.config.analyticsId) {
      this.initializeAnalytics();
    }
  }

  private initializeSentry(): void {
    // Sentry initialization would go here
    // This is a placeholder for actual Sentry SDK integration
    console.log('Sentry initialized with DSN:', this.config.sentryDsn);
  }

  private initializePerformanceMonitoring(): void {
    if (typeof window === 'undefined' || !('PerformanceObserver' in window)) {
      return;
    }

    // Monitor Core Web Vitals
    this.performanceObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        this.trackPerformanceMetric({
          name: entry.name,
          value: entry.startTime,
          timestamp: Date.now(),
          metadata: {
            entryType: entry.entryType,
            duration: (entry as any).duration,
          },
        });
      }
    });

    try {
      this.performanceObserver.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    } catch (error) {
      console.warn('Performance monitoring not supported:', error);
    }

    // Monitor bundle size and loading performance
    this.trackBundleMetrics();
  }

  private initializeErrorTracking(): void {
    if (typeof window === 'undefined') return;

    // Global error handler
    window.addEventListener('error', (event) => {
      this.trackError({
        message: event.message,
        stack: event.error?.stack,
        url: event.filename || window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        metadata: {
          lineno: event.lineno,
          colno: event.colno,
          type: 'javascript-error',
        },
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.trackError({
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href,
        userAgent: navigator.userAgent,
        timestamp: Date.now(),
        sessionId: this.sessionId,
        metadata: {
          type: 'unhandled-promise-rejection',
          reason: event.reason,
        },
      });
    });
  }

  private initializeAnalytics(): void {
    // Analytics initialization would go here
    // This is a placeholder for actual analytics SDK integration
    console.log('Analytics initialized with ID:', this.config.analyticsId);
  }

  private trackBundleMetrics(): void {
  if (typeof window === 'undefined' || !window.performance) return;

  // Track resource loading times
  window.addEventListener('load', () => {
    setTimeout(() => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      
      resources.forEach((resource) => {
        if (resource.name.includes('.js') || resource.name.includes('.css')) {
          this.trackPerformanceMetric({
            name: `resource-load-${resource.name.split('/').pop()}`,
            value: resource.responseEnd - resource.requestStart, 
            timestamp: Date.now(),
            metadata: {
              resourceType: resource.initiatorType,
              transferSize: resource.transferSize,
              encodedBodySize: resource.encodedBodySize,
              dnsLookupTime: resource.domainLookupEnd - resource.domainLookupStart,
              connectionTime: resource.connectEnd - resource.connectStart,
              requestTime: resource.responseStart - resource.requestStart,
              responseTime: resource.responseEnd - resource.responseStart,
              totalTime: resource.responseEnd - resource.requestStart,
            },
          });
        }
      });
    }, 1000);
  });
}


  public trackPerformanceMetric(metric: PerformanceMetric): void {
    if (this.config.logLevel === 'debug') {
      console.log('Performance metric:', metric);
    }

    // Send to monitoring service
    this.sendToMonitoringService('performance', metric);
  }

  public trackError(error: ErrorReport): void {
    if (this.config.logLevel === 'debug' || this.config.logLevel === 'error') {
      console.error('Error tracked:', error);
    }

    // Send to error tracking service
    this.sendToMonitoringService('error', error);
  }

  public trackUserAction(action: string, metadata?: Record<string, any>): void {
    if (this.config.logLevel === 'debug') {
      console.log('User action:', action, metadata);
    }

    // Send to analytics service
    this.sendToMonitoringService('user-action', {
      action,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata,
    });
  }

  public trackPageView(path: string, metadata?: Record<string, any>): void {
    if (this.config.logLevel === 'debug') {
      console.log('Page view:', path, metadata);
    }

    // Send to analytics service
    this.sendToMonitoringService('page-view', {
      path,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata,
    });
  }

  private sendToMonitoringService(type: string, data: any): void {
    // In a real implementation, this would send data to your monitoring service
    // For now, we'll just store it locally or send to a mock endpoint
    
    if (this.config.environment === 'development') {
      // Don't send in development
      return;
    }

    // Example: Send to monitoring endpoint
    fetch('/api/monitoring', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        type,
        data,
        environment: this.config.environment,
        timestamp: Date.now(),
      }),
    }).catch((error) => {
      console.warn('Failed to send monitoring data:', error);
    });
  }

  public setUserId(_userId: string): void {
    // Set user context for error tracking
    if (this.config.sentryDsn) {
      // Sentry.setUser({ id: userId });
    }
  }

  public addBreadcrumb(_message: string, _category?: string, _level?: 'info' | 'warning' | 'error'): void {
    if (this.config.sentryDsn) {
      // Sentry.addBreadcrumb({ message, category, level });
    }
  }

  public captureException(error: Error, context?: Record<string, any>): void {
    this.trackError({
      message: error.message,
      stack: error.stack,
      url: window.location.href,
      userAgent: navigator.userAgent,
      timestamp: Date.now(),
      sessionId: this.sessionId,
      metadata: context,
    });
  }
}

// Initialize monitoring service
const monitoringConfig: MonitoringConfig = {
  sentryDsn: import.meta.env.VITE_SENTRY_DSN,
  analyticsId: import.meta.env.VITE_ANALYTICS_ID,
  environment: import.meta.env.VITE_APP_ENV || 'development',
  enableDevtools: import.meta.env.VITE_ENABLE_DEVTOOLS === 'true',
  logLevel: (import.meta.env.VITE_LOG_LEVEL as any) || 'info',
};

export const monitoring = new MonitoringService(monitoringConfig);

// Export types for use in other modules
export type { MonitoringConfig, PerformanceMetric, ErrorReport };