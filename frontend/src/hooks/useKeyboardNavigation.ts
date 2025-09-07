import { useEffect, useCallback, useRef } from 'react';

export interface KeyboardShortcut {
  key: string;
  ctrlKey?: boolean;
  altKey?: boolean;
  shiftKey?: boolean;
  metaKey?: boolean;
  action: () => void;
  description: string;
  preventDefault?: boolean;
}

export const useKeyboardNavigation = (shortcuts: KeyboardShortcut[] = []) => {
  const shortcutsRef = useRef(shortcuts);
  shortcutsRef.current = shortcuts;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    const activeShortcut = shortcutsRef.current.find(shortcut => {
      return (
        shortcut.key.toLowerCase() === event.key.toLowerCase() &&
        !!shortcut.ctrlKey === event.ctrlKey &&
        !!shortcut.altKey === event.altKey &&
        !!shortcut.shiftKey === event.shiftKey &&
        !!shortcut.metaKey === event.metaKey
      );
    });

    if (activeShortcut) {
      if (activeShortcut.preventDefault !== false) {
        event.preventDefault();
      }
      activeShortcut.action();
    }
  }, []);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return { shortcuts: shortcutsRef.current };
};

// Common keyboard navigation utilities
export const useArrowKeyNavigation = (
  items: HTMLElement[],
  options: {
    loop?: boolean;
    orientation?: 'horizontal' | 'vertical' | 'both';
    onSelect?: (index: number) => void;
  } = {}
) => {
  const { loop = true, orientation = 'vertical', onSelect } = options;
  const currentIndexRef = useRef(0);

  const navigate = useCallback((direction: 'up' | 'down' | 'left' | 'right') => {
    if (items.length === 0) return;

    let newIndex = currentIndexRef.current;

    switch (direction) {
      case 'up':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = newIndex > 0 ? newIndex - 1 : loop ? items.length - 1 : 0;
        }
        break;
      case 'down':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = newIndex < items.length - 1 ? newIndex + 1 : loop ? 0 : items.length - 1;
        }
        break;
      case 'left':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = newIndex > 0 ? newIndex - 1 : loop ? items.length - 1 : 0;
        }
        break;
      case 'right':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = newIndex < items.length - 1 ? newIndex + 1 : loop ? 0 : items.length - 1;
        }
        break;
    }

    if (newIndex !== currentIndexRef.current) {
      currentIndexRef.current = newIndex;
      items[newIndex]?.focus();
      onSelect?.(newIndex);
    }
  }, [items, loop, orientation, onSelect]);

  const shortcuts: KeyboardShortcut[] = [
    {
      key: 'ArrowUp',
      action: () => navigate('up'),
      description: 'Navigate up',
    },
    {
      key: 'ArrowDown',
      action: () => navigate('down'),
      description: 'Navigate down',
    },
    {
      key: 'ArrowLeft',
      action: () => navigate('left'),
      description: 'Navigate left',
    },
    {
      key: 'ArrowRight',
      action: () => navigate('right'),
      description: 'Navigate right',
    },
  ];

  useKeyboardNavigation(shortcuts);

  return {
    currentIndex: currentIndexRef.current,
    navigate,
    setCurrentIndex: (index: number) => {
      if (index >= 0 && index < items.length) {
        currentIndexRef.current = index;
      }
    },
  };
};