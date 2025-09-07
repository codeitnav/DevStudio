// Health check utilities for monitoring application status
interface HealthCheckResult {
  status: 'healthy' | 'unhealthy' | 'degraded';
  timestamp: number;
  version: string;
  checks: {
    [key: string]: {
      status: 'pass' | 'fail' | 'warn';
      message?: string;
      duration?: number;
    };
  };
}

interface HealthCheckConfig {
  apiUrl: string;
  socketUrl: string;
  timeout: number;
}

interface PerformanceMemory {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
}

interface ExtendedPerformance extends Performance {
  memory?: PerformanceMemory;
}

class HealthCheckService {
  private config: HealthCheckConfig;

  constructor(config: HealthCheckConfig) {
    this.config = config;
  }

  async performHealthCheck(): Promise<HealthCheckResult> {
    const checks: HealthCheckResult['checks'] = {};

    // Check API connectivity
    try {
      const apiStart = Date.now();
      const response = await fetch(`${this.config.apiUrl}/health`, {
        method: 'GET',
        timeout: this.config.timeout,
      } as any);
      
      checks.api = {
        status: response.ok ? 'pass' : 'fail',
        message: response.ok ? 'API is responsive' : `API returned ${response.status}`,
        duration: Date.now() - apiStart,
      };
    } catch (error) {
      checks.api = {
        status: 'fail',
        message: `API connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    // Check Socket.IO connectivity
    try {
      const socketStart = Date.now();
      const socketHealthy = await this.checkSocketConnection();
      
      checks.socket = {
        status: socketHealthy ? 'pass' : 'fail',
        message: socketHealthy ? 'Socket connection is healthy' : 'Socket connection failed',
        duration: Date.now() - socketStart,
      };
    } catch (error) {
      checks.socket = {
        status: 'fail',
        message: `Socket check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }

    // Check browser capabilities
    checks.browser = this.checkBrowserCapabilities();

    // Check local storage
    checks.localStorage = this.checkLocalStorage();

    // Check performance
    checks.performance = this.checkPerformance();

    // Determine overall status
    const failedChecks = Object.values(checks).filter(check => check.status === 'fail');
    const warnChecks = Object.values(checks).filter(check => check.status === 'warn');
    
    let status: HealthCheckResult['status'] = 'healthy';
    if (failedChecks.length > 0) {
      status = 'unhealthy';
    } else if (warnChecks.length > 0) {
      status = 'degraded';
    }

    return {
      status,
      timestamp: Date.now(),
      version: import.meta.env.VITE_APP_VERSION || '1.0.0',
      checks,
    };
  }

  private async checkSocketConnection(): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        // This is a simplified check - in a real implementation,
        // you would create a temporary socket connection
        const socket = new WebSocket(this.config.socketUrl.replace('http', 'ws'));
        
        const timeout = setTimeout(() => {
          socket.close();
          resolve(false);
        }, this.config.timeout);

        socket.onopen = () => {
          clearTimeout(timeout);
          socket.close();
          resolve(true);
        };

        socket.onerror = () => {
          clearTimeout(timeout);
          resolve(false);
        };
      } catch (error) {
        resolve(false);
      }
    });
  }

  private checkBrowserCapabilities(): HealthCheckResult['checks'][string] {
    const requiredFeatures = [
      'WebSocket',
      'localStorage',
      'sessionStorage',
      'fetch',
      'Promise',
      'Map',
      'Set',
    ];

    const missingFeatures = requiredFeatures.filter(feature => !(feature in window));
    
    if (missingFeatures.length === 0) {
      return {
        status: 'pass',
        message: 'All required browser features are available',
      };
    } else {
      return {
        status: 'fail',
        message: `Missing browser features: ${missingFeatures.join(', ')}`,
      };
    }
  }

  private checkLocalStorage(): HealthCheckResult['checks'][string] {
    try {
      const testKey = '__health_check_test__';
      const testValue = 'test';
      
      localStorage.setItem(testKey, testValue);
      const retrieved = localStorage.getItem(testKey);
      localStorage.removeItem(testKey);
      
      if (retrieved === testValue) {
        return {
          status: 'pass',
          message: 'Local storage is working correctly',
        };
      } else {
        return {
          status: 'fail',
          message: 'Local storage read/write test failed',
        };
      }
    } catch (error) {
      return {
        status: 'fail',
        message: `Local storage error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      };
    }
  }

  private checkPerformance(): HealthCheckResult['checks'][string] {
  const extendedPerformance = window.performance as ExtendedPerformance;
  
  if (!extendedPerformance || !extendedPerformance.memory) {
    return {
      status: 'warn',
      message: 'Performance memory API not available (only supported in Chromium browsers)',
    };
  }

  const memory = extendedPerformance.memory;
  const memoryUsage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
  
  if (memoryUsage > 0.9) {
    return {
      status: 'warn',
      message: `High memory usage: ${Math.round(memoryUsage * 100)}%`,
    };
  } else if (memoryUsage > 0.7) {
    return {
      status: 'warn',
      message: `Moderate memory usage: ${Math.round(memoryUsage * 100)}%`,
    };
  } else {
    return {
      status: 'pass',
      message: `Memory usage is normal: ${Math.round(memoryUsage * 100)}%`,
    };
  }
}
}

// Initialize health check service
const healthCheckConfig: HealthCheckConfig = {
  apiUrl: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  socketUrl: import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000',
  timeout: 5000,
};

export const healthCheck = new HealthCheckService(healthCheckConfig);

// Export types
export type { HealthCheckResult, HealthCheckConfig };