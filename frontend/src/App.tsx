import React, { useState, useEffect } from 'react'
import { RouterProvider } from 'react-router-dom'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { AuthProvider } from './contexts/AuthContext'
import { ToastProvider, useToast } from './contexts/ToastContext'
import { ErrorBoundary } from './components/error/ErrorBoundary'
import { errorHandler } from './utils/errorHandler'
import { router } from './router'
import { SkipLinks } from './components/accessibility/SkipLinks'
import { AccessibilitySettings } from './components/accessibility/AccessibilitySettings'
import { KeyboardShortcutsHelp } from './components/accessibility/KeyboardShortcutsHelp'
import { useAccessibility } from './hooks/useAccessibility'
import { useKeyboardNavigation } from './hooks/useKeyboardNavigation'
import { useServiceWorker } from './hooks/useServiceWorker'
import { performanceMonitor } from './utils/performance'
import './App.css'
import './styles/accessibility.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

// Component to initialize error handler with toast and accessibility
function AppWithErrorHandling() {
  const { showErrorFromAppError, showToast } = useToast();
  const [showAccessibilitySettings, setShowAccessibilitySettings] = useState(false);
  const [showKeyboardHelp, setShowKeyboardHelp] = useState(false);
  
  // Initialize accessibility
  useAccessibility();

  // Initialize service worker
  const { isOffline, updateAvailable, updateApp } = useServiceWorker();

  // Show offline/online status
  useEffect(() => {
    if (isOffline) {
      showToast({
        title: 'Connection Status',
        message: 'You are currently offline. Some features may be limited.',
        type: 'warning'
      });
    }
  }, [isOffline, showToast]);

  // Show update available notification
  useEffect(() => {
    if (updateAvailable) {
      showToast({
        title: 'Update Available',
        message: 'A new version is available. Click to update.',
        type: 'info',
        action: {
          label: 'Update',
          onClick: updateApp,
        },
        duration: 0, // Don't auto-dismiss
      });
    }
  }, [updateAvailable, updateApp, showToast]);

  // Global keyboard shortcuts
  const shortcuts = [
    {
      key: 'a',
      altKey: true,
      action: () => setShowAccessibilitySettings(true),
      description: 'Open accessibility settings'
    },
    {
      key: 'p',
      ctrlKey: true,
      shiftKey: true,
      action: () => setShowKeyboardHelp(true),
      description: 'Show keyboard shortcuts'
    },
    {
      key: '?',
      shiftKey: true,
      action: () => setShowKeyboardHelp(true),
      description: 'Show keyboard shortcuts'
    }
  ];

  useKeyboardNavigation(shortcuts);

  // Initialize error handler with toast functionality
  React.useEffect(() => {
    errorHandler.setToastHandler(showErrorFromAppError);
  }, [showErrorFromAppError]);

  // Initialize performance monitoring
  React.useEffect(() => {
    performanceMonitor.startTiming('App initialization');
    
    return () => {
      performanceMonitor.endTiming('App initialization');
    };
  }, []);

  return (
    <>
      <SkipLinks />
      <RouterProvider router={router} />
      <AccessibilitySettings
        isOpen={showAccessibilitySettings}
        onClose={() => setShowAccessibilitySettings(false)}
      />
      <KeyboardShortcutsHelp
        isOpen={showKeyboardHelp}
        onClose={() => setShowKeyboardHelp(false)}
      />
    </>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthProvider>
            <AppWithErrorHandling />
          </AuthProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  )
}

export default App
