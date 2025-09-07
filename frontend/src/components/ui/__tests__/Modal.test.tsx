import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Modal } from '../Modal';

// Mock the hooks
vi.mock('../../hooks/useFocusManagement', () => ({
  useFocusTrap: vi.fn(),
}));

vi.mock('../../hooks/useKeyboardNavigation', () => ({
  useKeyboardNavigation: vi.fn(),
}));

describe('Modal', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    children: <div>Modal content</div>,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Create a div to act as the portal root
    const portalRoot = document.createElement('div');
    portalRoot.setAttribute('id', 'portal-root');
    document.body.appendChild(portalRoot);
  });

  afterEach(() => {
    // Clean up any portal elements
    const portals = document.querySelectorAll('[role="dialog"]');
    portals.forEach(portal => portal.remove());
    
    // Reset body overflow
    document.body.style.overflow = 'unset';
  });

  it('renders when isOpen is true', () => {
    render(<Modal {...defaultProps} />);
    
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('does not render when isOpen is false', () => {
    render(<Modal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('renders with title', () => {
    render(<Modal {...defaultProps} title="Test Modal" />);
    
    const title = screen.getByText('Test Modal');
    expect(title).toBeInTheDocument();
    expect(title).toHaveAttribute('id', 'modal-title');
  });

  it('renders close button by default', () => {
    render(<Modal {...defaultProps} title="Test Modal" />);
    
    const closeButton = screen.getByRole('button', { name: /close dialog/i });
    expect(closeButton).toBeInTheDocument();
  });

  it('hides close button when showCloseButton is false', () => {
    render(<Modal {...defaultProps} title="Test Modal" showCloseButton={false} />);
    
    expect(screen.queryByRole('button', { name: /close dialog/i })).not.toBeInTheDocument();
  });

  it('calls onClose when close button is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} title="Test Modal" />);
    
    const closeButton = screen.getByRole('button', { name: /close dialog/i });
    fireEvent.click(closeButton);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when overlay is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    
    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);
    
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('does not call onClose when overlay is clicked and closeOnOverlayClick is false', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} closeOnOverlayClick={false} />);
    
    const overlay = screen.getByRole('dialog');
    fireEvent.click(overlay);
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('does not call onClose when modal content is clicked', () => {
    const onClose = vi.fn();
    render(<Modal {...defaultProps} onClose={onClose} />);
    
    const content = screen.getByText('Modal content');
    fireEvent.click(content);
    
    expect(onClose).not.toHaveBeenCalled();
  });

  it('applies different size classes', () => {
    const { rerender } = render(<Modal {...defaultProps} size="sm" />);
    expect(screen.getByRole('dialog').firstChild).toHaveClass('max-w-sm');

    rerender(<Modal {...defaultProps} size="lg" />);
    expect(screen.getByRole('dialog').firstChild).toHaveClass('max-w-lg');

    rerender(<Modal {...defaultProps} size="full" />);
    expect(screen.getByRole('dialog').firstChild).toHaveClass('max-w-full');
  });

  it('applies custom className', () => {
    render(<Modal {...defaultProps} className="custom-modal" />);
    
    expect(screen.getByRole('dialog').firstChild).toHaveClass('custom-modal');
  });

  it('sets proper ARIA attributes', () => {
    render(
      <Modal 
        {...defaultProps} 
        title="Test Modal"
        aria-describedby="modal-description"
      />
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'modal-title');
    expect(dialog).toHaveAttribute('aria-describedby', 'modal-description');
  });

  it('uses custom aria-labelledby when provided', () => {
    render(
      <Modal 
        {...defaultProps} 
        title="Test Modal"
        aria-labelledby="custom-label"
      />
    );
    
    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-labelledby', 'custom-label');
  });

  it('prevents body scroll when open', () => {
    render(<Modal {...defaultProps} />);
    
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when closed', () => {
    const { rerender } = render(<Modal {...defaultProps} />);
    expect(document.body.style.overflow).toBe('hidden');
    
    rerender(<Modal {...defaultProps} isOpen={false} />);
    expect(document.body.style.overflow).toBe('unset');
  });

  it('handles keyboard navigation when closeOnEscape is true', () => {
    const { useKeyboardNavigation } = require('../../hooks/useKeyboardNavigation');
    
    render(<Modal {...defaultProps} closeOnEscape={true} />);
    
    expect(useKeyboardNavigation).toHaveBeenCalledWith([
      {
        key: 'Escape',
        action: defaultProps.onClose,
        description: 'Close modal',
      }
    ]);
  });

  it('does not set up escape key when closeOnEscape is false', () => {
    const { useKeyboardNavigation } = require('../../hooks/useKeyboardNavigation');
    
    render(<Modal {...defaultProps} closeOnEscape={false} />);
    
    expect(useKeyboardNavigation).toHaveBeenCalledWith([]);
  });

  it('sets up focus trap when open', () => {
    const { useFocusTrap } = require('../../hooks/useFocusManagement');
    
    render(<Modal {...defaultProps} />);
    
    expect(useFocusTrap).toHaveBeenCalledWith(true, expect.any(Object));
  });

  it('announces modal opening to screen readers', () => {
    render(<Modal {...defaultProps} title="Test Modal" />);
    
    const announcement = document.querySelector('[aria-live="polite"]');
    expect(announcement).toBeInTheDocument();
    expect(announcement).toHaveTextContent('Dialog opened: Test Modal');
    expect(announcement).toHaveClass('sr-only');
  });

  it('announces modal opening without title', () => {
    render(<Modal {...defaultProps} />);
    
    const announcement = document.querySelector('[aria-live="polite"]');
    expect(announcement).toHaveTextContent('Dialog opened: Modal dialog');
  });

  it('cleans up announcement when modal closes', () => {
    const { rerender } = render(<Modal {...defaultProps} title="Test Modal" />);
    
    expect(document.querySelector('[aria-live="polite"]')).toBeInTheDocument();
    
    rerender(<Modal {...defaultProps} isOpen={false} title="Test Modal" />);
    
    expect(document.querySelector('[aria-live="polite"]')).not.toBeInTheDocument();
  });

  it('renders content without header when no title and no close button', () => {
    render(<Modal {...defaultProps} showCloseButton={false} />);
    
    expect(screen.queryByRole('banner')).not.toBeInTheDocument();
    expect(screen.getByText('Modal content')).toBeInTheDocument();
  });

  it('supports legacy size prop values', () => {
    const { rerender } = render(<Modal {...defaultProps} size="small" />);
    expect(screen.getByRole('dialog').firstChild).toHaveClass('max-w-sm');

    rerender(<Modal {...defaultProps} size="large" />);
    expect(screen.getByRole('dialog').firstChild).toHaveClass('max-w-4xl');
  });
});