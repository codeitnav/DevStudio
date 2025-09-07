# Authentication Components

This directory contains all authentication-related UI components for the DevStudio frontend application.

## Components

### LoginForm
A form component for user authentication with email and password.

**Features:**
- Email and password validation using Zod
- Form state management with react-hook-form
- Loading states and error handling
- Links to registration and password reset

**Usage:**
```tsx
import { LoginForm } from './components/auth';

<LoginForm 
  onSuccess={() => navigate('/dashboard')}
  redirectTo="/dashboard"
/>
```

### RegisterForm
A form component for new user registration.

**Features:**
- Username, email, and password validation
- Password confirmation matching
- Strong password requirements
- Form validation with helpful error messages

**Usage:**
```tsx
import { RegisterForm } from './components/auth';

<RegisterForm onSuccess={() => navigate('/dashboard')} />
```

### ForgotPasswordForm
A form component for requesting password reset emails.

**Features:**
- Email validation
- Success state with confirmation message
- Error handling for failed requests

**Usage:**
```tsx
import { ForgotPasswordForm } from './components/auth';

<ForgotPasswordForm onSuccess={() => setShowSuccess(true)} />
```

### ResetPasswordForm
A form component for resetting passwords using a reset token.

**Features:**
- Token validation from URL parameters
- New password validation with confirmation
- Success state after password reset
- Automatic authentication after successful reset

**Usage:**
```tsx
import { ResetPasswordForm } from './components/auth';

<ResetPasswordForm onSuccess={() => navigate('/dashboard')} />
```

### AuthGuard
A component for protecting routes and controlling access based on authentication status.

**Features:**
- Route protection for authenticated users
- Redirect to login for unauthenticated users
- Loading states during authentication checks
- Support for public routes that redirect authenticated users

**Usage:**
```tsx
import { AuthGuard, ProtectedRoute, PublicRoute } from './components/auth';

// Protect a route
<AuthGuard requireAuth={true}>
  <Dashboard />
</AuthGuard>

// Or use convenience components
<ProtectedRoute>
  <Dashboard />
</ProtectedRoute>

<PublicRoute>
  <LoginForm />
</PublicRoute>
```

## Validation Schemas

All forms use Zod schemas for validation located in `src/lib/validations.ts`:

- `loginSchema` - Email and password validation
- `registerSchema` - Username, email, password, and confirmation validation
- `forgotPasswordSchema` - Email validation
- `resetPasswordSchema` - Password and confirmation validation

## Form Validation Rules

### Email
- Required field
- Must be a valid email format

### Password (Login)
- Required field
- No complexity requirements for login

### Password (Registration/Reset)
- Minimum 8 characters
- Must contain at least one uppercase letter
- Must contain at least one lowercase letter
- Must contain at least one number

### Username
- Minimum 3 characters
- Maximum 20 characters
- Only letters, numbers, hyphens, and underscores allowed

## Error Handling

All forms include comprehensive error handling:

- **Validation Errors**: Real-time field validation with helpful messages
- **API Errors**: Server-side error messages displayed to users
- **Network Errors**: Graceful handling of connection issues
- **Loading States**: Visual feedback during form submission

## Styling

Components use Tailwind CSS for styling with:

- Consistent color scheme (blue primary, red for errors)
- Responsive design for mobile and desktop
- Accessible focus states and ARIA labels
- Loading spinners and visual feedback

## Testing

Test files are located in the `__tests__` directory:

- `LoginForm.test.tsx` - Login form validation and behavior
- `RegisterForm.test.tsx` - Registration form validation
- `AuthGuard.test.tsx` - Route protection logic
- `validations.test.ts` - Zod schema validation

## Dependencies

- `react-hook-form` - Form state management
- `@hookform/resolvers` - Zod integration
- `zod` - Schema validation
- `react-router-dom` - Navigation and routing
- `tailwindcss` - Styling

## Integration

These components integrate with:

- `AuthContext` - Global authentication state
- `authService` - API calls for authentication
- `httpClient` - HTTP client with token management
- React Router - Navigation and route protection