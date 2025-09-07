# Error Handling System

This directory contains the comprehensive error handling system for the DevStudio frontend application.

## Components

### ErrorBoundary

A React error boundary component that catches JavaScript errors anywhere in the child component tree and displays a fallback UI.

**Features:**
- Catches unhandled React errors
- Displays user-friendly error messages
- Provides retry and reload options
- Shows error details in development mode
- Supports custom fallback UI
- Calls custom error handlers

**Usage:**
```tsx
import { ErrorBoundary } from './components/error/ErrorBoundary';

function App() {
  return (
    <ErrorBoundary onError={(error, errorInfo) => console.log(error)}>
      <MyComponent />
    </ErrorBoundary>
  );
}

// With custom fallback
<ErrorBoundary fallback={<div>Custom error message</div>}>
  <MyComponent />
</ErrorBoundary>
```

### useErrorHandler Hook

A hook that provides error handling functionality for functional components.

**Usage:**
```tsx
import { useErrorHandler } from './components/error/ErrorBoundary';

function MyComponent() {
  const { handleError } = useErrorHandler();

  const handleClick = () => {
    try {
      // Some operation that might fail
    } catch (error) {
      handleError(error);
    }
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

## Toast System

### Toast Component

Individual toast notification component with different types and animations.

**Types:**
- `success` - Green styling for successful operations
- `error` - Red styling for errors
- `warning` - Yellow styling for warnings
- `info` - Blue styling for informational messages

**Features:**
- Auto-dismiss with configurable duration
- Manual close button
- Smooth animations
- Action buttons
- Responsive design

### ToastContainer

Container component that manages multiple toast notifications.

**Features:**
- Stacks multiple toasts
- Handles positioning
- Manages toast lifecycle

### ToastContext & useToast Hook

Context provider and hook for managing toast notifications globally.

**Usage:**
```tsx
import { ToastProvider, useToast } from './contexts/ToastContext';

// Wrap your app
function App() {
  return (
    <ToastProvider>
      <MyApp />
    </ToastProvider>
  );
}

// Use in components
function MyComponent() {
  const { showSuccess, showError, showWarning, showInfo } = useToast();

  const handleSuccess = () => {
    showSuccess('Success!', 'Operation completed successfully');
  };

  const handleError = () => {
    showError('Error!', 'Something went wrong');
  };

  return (
    <div>
      <button onClick={handleSuccess}>Success</button>
      <button onClick={handleError}>Error</button>
    </div>
  );
}
```

## Loading States

### LoadingSpinner Component

Reusable loading spinner with different sizes and colors.

**Usage:**
```tsx
import { LoadingSpinner, LoadingOverlay, LoadingState } from './components/ui/LoadingSpinner';

// Basic spinner
<LoadingSpinner size="md" color="primary" />

// Overlay for existing content
<LoadingOverlay isLoading={true} message="Loading...">
  <MyContent />
</LoadingOverlay>

// Standalone loading state
<LoadingState message="Loading data..." size="lg" />
```

### useLoadingState Hook

Hook for managing loading states with automatic error handling.

**Usage:**
```tsx
import { useLoadingState, useApiCall } from './hooks/useLoadingState';

function MyComponent() {
  const { execute, isLoading, error, data } = useApiCall();

  const loadData = () => {
    execute(() => api.getData());
  };

  if (isLoading) return <LoadingSpinner />;
  if (error) return <div>Error: {error.message}</div>;

  return <div>{data}</div>;
}
```

### useMultipleLoadingStates Hook

Hook for managing multiple concurrent loading states.

**Usage:**
```tsx
import { useMultipleLoadingStates } from './hooks/useLoadingState';

function MyComponent() {
  const { executeWithKey, loadingStates, errors } = useMultipleLoadingStates();

  const loadUser = () => executeWithKey('user', () => api.getUser());
  const loadPosts = () => executeWithKey('posts', () => api.getPosts());

  return (
    <div>
      <button onClick={loadUser} disabled={loadingStates.user}>
        {loadingStates.user ? 'Loading...' : 'Load User'}
      </button>
      <button onClick={loadPosts} disabled={loadingStates.posts}>
        {loadingStates.posts ? 'Loading...' : 'Load Posts'}
      </button>
    </div>
  );
}
```

## Error Handler Utilities

### ErrorHandler Class

Centralized error handling with normalization, retry logic, and toast integration.

**Features:**
- Normalizes different error types to AppError format
- Integrates with toast notifications
- Supports retry mechanisms
- Context-specific error handling
- Logging in development/production

**Usage:**
```tsx
import { handleError, handleAsyncOperation } from './utils/errorHandler';

// Simple error handling
try {
  await someOperation();
} catch (error) {
  await handleError(error, {
    context: 'User Operation',
    fallbackMessage: 'Operation failed',
  });
}

// Async operation with retry
const result = await handleAsyncOperation(
  () => api.getData(),
  {
    retryConfig: 'api',
    context: 'Data Loading',
  }
);
```

### Retry Utilities

Configurable retry mechanisms with exponential backoff.

**Features:**
- Exponential backoff
- Configurable retry conditions
- Maximum delay limits
- Context-specific retry configs

**Usage:**
```tsx
import { withRetry, RETRY_CONFIGS } from './utils/retry';

// Basic retry
const result = await withRetry(
  () => api.getData(),
  {
    maxAttempts: 3,
    delay: 1000,
    backoffMultiplier: 2,
  }
);

// Using predefined configs
const result = await withRetry(
  () => api.getData(),
  RETRY_CONFIGS.api
);
```

## Integration with Existing Services

The error handling system is designed to work seamlessly with existing services:

```tsx
// Enhance existing service calls
import { createErrorHandler } from './utils/errorHandler';

const authErrorHandler = createErrorHandler('Authentication', {
  retryConfig: 'api',
  showToast: true,
});

export const enhancedAuthService = {
  login: (credentials) =>
    authErrorHandler.handleAsyncOperation(
      () => authService.login(credentials),
      { fallbackMessage: 'Login failed. Please try again.' }
    ),
};
```

## Best Practices

1. **Use ErrorBoundary at the app level** to catch unhandled errors
2. **Wrap async operations** with handleAsyncOperation for consistent error handling
3. **Use appropriate loading hooks** (useApiCall, useFileOperation, etc.) based on operation type
4. **Provide context** when handling errors for better debugging
5. **Use fallback messages** for user-friendly error communication
6. **Configure retry policies** based on operation criticality
7. **Test error scenarios** to ensure proper error handling

## Error Types

The system supports the following error types:

- `AUTHENTICATION_ERROR` - Authentication and authorization errors
- `NETWORK_ERROR` - Network connectivity issues
- `ROOM_ACCESS_ERROR` - Room access and permission errors
- `FILE_OPERATION_ERROR` - File system operation errors
- `COLLABORATION_ERROR` - Real-time collaboration errors
- `VALIDATION_ERROR` - Input validation errors
- `SOCKET_ERROR` - WebSocket connection errors
- `UNKNOWN_ERROR` - Unclassified errors

Each error type has specific handling logic and retry policies.