# Authentication System

This directory contains the complete authentication system for the DevStudio frontend application.

## Overview

The authentication system provides:
- HTTP client with automatic token management
- Authentication service with login, register, logout, and profile management
- React context and hooks for authentication state management
- Automatic token refresh and error handling
- Route protection utilities

## Components

### 1. HTTP Client (`lib/httpClient.ts`)

A singleton axios-based HTTP client that handles:
- Automatic JWT token attachment to requests
- Token refresh on 401 responses
- Request/response interceptors
- Error handling and transformation
- Token storage in localStorage

**Key Features:**
- Automatic token refresh when access token expires
- Queue failed requests during token refresh
- Emit logout events when refresh fails
- Standardized error handling

### 2. Authentication Service (`services/authService.ts`)

Implements the `AuthService` interface with methods for:
- `login(credentials)` - User login
- `register(userData)` - User registration
- `logout()` - User logout
- `forgotPassword(email)` - Password reset request
- `resetPassword(token, password)` - Password reset completion
- `getCurrentUser()` - Get current user profile
- `updateProfile(data)` - Update user profile
- `changePassword(passwords)` - Change user password
- `refreshToken()` - Manually refresh tokens
- `isAuthenticated()` - Check authentication status

### 3. Authentication Context (`contexts/AuthContext.tsx`)

React context that provides:
- Global authentication state
- User information
- Loading states
- Authentication methods
- Automatic initialization on app start
- Event handling for logout scenarios

### 4. Authentication Hooks

#### `useAuth()` 
Main hook to access authentication context.

#### `useAuthGuard(options)` (`hooks/useAuthGuard.ts`)
Hook for route protection:
```typescript
const { isAuthenticated, isLoading, canAccess } = useAuthGuard({
  redirectTo: '/login',
  requireAuth: true
});
```

#### `useAuthForm(options)` (`hooks/useAuthForm.ts`)
Hook for handling authentication forms:
```typescript
const {
  isSubmitting,
  error,
  handleLogin,
  handleRegister,
  handleForgotPassword
} = useAuthForm({
  onSuccess: () => navigate('/dashboard'),
  onError: (error) => toast.error(error)
});
```

## Usage Examples

### Basic Setup

```typescript
// App.tsx
import { AuthProvider } from './contexts/AuthContext';

function App() {
  return (
    <AuthProvider>
      <Router>
        {/* Your app routes */}
      </Router>
    </AuthProvider>
  );
}
```

### Using Authentication in Components

```typescript
import { useAuth } from './contexts/AuthContext';

function Dashboard() {
  const { user, logout, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Welcome, {user?.username}!</h1>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

### Protected Routes

```typescript
import { useAuthGuard } from './hooks/useAuthGuard';

function ProtectedRoute({ children }) {
  const { canAccess, isLoading } = useAuthGuard();

  if (isLoading) return <div>Loading...</div>;
  if (!canAccess) return null; // Will redirect to login

  return children;
}
```

### Login Form

```typescript
import { useAuthForm } from './hooks/useAuthForm';

function LoginForm() {
  const { handleLogin, isSubmitting, error } = useAuthForm({
    onSuccess: () => navigate('/dashboard')
  });

  const onSubmit = (data) => {
    handleLogin(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      {error && <div className="error">{error}</div>}
      <input name="email" type="email" required />
      <input name="password" type="password" required />
      <button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Logging in...' : 'Login'}
      </button>
    </form>
  );
}
```

## Configuration

### Environment Variables

```env
VITE_API_URL=http://localhost:5000/api
```

### Token Storage

Tokens are stored in localStorage with keys:
- `devstudio_access_token`
- `devstudio_refresh_token`

## Error Handling

The system handles various error scenarios:
- Network errors
- Authentication errors
- Token expiration
- Server errors
- Validation errors

All errors are transformed into a standardized format with appropriate error types.

## Security Considerations

- JWT tokens are validated for expiration before use
- Automatic token refresh prevents session interruption
- Tokens are cleared on logout and authentication failures
- HTTPS should be used in production
- Consider implementing CSRF protection for state-changing operations

## Testing

The authentication system includes comprehensive tests:
- Unit tests for services and utilities
- Integration tests for authentication flows
- Mocked HTTP client for testing
- React Testing Library for component tests

Run tests with:
```bash
npm run test
```

## API Endpoints

The authentication service expects the following API endpoints:

- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `POST /auth/logout` - User logout
- `POST /auth/forgot-password` - Password reset request
- `POST /auth/reset-password` - Password reset completion
- `POST /auth/refresh` - Token refresh
- `GET /auth/me` - Get current user
- `PUT /auth/profile` - Update user profile
- `PUT /auth/change-password` - Change password

## Next Steps

After implementing the authentication system, you can:
1. Create authentication UI components (LoginForm, RegisterForm, etc.)
2. Set up protected routes using React Router
3. Implement user profile management
4. Add password reset functionality
5. Create authentication guards for different user roles