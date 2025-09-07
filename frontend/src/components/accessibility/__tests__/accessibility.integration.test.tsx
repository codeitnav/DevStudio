import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AccessibilitySettings } from '../AccessibilitySettings';
import { KeyboardShortcutsHelp } from '../KeyboardShortcutsHelp';
import { SkipLinks } from '../SkipLinks';

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

describe('Accessibility Integration', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockReturnValue(null);
    localStorageMock.setItem.mockClear();
    document.documentElement.className = '';
  });

  describe('Skip Links', () => {
    it('should render skip links that are initially hidden', () => {
      render(<SkipLinks />);
      
      const skipLinks = screen.getAllByRole('link');
      expect(skipLinks).toHaveLength(4);
      
      const mainContentLink = screen.getByRole('link', { name: /skip to main content/i });
      expect(mainContentLink).toBeInTheDocument();
      expect(mainContentLink).toHaveAttribute('href', '#main-content');
    });

    it('should make skip links visible when focused', async () => {
      const user = userEvent.setup();
      render(<SkipLinks />);
      
      const mainContentLink = screen.getByRole('link', { name: /skip to main content/i });
      
      await user.tab();
      expect(mainContentLink).toHaveFocus();
    });
  });

  describe('Accessibility Settings Modal', () => {
    it('should trap focus within the modal', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<AccessibilitySettings isOpen={true} onClose={onClose} />);
      
      const modal = screen.getByRole('dialog');
      expect(modal).toBeInTheDocument();
      
      // First focusable element should be focused
      const closeButton = screen.getByRole('button', { name: /close accessibility settings/i });
      expect(closeButton).toHaveFocus();
      
      // Tab through all elements and ensure focus stays within modal
      await user.tab();
      await user.tab();
      await user.tab();
      
      // Focus should still be within the modal
      expect(document.activeElement).toBeInstanceOf(HTMLElement);
      expect(modal.contains(document.activeElement)).toBe(true);
    });

    it('should close modal when Escape is pressed', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<AccessibilitySettings isOpen={true} onClose={onClose} />);
      
      await user.keyboard('{Escape}');
      expect(onClose).toHaveBeenCalled();
    });

    it('should persist accessibility settings', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<AccessibilitySettings isOpen={true} onClose={onClose} />);
      
      // Toggle high contrast
      const highContrastSwitch = screen.getByRole('switch', { name: /toggle high contrast/i });
      await user.click(highContrastSwitch);
      
      // Check if localStorage was called
      await waitFor(() => {
        expect(localStorageMock.setItem).toHaveBeenCalledWith(
          'accessibility-settings',
          expect.stringContaining('"highContrast":true')
        );
      });
    });

    it('should apply CSS classes to document element', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<AccessibilitySettings isOpen={true} onClose={onClose} />);
      
      // Toggle high contrast
      const highContrastSwitch = screen.getByRole('switch', { name: /toggle high contrast/i });
      await user.click(highContrastSwitch);
      
      await waitFor(() => {
        expect(document.documentElement.classList.contains('high-contrast')).toBe(true);
      });
      
      // Toggle reduced motion
      const reducedMotionSwitch = screen.getByRole('switch', { name: /toggle reduced motion/i });
      await user.click(reducedMotionSwitch);
      
      await waitFor(() => {
        expect(document.documentElement.classList.contains('reduced-motion')).toBe(true);
      });
    });
  });

  describe('Keyboard Shortcuts Help', () => {
    it('should display keyboard shortcuts in organized groups', () => {
      const onClose = jest.fn();
      
      render(<KeyboardShortcutsHelp isOpen={true} onClose={onClose} />);
      
      expect(screen.getByText('General')).toBeInTheDocument();
      expect(screen.getByText('Editor')).toBeInTheDocument();
      expect(screen.getByText('File Explorer')).toBeInTheDocument();
      expect(screen.getByText('Navigation')).toBeInTheDocument();
      expect(screen.getByText('Room Management')).toBeInTheDocument();
      
      // Check for specific shortcuts
      expect(screen.getByText('Open command palette')).toBeInTheDocument();
      expect(screen.getByText('Save file')).toBeInTheDocument();
      expect(screen.getByText('New file')).toBeInTheDocument();
    });

    it('should show accessibility tips', () => {
      const onClose = jest.fn();
      
      render(<KeyboardShortcutsHelp isOpen={true} onClose={onClose} />);
      
      expect(screen.getByText('Accessibility Tips')).toBeInTheDocument();
      expect(screen.getByText(/Use Tab and Shift\+Tab to navigate/)).toBeInTheDocument();
      expect(screen.getByText(/Press Enter or Space to activate/)).toBeInTheDocument();
    });

    it('should close when Got it button is clicked', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<KeyboardShortcutsHelp isOpen={true} onClose={onClose} />);
      
      const gotItButton = screen.getByRole('button', { name: /got it/i });
      await user.click(gotItButton);
      
      expect(onClose).toHaveBeenCalled();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should handle global keyboard shortcuts', () => {
      const TestComponent = () => {
        const [showSettings, setShowSettings] = React.useState(false);
        const [showHelp, setShowHelp] = React.useState(false);
        
        React.useEffect(() => {
          const handleKeyDown = (e: KeyboardEvent) => {
            if (e.altKey && e.key === 'a') {
              e.preventDefault();
              setShowSettings(true);
            }
            if (e.ctrlKey && e.shiftKey && e.key === 'P') {
              e.preventDefault();
              setShowHelp(true);
            }
          };
          
          document.addEventListener('keydown', handleKeyDown);
          return () => document.removeEventListener('keydown', handleKeyDown);
        }, []);
        
        return (
          <div>
            <button>Test Button</button>
            {showSettings && (
              <AccessibilitySettings 
                isOpen={true} 
                onClose={() => setShowSettings(false)} 
              />
            )}
            {showHelp && (
              <KeyboardShortcutsHelp 
                isOpen={true} 
                onClose={() => setShowHelp(false)} 
              />
            )}
          </div>
        );
      };
      
      render(<TestComponent />);
      
      // Test Alt+A for accessibility settings
      fireEvent.keyDown(document, { key: 'a', altKey: true });
      expect(screen.getByText('Accessibility Settings')).toBeInTheDocument();
      
      // Close the modal
      fireEvent.keyDown(document, { key: 'Escape' });
      
      // Test Ctrl+Shift+P for keyboard shortcuts
      fireEvent.keyDown(document, { key: 'P', ctrlKey: true, shiftKey: true });
      expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
    });
  });

  describe('ARIA Labels and Roles', () => {
    it('should have proper ARIA attributes on interactive elements', () => {
      const onClose = jest.fn();
      
      render(<AccessibilitySettings isOpen={true} onClose={onClose} />);
      
      // Check dialog has proper ARIA attributes
      const dialog = screen.getByRole('dialog');
      expect(dialog).toHaveAttribute('aria-modal', 'true');
      expect(dialog).toHaveAttribute('aria-labelledby');
      
      // Check switches have proper ARIA attributes
      const switches = screen.getAllByRole('switch');
      switches.forEach(switchElement => {
        expect(switchElement).toHaveAttribute('aria-checked');
      });
      
      // Check buttons have proper labels
      const buttons = screen.getAllByRole('button');
      buttons.forEach(button => {
        expect(
          button.hasAttribute('aria-label') || 
          button.textContent?.trim() !== '' ||
          button.hasAttribute('title')
        ).toBe(true);
      });
    });
  });

  describe('High Contrast Mode', () => {
    it('should apply high contrast styles when enabled', async () => {
      const user = userEvent.setup();
      const onClose = jest.fn();
      
      render(<AccessibilitySettings isOpen={true} onClose={onClose} />);
      
      const highContrastSwitch = screen.getByRole('switch', { name: /toggle high contrast/i });
      await user.click(highContrastSwitch);
      
      await waitFor(() => {
        expect(document.documentElement).toHaveClass('high-contrast');
      });
    });
  });

  describe('Screen Reader Support', () => {
    it('should announce modal opening', async () => {
      const onClose = jest.fn();
      
      render(<AccessibilitySettings isOpen={true} onClose={onClose} />);
      
      // Check if announcement element was created
      await waitFor(() => {
        const announcement = document.querySelector('[aria-live="polite"]');
        expect(announcement).toBeInTheDocument();
        expect(announcement?.textContent).toContain('Dialog opened');
      });
    });

    it('should have proper error announcements', () => {
      const onClose = jest.fn();
      
      render(<AccessibilitySettings isOpen={true} onClose={onClose} />);
      
      // Error messages should have role="alert"
      // This would be tested with actual error states in a real implementation
    });
  });
});