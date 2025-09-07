import { renderHook } from '@testing-library/react';
import { useKeyboardNavigation, useArrowKeyNavigation } from '../useKeyboardNavigation';

describe('useKeyboardNavigation', () => {
  beforeEach(() => {
    // Clear any existing event listeners
    document.removeEventListener('keydown', jest.fn());
  });

  it('should register keyboard shortcuts', () => {
    const mockAction = jest.fn();
    const shortcuts = [
      {
        key: 'Enter',
        action: mockAction,
        description: 'Test action',
      },
    ];

    renderHook(() => useKeyboardNavigation(shortcuts));

    // Simulate keydown event
    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    document.dispatchEvent(event);

    expect(mockAction).toHaveBeenCalled();
  });

  it('should handle modifier keys', () => {
    const mockAction = jest.fn();
    const shortcuts = [
      {
        key: 's',
        ctrlKey: true,
        action: mockAction,
        description: 'Save',
      },
    ];

    renderHook(() => useKeyboardNavigation(shortcuts));

    // Simulate Ctrl+S
    const event = new KeyboardEvent('keydown', { 
      key: 's', 
      ctrlKey: true 
    });
    document.dispatchEvent(event);

    expect(mockAction).toHaveBeenCalled();
  });

  it('should not trigger action without correct modifiers', () => {
    const mockAction = jest.fn();
    const shortcuts = [
      {
        key: 's',
        ctrlKey: true,
        action: mockAction,
        description: 'Save',
      },
    ];

    renderHook(() => useKeyboardNavigation(shortcuts));

    // Simulate just 's' without Ctrl
    const event = new KeyboardEvent('keydown', { key: 's' });
    document.dispatchEvent(event);

    expect(mockAction).not.toHaveBeenCalled();
  });

  it('should prevent default behavior by default', () => {
    const mockAction = jest.fn();
    const shortcuts = [
      {
        key: 'Enter',
        action: mockAction,
        description: 'Test action',
      },
    ];

    renderHook(() => useKeyboardNavigation(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
    
    document.dispatchEvent(event);

    expect(preventDefaultSpy).toHaveBeenCalled();
  });

  it('should not prevent default when preventDefault is false', () => {
    const mockAction = jest.fn();
    const shortcuts = [
      {
        key: 'Enter',
        action: mockAction,
        description: 'Test action',
        preventDefault: false,
      },
    ];

    renderHook(() => useKeyboardNavigation(shortcuts));

    const event = new KeyboardEvent('keydown', { key: 'Enter' });
    const preventDefaultSpy = jest.spyOn(event, 'preventDefault');
    
    document.dispatchEvent(event);

    expect(preventDefaultSpy).not.toHaveBeenCalled();
  });
});

describe('useArrowKeyNavigation', () => {
  let mockElements: HTMLElement[];
  let mockOnSelect: jest.Mock;

  beforeEach(() => {
    // Create mock elements
    mockElements = Array.from({ length: 3 }, (_, i) => {
      const element = document.createElement('div');
      element.focus = jest.fn();
      element.setAttribute('data-testid', `item-${i}`);
      return element;
    });

    mockOnSelect = jest.fn();
  });

  it('should navigate down with arrow keys', () => {
    renderHook(() => useArrowKeyNavigation(mockElements, {
      onSelect: mockOnSelect,
    }));

    // Simulate ArrowDown
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    document.dispatchEvent(event);

    expect(mockElements[1].focus).toHaveBeenCalled();
    expect(mockOnSelect).toHaveBeenCalledWith(1);
  });

  it('should navigate up with arrow keys', () => {
    const { result } = renderHook(() => useArrowKeyNavigation(mockElements, {
      onSelect: mockOnSelect,
    }));

    // Set current index to 1
    result.current.setCurrentIndex(1);

    // Simulate ArrowUp
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    document.dispatchEvent(event);

    expect(mockElements[0].focus).toHaveBeenCalled();
    expect(mockOnSelect).toHaveBeenCalledWith(0);
  });

  it('should loop to end when going up from first item', () => {
    renderHook(() => useArrowKeyNavigation(mockElements, {
      loop: true,
      onSelect: mockOnSelect,
    }));

    // Simulate ArrowUp from first item
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    document.dispatchEvent(event);

    expect(mockElements[2].focus).toHaveBeenCalled();
    expect(mockOnSelect).toHaveBeenCalledWith(2);
  });

  it('should not loop when loop is false', () => {
    renderHook(() => useArrowKeyNavigation(mockElements, {
      loop: false,
      onSelect: mockOnSelect,
    }));

    // Simulate ArrowUp from first item
    const event = new KeyboardEvent('keydown', { key: 'ArrowUp' });
    document.dispatchEvent(event);

    expect(mockElements[0].focus).toHaveBeenCalled();
    expect(mockOnSelect).toHaveBeenCalledWith(0);
  });

  it('should handle horizontal navigation', () => {
    renderHook(() => useArrowKeyNavigation(mockElements, {
      orientation: 'horizontal',
      onSelect: mockOnSelect,
    }));

    // Simulate ArrowRight
    const event = new KeyboardEvent('keydown', { key: 'ArrowRight' });
    document.dispatchEvent(event);

    expect(mockElements[1].focus).toHaveBeenCalled();
    expect(mockOnSelect).toHaveBeenCalledWith(1);
  });

  it('should ignore vertical keys in horizontal mode', () => {
    renderHook(() => useArrowKeyNavigation(mockElements, {
      orientation: 'horizontal',
      onSelect: mockOnSelect,
    }));

    // Simulate ArrowDown (should be ignored)
    const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
    document.dispatchEvent(event);

    expect(mockElements[0].focus).toHaveBeenCalled(); // Should stay at index 0
    expect(mockOnSelect).toHaveBeenCalledWith(0);
  });
});