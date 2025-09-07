import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Toast, ToastData } from '../Toast';
import { afterEach } from 'node:test';

describe('Toast', () => {
  const mockOnClose = vi.fn();

  const defaultToast: ToastData = {
    id: 'test-toast',
    type: 'info',
    title: 'Test Title',
    message: 'Test message',
    duration: 5000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('renders toast with title and message', () => {
    render(<Toast toast={defaultToast} onClose={mockOnClose} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test message')).toBeInTheDocument();
  });

  it('renders toast without message', () => {
    const toastWithoutMessage = { ...defaultToast, message: undefined };
    render(<Toast toast={toastWithoutMessage} onClose={mockOnClose} />);

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.queryByText('Test message')).not.toBeInTheDocument();
  });

  it('renders success toast with correct styling', () => {
    const successToast = { ...defaultToast, type: 'success' as const };
    render(<Toast toast={successToast} onClose={mockOnClose} />);

    const toastElement = screen.getByText('Test Title').closest('div');
    expect(toastElement).toHaveClass('bg-green-50', 'border-green-200', 'text-green-800');
  });

  it('renders error toast with correct styling', () => {
    const errorToast = { ...defaultToast, type: 'error' as const };
    render(<Toast toast={errorToast} onClose={mockOnClose} />);

    const toastElement = screen.getByText('Test Title').closest('div');
    expect(toastElement).toHaveClass('bg-red-50', 'border-red-200', 'text-red-800');
  });

  it('renders warning toast with correct styling', () => {
    const warningToast = { ...defaultToast, type: 'warning' as const };
    render(<Toast toast={warningToast} onClose={mockOnClose} />);

    const toastElement = screen.getByText('Test Title').closest('div');
    expect(toastElement).toHaveClass('bg-yellow-50', 'border-yellow-200', 'text-yellow-800');
  });

  it('calls onClose when close button is clicked', () => {
    render(<Toast toast={defaultToast} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button');
    fireEvent.click(closeButton);

    // Wait for animation
    vi.advanceTimersByTime(300);

    expect(mockOnClose).toHaveBeenCalledWith('test-toast');
  });

  it('auto-closes after duration', async () => {
    render(<Toast toast={defaultToast} onClose={mockOnClose} />);

    // Fast-forward time
    vi.advanceTimersByTime(5000);

    // Wait for animation
    vi.advanceTimersByTime(300);

    expect(mockOnClose).toHaveBeenCalledWith('test-toast');
  });

  it('does not auto-close when duration is 0', () => {
    const persistentToast = { ...defaultToast, duration: 0 };
    render(<Toast toast={persistentToast} onClose={mockOnClose} />);

    vi.advanceTimersByTime(10000);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('renders action button when provided', () => {
    const actionToast = {
      ...defaultToast,
      action: {
        label: 'Retry',
        onClick: vi.fn(),
      },
    };

    render(<Toast toast={actionToast} onClose={mockOnClose} />);

    const actionButton = screen.getByText('Retry');
    expect(actionButton).toBeInTheDocument();

    fireEvent.click(actionButton);
    expect(actionToast.action.onClick).toHaveBeenCalled();
  });

  it('shows correct icon for each toast type', () => {
    const types: Array<ToastData['type']> = ['success', 'error', 'warning', 'info'];

    types.forEach((type) => {
      const { unmount } = render(
        <Toast toast={{ ...defaultToast, type }} onClose={mockOnClose} />
      );

      // Each type should have an SVG icon
      const svgElement = screen.getByRole('button').parentElement?.querySelector('svg');
      expect(svgElement).toBeInTheDocument();

      unmount();
    });
  });
});