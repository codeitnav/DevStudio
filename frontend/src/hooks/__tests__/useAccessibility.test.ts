import { renderHook, act } from '@testing-library/react';
import { useAccessibility } from '../useAccessibility';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('useAccessibility', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    document.documentElement.className = '';
  });

  it('should initialize with default settings', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useAccessibility());
    
    expect(result.current.settings).toEqual({
      highContrast: false,
      reducedMotion: false,
      fontSize: 'medium',
      screenReaderMode: false,
    });
  });

  it('should load settings from localStorage', () => {
    const savedSettings = {
      highContrast: true,
      fontSize: 'large',
    };
    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedSettings));
    
    const { result } = renderHook(() => useAccessibility());
    
    expect(result.current.settings.highContrast).toBe(true);
    expect(result.current.settings.fontSize).toBe('large');
  });

  it('should toggle high contrast mode', () => {
    const { result } = renderHook(() => useAccessibility());
    
    act(() => {
      result.current.toggleHighContrast();
    });
    
    expect(result.current.settings.highContrast).toBe(true);
    expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
  });

  it('should toggle reduced motion', () => {
    const { result } = renderHook(() => useAccessibility());
    
    act(() => {
      result.current.toggleReducedMotion();
    });
    
    expect(result.current.settings.reducedMotion).toBe(true);
    expect(document.documentElement.classList.contains('reduced-motion')).toBe(true);
  });

  it('should set font size', () => {
    const { result } = renderHook(() => useAccessibility());
    
    act(() => {
      result.current.setFontSize('large');
    });
    
    expect(result.current.settings.fontSize).toBe('large');
    expect(document.documentElement.classList.contains('font-large')).toBe(true);
  });

  it('should toggle screen reader mode', () => {
    const { result } = renderHook(() => useAccessibility());
    
    act(() => {
      result.current.toggleScreenReaderMode();
    });
    
    expect(result.current.settings.screenReaderMode).toBe(true);
    expect(document.documentElement.classList.contains('screen-reader-mode')).toBe(true);
  });

  it('should save settings to localStorage', () => {
    const { result } = renderHook(() => useAccessibility());
    
    act(() => {
      result.current.updateSettings({ highContrast: true, fontSize: 'large' });
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'accessibility-settings',
      JSON.stringify({
        highContrast: true,
        reducedMotion: false,
        fontSize: 'large',
        screenReaderMode: false,
      })
    );
  });
});