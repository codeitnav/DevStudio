# Routing Implementation

This directory contains the routing configuration for the DevStudio frontend application.

## Structure

- `index.tsx` - Main router configuration using React Router v6
- `__tests__/` - Router-related tests

## Features Implemented

### 1. Route Structure
- **Protected Routes**: Main application routes that require authentication
- **Public Routes**: Authentication-related routes (login, register, etc.)
- **Nested Routes**: Organized using React Router's nested routing system

### 2. Layouts
- **MainLayout**: Used for authenticated user pages with sidebar navigation
- **AuthLayout**: Used for authentication pages with centered content

### 3. Route Protection
- Uses `AuthGuard` component to protect routes that require authentication
- Automatically redirects unauthenticated users to login

### 4. Navigation Structure
```
/ (protected)
├── Dashboard (/)
├── Rooms (/rooms)
├── Room View (/room/:roomId)
├── Files (/files) - placeholder
├── Settings (/settings) - placeholder
└── Profile (/profile) - placeholder

/auth (public)
├── Login (/auth/login)
├── Register (/auth/register)
├── Forgot Password (/auth/forgot-password)
└── Reset Password (/auth/reset-password)

Legacy redirects:
├── /login → /auth/login
├── /register → /auth/register
└── /forgot-password → /auth/forgot-password
```

### 5. Responsive Design
- **Desktop**: Full sidebar navigation always visible
- **Mobile**: Collapsible sidebar with hamburger menu
- **Tablet**: Responsive layout adapts to screen size

### 6. Error Handling
- 404 page for unknown routes
- Proper error boundaries (to be implemented in error handling task)

## Usage

The router is configured in `src/router/index.tsx` and used in the main `App.tsx`:

```tsx
import { RouterProvider } from 'react-router-dom'
import { router } from './router'

function App() {
  return <RouterProvider router={router} />
}
```

## Components

### Layout Components
- `Header`: Top navigation bar with user menu and branding
- `Sidebar`: Left navigation panel with main app navigation
- `MainLayout`: Combines header and sidebar for authenticated pages
- `AuthLayout`: Simple layout for authentication pages

### Page Components
- `Dashboard`: Main landing page for authenticated users
- `Rooms`: Room management and listing page
- `Room`: Individual room view with collaborative editor
- `NotFound`: 404 error page

## Requirements Satisfied

This implementation satisfies the following requirements from the spec:

- **7.1**: Responsive layout optimized for mobile devices
- **7.2**: Adaptive interface for medium-sized screens (tablets)
- **7.3**: Effective utilization of full screen space on desktop
- **Navigation**: Seamless navigation between authentication, dashboard, and room views
- **Route Protection**: Proper authentication guards for protected routes

## Future Enhancements

- Add breadcrumb navigation for nested routes
- Implement route-based code splitting for better performance
- Add route transition animations
- Implement deep linking for room invitations
- Add route-based analytics tracking