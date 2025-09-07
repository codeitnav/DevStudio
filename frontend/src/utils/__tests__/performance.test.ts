import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { performanceUtils, performanceMonitor } from '../performance';

// Mock performance API
const mockPerformance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn(),
};

Object.defineProperty(global, 'performance', {
  value: mockPerformance,
  writable: true,
});

describe('Performance Utils', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    performanceMonitor.clearMetrics();
  });

  afterEach(() => {
    performanceMonitor.destroy();
  });

  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const mockFn = vi.fn();
      const debouncedFn = performanceUtils.debounce(mockFn, 100);

      debouncedFn('test1');
      debouncedFn('test2');
      debouncedFn('test3');

      expect(mockFn).not.toHaveBeenCalled();

      await new Promise(resolve => setTimeout(resolve, 150));

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test3');
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      const mockFn = vi.fn();
      const throttledFn = performanceUtils.throttle(mockFn, 100);

      throttledFn('test1');
      throttledFn('test2');
      throttledFn('test3');

      expect(mockFn).toHaveBeenCalledTimes(1);
      expect(mockFn).toHaveBeenCalledWith('test1');

      await new Promise(resolve => setTimeout(resolve, 150));

      throttledFn('test4');
      expect(mockFn).toHaveBeenCalledTimes(2);
      expect(mockFn).toHaveBeenCalledWith('test4');
    });
  });

  describe('measureExecution', () => {
    it('should measure function execution time', () => {
      const mockFn = vi.fn(() => 'result');
      const measuredFn = performanceUtils.measureExecution(mockFn, 'testFunction');

      const result = measuredFn('arg1', 'arg2');

      expect(result).toBe('result');
      expect(mockFn).toHaveBeenCalledWith('arg1', 'arg2');
    });
  });

  describe('isLowEndDevice', () => {
    it('should detect low-end devices based on hardware concurrency', () => {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 1,
        writable: true,
      });

      expect(performanceUtils.isLowEndDevice()).toBe(true);

      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 4,
        writable: true,
      });

      expect(performanceUtils.isLowEndDevice()).toBe(false);
    });

    it('should detect low-end devices based on device memory', () => {
      Object.defineProperty(navigator, 'deviceMemory', {
        value: 1,
        writable: true,
      });

      expect(performanceUtils.isLowEndDevice()).toBe(true);

      Object.defineProperty(navigator, 'deviceMemory', {
        value: 4,
        writable: true,
      });

      expect(performanceUtils.isLowEndDevice()).toBe(false);
    });
  });

  describe('getPerformanceRecommendations', () => {
    it('should provide recommendations for low-end devices', () => {
      Object.defineProperty(navigator, 'hardwareConcurrency', {
        value: 1,
        writable: true,
      });

      const recommendations = performanceUtils.getPerformanceRecommendations();

      expect(recommendations).toContain('Consider reducing animations and visual effects');
      expect(recommendations).toContain('Enable performance mode in settings');
    });

    it('should provide recommendations for slow operations', () => {
      // Simulate slow operation
      performanceMonitor.startTiming('slowOperation');
      
      // Mock a slow operation by setting a high duration
      const metrics = performanceMonitor.getMetrics();
      if (metrics.length > 0) {
        metrics[0].duration = 200; // Simulate 200ms operation
      }

      const recommendations = performanceUtils.getPerformanceRecommendations();

      expect(recommendations).toContain('Some operations are running slowly. Check console for details.');
    });
  });
});

describe('Performance Monitor', () => {
  beforeEach(() => {
    performanceMonitor.clearMetrics();
  });

  afterEach(() => {
    performanceMonitor.destroy();
  });

  describe('timing operations', () => {
    it('should start and end timing operations', () => {
      performanceMonitor.startTiming('testOperation');
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics).toHaveLength(1);
      expect(metrics[0].name).toBe('testOperation');
      expect(metrics[0].startTime).toBeDefined();
      expect(metrics[0].endTime).toBeUndefined();

      performanceMonitor.endTiming('testOperation');
      
      const updatedMetrics = performanceMonitor.getMetrics();
      expect(updatedMetrics[0].endTime).toBeDefined();
      expect(updatedMetrics[0].duration).toBeDefined();
    });

    it('should handle timing operations with metadata', () => {
      const metadata = { component: 'TestComponent', props: { id: 1 } };
      performanceMonitor.startTiming('testOperation', metadata);
      
      const metrics = performanceMonitor.getMetrics();
      expect(metrics[0].metadata).toEqual(metadata);
    });
  });

  describe('metrics management', () => {
    it('should clear all metrics', () => {
      performanceMonitor.startTiming('operation1');
      performanceMonitor.startTiming('operation2');
      
      expect(performanceMonitor.getMetrics()).toHaveLength(2);
      
      performanceMonitor.clearMetrics();
      
      expect(performanceMonitor.getMetrics()).toHaveLength(0);
    });
  });
});