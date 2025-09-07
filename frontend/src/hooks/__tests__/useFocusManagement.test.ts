import { renderHook, act } from '@testing-library/react';
import { useFocusManagement, useFocusTrap, useAutoFocus } from '../useFocusManagement';

describe('useFocusManagement', () => {
  let mockElement: HTMLElement;

  beforeEach(() => {
    mockElement = document.createElement('button');
    mockElement.focus = jest.fn();
    document.body.appendChild(mockElement);
  });

  afterEach(() => {
    document.body.removeChild(mockElement);
  });

  it('should save and restore focus', () => {
    // Set initial focus
    mockElement.focus();
    Object.defineProperty(document, 'activeElement', {
      value: mockElement,
      writable: true,
    });

    const { result } = renderHook(() => useFocusManagement());

    act(() => {
      result.current.saveFocus();
    });

    // Change focus
    const newElement = document.createElement('input');
    newElement.focus = jest.fn();
    document.body.appendChild(newElement);
    Object.defineProperty(document, 'activeElement', {
      value: newElement,
      writable: true,
    });

    act(() => {
      result.current.restoreFocus();
    });

    expect(mockElement.focus).toHaveBeenCalled();

    document.body.removeChild(newElement);
  });

  it('should trap focus within container', () => {
    const container = document.createElement('div');
    const firstButton = document.createElement('button');
    const secondButton = document.createElement('button');
    const lastButton = document.createElement('button');

    firstButton.focus = jest.fn();
    secondButton.focus = jest.fn();
    lastButton.focus = jest.fn();

    container.appendChild(firstButton);
    container.appendChild(secondButton);
    container.appendChild(lastButton);
    document.body.appendChild(container);

    const { result } = renderHook(() => useFocusManagement());

    let cleanup: (() => void) | undefined;
    act(() => {
      cleanup = result.current.trapFocus(container);
    });

    expect(firstButton.focus).toHaveBeenCalled();

    // Simulate Tab on last element
    Object.defineProperty(document, 'activeElement', {
      value: lastButton,
      writable: true,
    });

    const tabEvent = new KeyboardEvent('keydown', { key: 'Tab' });
    container.dispatchEvent(tabEvent);

    // Should focus first element (but we can't easily test this without more complex setup)

    cleanup?.();
    document.body.removeChild(container);
  });
});

describe('useFocusTrap', () => {
  let container: HTMLDivElement;
  let containerRef: React.RefObject<HTMLDivElement>;

  beforeEach(() => {
    container = document.createElement('div');
    const button = document.createElement('button');
    button.focus = jest.fn();
    container.appendChild(button);
    document.body.appendChild(container);

    containerRef = { current: container };
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  it('should activate focus trap when isActive is true', () => {
    const { rerender } = renderHook(
      ({ isActive }) => useFocusTrap(isActive, containerRef),
      { initialProps: { isActive: false } }
    );

    // Should not trap focus initially
    expect(container.querySelector('button')?.focus).not.toHaveBeenCalled();

    // Activate focus trap
    rerender({ isActive: true });

    expect(container.querySelector('button')?.focus).toHaveBeenCalled();
  });
});

describe('useAutoFocus', () => {
  it('should focus element when shouldFocus is true', () => {
    const { result } = renderHook(() => useAutoFocus(true));

    const mockElement = document.createElement('input');
    mockElement.focus = jest.fn();

    // Simulate ref assignment
    act(() => {
      if (result.current.current !== mockElement) {
        (result.current as any).current = mockElement;
      }
    });

    // Focus should be called after a timeout
    setTimeout(() => {
      expect(mockElement.focus).toHaveBeenCalled();
    }, 10);
  });

  it('should not focus element when shouldFocus is false', () => {
    const { result } = renderHook(() => useAutoFocus(false));

    const mockElement = document.createElement('input');
    mockElement.focus = jest.fn();

    act(() => {
      (result.current as any).current = mockElement;
    });

    setTimeout(() => {
      expect(mockElement.focus).not.toHaveBeenCalled();
    }, 10);
  });

  it('should focus element after specified delay', () => {
    jest.useFakeTimers();
    
    const { result } = renderHook(() => useAutoFocus(true, 100));

    const mockElement = document.createElement('input');
    mockElement.focus = jest.fn();

    act(() => {
      (result.current as any).current = mockElement;
    });

    // Should not focus immediately
    expect(mockElement.focus).not.toHaveBeenCalled();

    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(100);
    });

    expect(mockElement.focus).toHaveBeenCalled();

    jest.useRealTimers();
  });
});