import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';
import { VirtualList } from '../ui/VirtualList';
import { LazyWrapper } from '../common/LazyWrapper';
import { LoadingSpinner } from '../ui/LoadingSpinner';

// Mock data for testing
const mockItems = Array.from({ length: 1000 }, (_, i) => ({
  id: i,
  name: `Item ${i}`,
  value: i * 10,
}));

describe('Performance Optimizations Integration', () => {
  describe('VirtualList', () => {
    it('should render only visible items', () => {
      const renderItem = vi.fn((item, index) => (
        <div key={item.id} data-testid={`item-${item.id}`}>
          {item.name}
        </div>
      ));

      render(
        <VirtualList
          items={mockItems}
          itemHeight={50}
          containerHeight={200}
          renderItem={renderItem}
        />
      );

      // Should only render visible items (200px / 50px = 4 items + overscan)
      expect(renderItem).toHaveBeenCalledTimes(expect.any(Number));
      expect(renderItem.mock.calls.length).toBeLessThan(mockItems.length);
    });

    it('should handle empty items list', () => {
      const renderItem = vi.fn();

      render(
        <VirtualList
          items={[]}
          itemHeight={50}
          containerHeight={200}
          renderItem={renderItem}
        />
      );

      expect(renderItem).not.toHaveBeenCalled();
    });
  });

  describe('LazyWrapper', () => {
    it('should show fallback while loading', () => {
      const LazyComponent = React.lazy(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              default: () => <div>Loaded Component</div>
            });
          }, 100);
        })
      );

      render(
        <LazyWrapper fallback={<div>Loading...</div>}>
          <LazyComponent />
        </LazyWrapper>
      );

      expect(screen.getByText('Loading...')).toBeInTheDocument();
    });

    it('should use default loading spinner when no fallback provided', () => {
      const LazyComponent = React.lazy(() => 
        new Promise(resolve => {
          setTimeout(() => {
            resolve({
              default: () => <div>Loaded Component</div>
            });
          }, 100);
        })
      );

      render(
        <LazyWrapper>
          <LazyComponent />
        </LazyWrapper>
      );

      // Should render the default LoadingSpinner
      expect(document.querySelector('.animate-spin')).toBeInTheDocument();
    });
  });

  describe('React.memo optimizations', () => {
    it('should prevent unnecessary re-renders with memoized components', () => {
      const renderSpy = vi.fn();
      
      const MemoizedComponent = React.memo(({ value }: { value: number }) => {
        renderSpy();
        return <div>{value}</div>;
      });

      const { rerender } = render(<MemoizedComponent value={1} />);
      
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with same props - should not trigger render
      rerender(<MemoizedComponent value={1} />);
      expect(renderSpy).toHaveBeenCalledTimes(1);

      // Re-render with different props - should trigger render
      rerender(<MemoizedComponent value={2} />);
      expect(renderSpy).toHaveBeenCalledTimes(2);
    });
  });

  describe('useMemo optimizations', () => {
    it('should memoize expensive calculations', () => {
      const expensiveCalculation = vi.fn((num: number) => num * 2);
      
      const TestComponent = ({ value }: { value: number }) => {
        const result = React.useMemo(() => expensiveCalculation(value), [value]);
        return <div>{result}</div>;
      };

      const { rerender } = render(<TestComponent value={5} />);
      
      expect(expensiveCalculation).toHaveBeenCalledTimes(1);
      expect(screen.getByText('10')).toBeInTheDocument();

      // Re-render with same value - should not recalculate
      rerender(<TestComponent value={5} />);
      expect(expensiveCalculation).toHaveBeenCalledTimes(1);

      // Re-render with different value - should recalculate
      rerender(<TestComponent value={10} />);
      expect(expensiveCalculation).toHaveBeenCalledTimes(2);
      expect(screen.getByText('20')).toBeInTheDocument();
    });
  });

  describe('useCallback optimizations', () => {
    it('should memoize callback functions', () => {
      const TestComponent = ({ multiplier }: { multiplier: number }) => {
        const [count, setCount] = React.useState(0);
        
        const handleClick = React.useCallback(() => {
          setCount(prev => prev + multiplier);
        }, [multiplier]);

        return (
          <div>
            <span>{count}</span>
            <button onClick={handleClick}>Increment</button>
          </div>
        );
      };

      const { rerender } = render(<TestComponent multiplier={2} />);
      
      const button = screen.getByText('Increment');
      const initialCallback = button.onclick;

      // Re-render with same multiplier - callback should be the same
      rerender(<TestComponent multiplier={2} />);
      expect(button.onclick).toBe(initialCallback);

      // Re-render with different multiplier - callback should change
      rerender(<TestComponent multiplier={3} />);
      expect(button.onclick).not.toBe(initialCallback);
    });
  });
});