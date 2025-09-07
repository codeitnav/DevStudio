import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { resetPasswordSchema, ResetPasswordFormData } from '../../lib/validations';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card, CardContent, CardHeader } from '../ui/Card';

interface ResetPasswordFormProps {
  onSuccess?: () => void;
}

export const ResetPasswordForm: React.FC<ResetPasswordFormProps> = ({ onSuccess }) => {
  const { resetPassword } = useAuth();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState<string>('');
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  const token = searchParams.get('token');

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema),
  });

  const onSubmit = async (data: ResetPasswordFormData) => {
    if (!token) {
      setError('Invalid or missing reset token. Please request a new password reset.');
      return;
    }

    try {
      setError('');
      await resetPassword(token, data.password);
      setIsSuccess(true);
      onSuccess?.();
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. Please try again.');
    }
  };

  // Show error if no token is provided
  if (!token) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Invalid Reset Link
          </h2>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <p className="text-gray-600">
              This password reset link is invalid or has expired.
            </p>
            <div className="space-y-2">
              <Link
                to="/forgot-password"
                className="block text-blue-600 hover:text-blue-500 font-medium"
              >
                Request a new password reset
              </Link>
              <Link
                to="/login"
                className="block text-gray-600 hover:text-gray-500"
              >
                Back to sign in
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (isSuccess) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <h2 className="text-2xl font-bold text-center text-gray-900">
            Password reset successful
          </h2>
        </CardHeader>
        <CardContent>
          <div className="text-center space-y-4">
            <div className="rounded-full bg-green-100 p-3 w-16 h-16 mx-auto flex items-center justify-center">
              <svg
                className="w-8 h-8 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-gray-600">
              Your password has been successfully reset. You are now signed in.
            </p>
            <div className="pt-4">
              <Link
                to="/dashboard"
                className="text-blue-600 hover:text-blue-500 font-medium"
              >
                Go to Dashboard
              </Link>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <h2 className="text-2xl font-bold text-center text-gray-900">
          Reset your password
        </h2>
        <p className="text-center text-gray-600 mt-2">
          Enter your new password below.
        </p>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {error && (
            <div className="rounded-md bg-red-50 p-4">
              <div className="text-sm text-red-700">{error}</div>
            </div>
          )}

          <Input
            {...register('password')}
            type="password"
            label="New password"
            placeholder="Enter your new password"
            error={errors.password?.message}
            autoComplete="new-password"
            autoFocus
            helperText="Must be at least 8 characters with uppercase, lowercase, and number"
          />

          <Input
            {...register('confirmPassword')}
            type="password"
            label="Confirm new password"
            placeholder="Confirm your new password"
            error={errors.confirmPassword?.message}
            autoComplete="new-password"
          />

          <Button
            type="submit"
            className="w-full"
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Resetting password...' : 'Reset password'}
          </Button>

          <div className="text-center">
            <Link
              to="/login"
              className="text-sm text-blue-600 hover:text-blue-500 font-medium"
            >
              Back to sign in
            </Link>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};