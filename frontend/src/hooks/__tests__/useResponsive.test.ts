import { renderHook, act } from '@testing-library/react'
import { useResponsive, useMediaQuery } from '../useResponsive'

// Mock window.matchMedia
const mockMatchMedia = (matches: boolean) => {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: jest.fn().mockImplementation((query) => ({
      matches,
      media: query,
      onchange: null,
      addListener: jest.fn(), // deprecated
      removeListener: jest.fn(), // deprecated
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    })),
  })
}

// Mock window dimensions
const mockWindowDimensions = (width: number, height: number) => {
  Object.defineProperty(window, 'innerWidth', {
    writable: true,
    configurable: true,
    value: width,
  })
  Object.defineProperty(window, 'innerHeight', {
    writable: true,
    configurable: true,
    value: height,
  })
}

describe('useResponsive', () => {
  beforeEach(() => {
    mockMatchMedia(false)
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('should detect mobile screen size', () => {
    mockWindowDimensions(640, 800)
    
    const { result } = renderHook(() => useResponsive())
    
    expect(result.current.isMobile).toBe(true)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(false)
    expect(result.current.windowSize).toEqual({ width: 640, height: 800 })
  })

  it('should detect tablet screen size', () => {
    mockWindowDimensions(900, 600)
    
    const { result } = renderHook(() => useResponsive())
    
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(true)
    expect(result.current.isDesktop).toBe(false)
  })

  it('should detect desktop screen size', () => {
    mockWindowDimensions(1200, 800)
    
    const { result } = renderHook(() => useResponsive())
    
    expect(result.current.isMobile).toBe(false)
    expect(result.current.isTablet).toBe(false)
    expect(result.current.isDesktop).toBe(true)
  })

  it('should check breakpoints correctly', () => {
    mockWindowDimensions(1024, 768)
    
    const { result } = renderHook(() => useResponsive())
    
    expect(result.current.isBreakpoint('sm')).toBe(true)
    expect(result.current.isBreakpoint('md')).toBe(true)
    expect(result.current.isBreakpoint('lg')).toBe(true)
    expect(result.current.isBreakpoint('xl')).toBe(false)
  })

  it('should check between breakpoints correctly', () => {
    mockWindowDimensions(900, 600)
    
    const { result } = renderHook(() => useResponsive())
    
    expect(result.current.isBetween('md', 'lg')).toBe(true)
    expect(result.current.isBetween('sm', 'md')).toBe(false)
  })

  it('should update on window resize', () => {
    mockWindowDimensions(640, 800)
    
    const { result } = renderHook(() => useResponsive())
    
    expect(result.current.isMobile).toBe(true)
    
    // Simulate window resize
    mockWindowDimensions(1200, 800)
    
    act(() => {
      window.dispatchEvent(new Event('resize'))
    })
    
    expect(result.current.windowSize.width).toBe(1200)
    expect(result.current.isDesktop).toBe(true)
    expect(result.current.isMobile).toBe(false)
  })
})

describe('useMediaQuery', () => {
  it('should return true when media query matches', () => {
    mockMatchMedia(true)
    
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    
    expect(result.current).toBe(true)
  })

  it('should return false when media query does not match', () => {
    mockMatchMedia(false)
    
    const { result } = renderHook(() => useMediaQuery('(min-width: 768px)'))
    
    expect(result.current).toBe(false)
  })
})