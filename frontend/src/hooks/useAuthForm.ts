import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LoginCredentials, RegisterData, PasswordChangeData } from '../types/user';

interface UseAuthFormOptions {
  onSuccess?: () => void;
  onError?: (error: string) => void;
}

/**
 * Hook for handling authentication form submissions
 */
export const useAuthForm = (options: UseAuthFormOptions = {}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const auth = useAuth();

  const { onSuccess, onError } = options;

  const handleLogin = async (credentials: LoginCredentials) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await auth.login(credentials);
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.message || 'Login failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRegister = async (userData: RegisterData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await auth.register(userData);
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.message || 'Registration failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async (email: string) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await auth.forgotPassword(email);
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to send reset email';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetPassword = async (token: string, password: string) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await auth.resetPassword(token, password);
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.message || 'Password reset failed';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChangePassword = async (passwords: PasswordChangeData) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await auth.changePassword(passwords);
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to change password';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateProfile = async (data: { username?: string; email?: string }) => {
    try {
      setIsSubmitting(true);
      setError(null);
      await auth.updateProfile(data);
      onSuccess?.();
    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update profile';
      setError(errorMessage);
      onError?.(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const clearError = () => setError(null);

  return {
    isSubmitting,
    error,
    clearError,
    handleLogin,
    handleRegister,
    handleForgotPassword,
    handleResetPassword,
    handleChangePassword,
    handleUpdateProfile,
  };
};