import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

interface AuthGuardProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  redirectTo?: string;
}

export const AuthGuard: React.FC<AuthGuardProps> = ({
  children,
  requireAuth = true,
  redirectTo,
}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // If authentication is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    // Redirect to login with the current location as the return URL
    const returnTo = location.pathname + location.search;
    const loginUrl = redirectTo || `/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
    return <Navigate to={loginUrl} replace />;
  }

  // If authentication is not required but user is authenticated
  // (e.g., login page when already logged in)
  if (!requireAuth && isAuthenticated) {
    // Redirect to dashboard or specified redirect URL
    const dashboardUrl = redirectTo || '/';
    return <Navigate to={dashboardUrl} replace />;
  }

  // Render children if authentication requirements are met
  return <>{children}</>;
};

// Higher-order component for protecting routes
export const withAuthGuard = <P extends object>(
  Component: React.ComponentType<P>,
  options?: {
    requireAuth?: boolean;
    redirectTo?: string;
  }
) => {
  const WrappedComponent = (props: P) => (
    <AuthGuard
      requireAuth={options?.requireAuth}
      redirectTo={options?.redirectTo}
    >
      <Component {...props} />
    </AuthGuard>
  );

  WrappedComponent.displayName = `withAuthGuard(${Component.displayName || Component.name})`;
  
  return WrappedComponent;
};

// Convenience components for common use cases
export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGuard requireAuth={true}>{children}</AuthGuard>
);

export const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AuthGuard requireAuth={false}>{children}</AuthGuard>
);