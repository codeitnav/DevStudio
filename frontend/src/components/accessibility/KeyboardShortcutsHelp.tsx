import React from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Keyboard, X } from 'lucide-react';
import { useFocusTrap } from '../../hooks/useFocusManagement';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: Array<{
    keys: string[];
    description: string;
  }>;
}

const shortcutGroups: ShortcutGroup[] = [
  {
    title: 'General',
    shortcuts: [
      { keys: ['Ctrl', 'K'], description: 'Open command palette' },
      { keys: ['Ctrl', 'Shift', 'P'], description: 'Show keyboard shortcuts' },
      { keys: ['Ctrl', ','], description: 'Open settings' },
      { keys: ['Alt', 'A'], description: 'Open accessibility settings' },
      { keys: ['Escape'], description: 'Close modal or cancel action' },
    ],
  },
  {
    title: 'Editor',
    shortcuts: [
      { keys: ['Ctrl', 'S'], description: 'Save file' },
      { keys: ['Ctrl', 'Z'], description: 'Undo' },
      { keys: ['Ctrl', 'Y'], description: 'Redo' },
      { keys: ['Ctrl', 'F'], description: 'Find in file' },
      { keys: ['Ctrl', 'H'], description: 'Find and replace' },
      { keys: ['Ctrl', 'G'], description: 'Go to line' },
      { keys: ['F11'], description: 'Toggle fullscreen' },
    ],
  },
  {
    title: 'File Explorer',
    shortcuts: [
      { keys: ['Ctrl', 'N'], description: 'New file' },
      { keys: ['Ctrl', 'Shift', 'N'], description: 'New folder' },
      { keys: ['F2'], description: 'Rename file/folder' },
      { keys: ['Delete'], description: 'Delete file/folder' },
      { keys: ['Arrow Keys'], description: 'Navigate files' },
      { keys: ['Enter'], description: 'Open file' },
    ],
  },
  {
    title: 'Navigation',
    shortcuts: [
      { keys: ['Ctrl', '1'], description: 'Focus file explorer' },
      { keys: ['Ctrl', '2'], description: 'Focus editor' },
      { keys: ['Ctrl', '3'], description: 'Focus user list' },
      { keys: ['Tab'], description: 'Next focusable element' },
      { keys: ['Shift', 'Tab'], description: 'Previous focusable element' },
    ],
  },
  {
    title: 'Room Management',
    shortcuts: [
      { keys: ['Ctrl', 'Shift', 'C'], description: 'Create new room' },
      { keys: ['Ctrl', 'Shift', 'J'], description: 'Join room' },
      { keys: ['Ctrl', 'Shift', 'L'], description: 'Leave room' },
      { keys: ['Ctrl', 'Shift', 'I'], description: 'Room information' },
    ],
  },
];

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({
  isOpen,
  onClose,
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  useFocusTrap(isOpen, containerRef);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
      role="dialog"
      aria-labelledby="shortcuts-title"
      aria-modal="true"
    >
      <Card 
        ref={containerRef}
        className="w-full max-w-4xl max-h-[90vh] overflow-auto"
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 
              id="shortcuts-title"
              className="text-xl font-semibold flex items-center gap-2"
            >
              <Keyboard className="h-6 w-6" aria-hidden="true" />
              Keyboard Shortcuts
            </h2>
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              aria-label="Close keyboard shortcuts help"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {shortcutGroups.map((group) => (
              <div key={group.title} className="space-y-3">
                <h3 className="font-medium text-lg text-gray-900">
                  {group.title}
                </h3>
                <div className="space-y-2">
                  {group.shortcuts.map((shortcut, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between py-2 px-3 bg-gray-50 rounded-md"
                    >
                      <span className="text-sm text-gray-700">
                        {shortcut.description}
                      </span>
                      <div className="flex items-center gap-1">
                        {shortcut.keys.map((key, keyIndex) => (
                          <React.Fragment key={keyIndex}>
                            <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-white border border-gray-300 rounded shadow-sm">
                              {key}
                            </kbd>
                            {keyIndex < shortcut.keys.length - 1 && (
                              <span className="text-gray-400 text-xs">+</span>
                            )}
                          </React.Fragment>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 p-4 rounded-md">
              <h4 className="font-medium text-blue-900 mb-2">
                Accessibility Tips
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Use Tab and Shift+Tab to navigate between interactive elements</li>
                <li>• Press Enter or Space to activate buttons and links</li>
                <li>• Use arrow keys to navigate within lists and menus</li>
                <li>• Press Escape to close dialogs and cancel actions</li>
                <li>• Enable screen reader mode in accessibility settings for enhanced support</li>
              </ul>
            </div>
          </div>

          <div className="mt-6 flex justify-end">
            <Button onClick={onClose} variant="primary">
              Got it
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};