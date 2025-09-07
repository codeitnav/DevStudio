import { useEffect, useRef, useCallback } from 'react';

export const useFocusManagement = () => {
  const previousFocusRef = useRef<HTMLElement | null>(null);

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement as HTMLElement;
  }, []);

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current && document.contains(previousFocusRef.current)) {
      previousFocusRef.current.focus();
    }
  }, []);

  const trapFocus = useCallback((container: HTMLElement) => {
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    ) as NodeListOf<HTMLElement>;

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, []);

  return {
    saveFocus,
    restoreFocus,
    trapFocus,
  };
};

export const useFocusTrap = (isActive: boolean, containerRef: React.RefObject<HTMLElement>) => {
  const { saveFocus, restoreFocus, trapFocus } = useFocusManagement();

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    saveFocus();
    const cleanup = trapFocus(containerRef.current);

    return () => {
      cleanup();
      restoreFocus();
    };
  }, [isActive, containerRef, saveFocus, restoreFocus, trapFocus]);
};

export const useAutoFocus = (shouldFocus: boolean = true, delay: number = 0) => {
  const elementRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (shouldFocus && elementRef.current) {
      const timeoutId = setTimeout(() => {
        elementRef.current?.focus();
      }, delay);

      return () => clearTimeout(timeoutId);
    }
  }, [shouldFocus, delay]);

  return elementRef;
};