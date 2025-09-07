import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AccessibilitySettings } from '../AccessibilitySettings';
import { useAccessibility } from '../../../hooks/useAccessibility';

// Mock the useAccessibility hook
jest.mock('../../../hooks/useAccessibility');

const mockUseAccessibility = useAccessibility as jest.MockedFunction<typeof useAccessibility>;

describe('AccessibilitySettings', () => {
  const mockToggleHighContrast = jest.fn();
  const mockToggleReducedMotion = jest.fn();
  const mockSetFontSize = jest.fn();
  const mockToggleScreenReaderMode = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    mockUseAccessibility.mockReturnValue({
      settings: {
        highContrast: false,
        reducedMotion: false,
        fontSize: 'medium',
        screenReaderMode: false,
      },
      updateSettings: jest.fn(),
      toggleHighContrast: mockToggleHighContrast,
      toggleReducedMotion: mockToggleReducedMotion,
      setFontSize: mockSetFontSize,
      toggleScreenReaderMode: mockToggleScreenReaderMode,
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should not render when isOpen is false', () => {
    render(
      <AccessibilitySettings isOpen={false} onClose={mockOnClose} />
    );

    expect(screen.queryByText('Accessibility Settings')).not.toBeInTheDocument();
  });

  it('should render when isOpen is true', () => {
    render(
      <AccessibilitySettings isOpen={true} onClose={mockOnClose} />
    );

    expect(screen.getByText('Accessibility Settings')).toBeInTheDocument();
  });

  it('should have proper ARIA attributes', () => {
    render(
      <AccessibilitySettings isOpen={true} onClose={mockOnClose} />
    );

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'accessibility-settings-title');
  });

  it('should toggle high contrast when switch is clicked', () => {
    render(
      <AccessibilitySettings isOpen={true} onClose={mockOnClose} />
    );

    const highContrastSwitch = screen.getByRole('switch', { name: /toggle high contrast/i });
    fireEvent.click(highContrastSwitch);

    expect(mockToggleHighContrast).toHaveBeenCalled();
  });

  it('should toggle reduced motion when switch is clicked', () => {
    render(
      <AccessibilitySettings isOpen={true} onClose={mockOnClose} />
    );

    const reducedMotionSwitch = screen.getByRole('switch', { name: /toggle reduced motion/i });
    fireEvent.click(reducedMotionSwitch);

    expect(mockToggleReducedMotion).toHaveBeenCalled();
  });

  it('should set font size when button is clicked', () => {
    render(
      <AccessibilitySettings isOpen={true} onClose={mockOnClose} />
    );

    const largeButton = screen.getByRole('button', { name: /large/i });
    fireEvent.click(largeButton);

    expect(mockSetFontSize).toHaveBeenCalledWith('large');
  });

  it('should toggle screen reader mode when switch is clicked', () => {
    render(
      <AccessibilitySettings isOpen={true} onClose={mockOnClose} />
    );

    const screenReaderSwitch = screen.getByRole('switch', { name: /toggle screen reader mode/i });
    fireEvent.click(screenReaderSwitch);

    expect(mockToggleScreenReaderMode).toHaveBeenCalled();
  });

  it('should call onClose when close button is clicked', () => {
    render(
      <AccessibilitySettings isOpen={true} onClose={mockOnClose} />
    );

    const closeButton = screen.getByRole('button', { name: /close accessibility settings/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should call onClose when Done button is clicked', () => {
    render(
      <AccessibilitySettings isOpen={true} onClose={mockOnClose} />
    );

    const doneButton = screen.getByRole('button', { name: /done/i });
    fireEvent.click(doneButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should show correct switch states based on settings', () => {
    mockUseAccessibility.mockReturnValue({
      settings: {
        highContrast: true,
        reducedMotion: true,
        fontSize: 'large',
        screenReaderMode: true,
      },
      updateSettings: jest.fn(),
      toggleHighContrast: mockToggleHighContrast,
      toggleReducedMotion: mockToggleReducedMotion,
      setFontSize: mockSetFontSize,
      toggleScreenReaderMode: mockToggleScreenReaderMode,
    });

    render(
      <AccessibilitySettings isOpen={true} onClose={mockOnClose} />
    );

    expect(screen.getByRole('switch', { name: /toggle high contrast/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: /toggle reduced motion/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('switch', { name: /toggle screen reader mode/i })).toHaveAttribute('aria-checked', 'true');
    expect(screen.getByRole('button', { name: /large/i })).toHaveAttribute('aria-pressed', 'true');
  });
});