import React from 'react';
import { useAccessibility } from '../../hooks/useAccessibility';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { Settings, Eye, Type, Volume2 } from 'lucide-react';

interface AccessibilitySettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AccessibilitySettings: React.FC<AccessibilitySettingsProps> = ({
  isOpen,
  onClose,
}) => {
  const {
    settings,
    toggleHighContrast,
    toggleReducedMotion,
    setFontSize,
    toggleScreenReaderMode,
  } = useAccessibility();

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      role="dialog"
      aria-labelledby="accessibility-settings-title"
      aria-modal="true"
    >
      <Card className="w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 
            id="accessibility-settings-title"
            className="text-lg font-semibold flex items-center gap-2"
          >
            <Settings className="h-5 w-5" aria-hidden="true" />
            Accessibility Settings
          </h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            aria-label="Close accessibility settings"
          >
            ×
          </Button>
        </div>

        <div className="space-y-6">
          {/* High Contrast */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Eye className="h-5 w-5 text-gray-600" aria-hidden="true" />
              <div>
                <label htmlFor="high-contrast" className="font-medium">
                  High Contrast
                </label>
                <p className="text-sm text-gray-600">
                  Increase color contrast for better visibility
                </p>
              </div>
            </div>
            <button
              id="high-contrast"
              onClick={toggleHighContrast}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.highContrast ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={settings.highContrast}
              aria-describedby="high-contrast-description"
            >
              <span className="sr-only">Toggle high contrast mode</span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.highContrast ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Reduced Motion */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Volume2 className="h-5 w-5 text-gray-600" aria-hidden="true" />
              <div>
                <label htmlFor="reduced-motion" className="font-medium">
                  Reduced Motion
                </label>
                <p className="text-sm text-gray-600">
                  Minimize animations and transitions
                </p>
              </div>
            </div>
            <button
              id="reduced-motion"
              onClick={toggleReducedMotion}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.reducedMotion ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={settings.reducedMotion}
            >
              <span className="sr-only">Toggle reduced motion</span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {/* Font Size */}
          <div>
            <div className="flex items-center gap-3 mb-3">
              <Type className="h-5 w-5 text-gray-600" aria-hidden="true" />
              <label className="font-medium">Font Size</label>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as const).map((size) => (
                <Button
                  key={size}
                  onClick={() => setFontSize(size)}
                  variant={settings.fontSize === size ? 'primary' : 'outline'}
                  size="sm"
                  className="capitalize"
                  aria-pressed={settings.fontSize === size}
                >
                  {size}
                </Button>
              ))}
            </div>
          </div>

          {/* Screen Reader Mode */}
          <div className="flex items-center justify-between">
            <div>
              <label htmlFor="screen-reader-mode" className="font-medium">
                Screen Reader Mode
              </label>
              <p className="text-sm text-gray-600">
                Enhanced support for screen readers
              </p>
            </div>
            <button
              id="screen-reader-mode"
              onClick={toggleScreenReaderMode}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                settings.screenReaderMode ? 'bg-blue-600' : 'bg-gray-200'
              }`}
              role="switch"
              aria-checked={settings.screenReaderMode}
            >
              <span className="sr-only">Toggle screen reader mode</span>
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.screenReaderMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200">
          <Button
            onClick={onClose}
            variant="primary"
            className="w-full"
          >
            Done
          </Button>
        </div>
      </Card>
    </div>
  );
};