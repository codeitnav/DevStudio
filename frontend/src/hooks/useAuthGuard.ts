import { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

interface UseAuthGuardOptions {
  redirectTo?: string;
  requireAuth?: boolean;
}

/**
 * Hook to protect routes that require authentication
 */
export const useAuthGuard = (options: UseAuthGuardOptions = {}) => {
  const { isAuthenticated, isLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  const { redirectTo = '/login', requireAuth = true } = options;

  useEffect(() => {
    if (!isLoading) {
      if (requireAuth && !isAuthenticated) {
        // Save the attempted location for redirect after login
        navigate(redirectTo, { 
          state: { from: location.pathname },
          replace: true 
        });
      } else if (!requireAuth && isAuthenticated) {
        // Redirect authenticated users away from auth pages
        const from = location.state?.from || '/dashboard';
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate, location, redirectTo, requireAuth]);

  return {
    isAuthenticated,
    isLoading,
    canAccess: requireAuth ? isAuthenticated : true,
  };
};