import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, AuthContext } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';
import { LoginForm } from '../../components/auth/LoginForm';
import { RegisterForm } from '../../components/auth/RegisterForm';
import { AuthGuard } from '../../components/auth/AuthGuard';
import { authService } from '../../services/authService';
import { mockUser, mockApiResponse } from '../utils';

// Mock the auth service
vi.mock('../../services/authService', () => ({
  authService: {
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    isAuthenticated: vi.fn(),
    getCurrentUser: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
  },
}));

const mockAuthService = vi.mocked(authService);

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

describe('Authentication Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.isAuthenticated.mockReturnValue(false);
  });

  describe('Login Flow', () => {
    it('should complete successful login flow', async () => {
      const mockLoginResponse = mockApiResponse({
        user: mockUser,
        token: 'access-token',
        refreshToken: 'refresh-token',
      });

      mockAuthService.login.mockResolvedValue(mockLoginResponse.data);
      mockAuthService.isAuthenticated.mockReturnValue(true);

      const onSuccess = vi.fn();

      render(
        <TestWrapper>
          <LoginForm onSuccess={onSuccess} />
        </TestWrapper>
      );

      // Fill in the form
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      // Wait for the login to complete
      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalledWith({
          email: 'test@example.com',
          password: 'password123',
        });
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should handle login errors', async () => {
      mockAuthService.login.mockRejectedValue(new Error('Invalid credentials'));

      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/password/i);
      const submitButton = screen.getByRole('button', { name: /sign in/i });

      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'wrongpassword' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.login).toHaveBeenCalled();
      });

      // Should show error message
      expect(screen.getByText(/invalid credentials/i)).toBeInTheDocument();
    });

    it('should validate form fields', async () => {
      render(
        <TestWrapper>
          <LoginForm />
        </TestWrapper>
      );

      const submitButton = screen.getByRole('button', { name: /sign in/i });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Email is required')).toBeInTheDocument();
        expect(screen.getByText('Password is required')).toBeInTheDocument();
      });

      expect(mockAuthService.login).not.toHaveBeenCalled();
    });
  });

  describe('Registration Flow', () => {
    it('should complete successful registration flow', async () => {
      const mockRegisterResponse = mockApiResponse({
        user: mockUser,
        token: 'access-token',
        refreshToken: 'refresh-token',
      });

      mockAuthService.register.mockResolvedValue(mockRegisterResponse.data);
      mockAuthService.isAuthenticated.mockReturnValue(true);

      const onSuccess = vi.fn();

      render(
        <TestWrapper>
          <RegisterForm onSuccess={onSuccess} />
        </TestWrapper>
      );

      // Fill in the form
      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalledWith({
          username: 'testuser',
          email: 'test@example.com',
          password: 'password123',
          confirmPassword: 'password123',
        });
      });

      expect(onSuccess).toHaveBeenCalled();
    });

    it('should validate password confirmation', async () => {
      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'different' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText('Passwords do not match')).toBeInTheDocument();
      });

      expect(mockAuthService.register).not.toHaveBeenCalled();
    });

    it('should handle registration errors', async () => {
      mockAuthService.register.mockRejectedValue(new Error('Email already exists'));

      render(
        <TestWrapper>
          <RegisterForm />
        </TestWrapper>
      );

      const usernameInput = screen.getByLabelText(/username/i);
      const emailInput = screen.getByLabelText(/email address/i);
      const passwordInput = screen.getByLabelText(/^password$/i);
      const confirmPasswordInput = screen.getByLabelText(/confirm password/i);
      const submitButton = screen.getByRole('button', { name: /create account/i });

      fireEvent.change(usernameInput, { target: { value: 'testuser' } });
      fireEvent.change(emailInput, { target: { value: 'existing@example.com' } });
      fireEvent.change(passwordInput, { target: { value: 'password123' } });
      fireEvent.change(confirmPasswordInput, { target: { value: 'password123' } });
      fireEvent.click(submitButton);

      await waitFor(() => {
        expect(mockAuthService.register).toHaveBeenCalled();
      });

      expect(screen.getByText(/email already exists/i)).toBeInTheDocument();
    });
  });

  describe('Auth Guard', () => {
    it('should render children when user is authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);

      render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected content</div>
          </AuthGuard>
        </TestWrapper>
      );

      expect(screen.getByText('Protected content')).toBeInTheDocument();
    });

    it('should redirect to login when user is not authenticated', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected content</div>
          </AuthGuard>
        </TestWrapper>
      );

      expect(screen.queryByText('Protected content')).not.toBeInTheDocument();
      // Should redirect to login page
    });

    it('should show loading state while checking authentication', () => {
      mockAuthService.isAuthenticated.mockReturnValue(false);

      render(
        <TestWrapper>
          <AuthGuard>
            <div>Protected content</div>
          </AuthGuard>
        </TestWrapper>
      );

      // Should show loading spinner initially
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  describe('Authentication Context', () => {
    it('should provide user data when authenticated', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);

      const TestComponent = () => {
        const { user, isAuthenticated } = React.useContext(AuthContext);
        return (
          <div>
            <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not authenticated'}</div>
            <div data-testid="user-email">{user?.email || 'no user'}</div>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
        expect(screen.getByTestId('user-email')).toHaveTextContent('test@example.com');
      });
    });

    it('should handle logout', async () => {
      mockAuthService.isAuthenticated.mockReturnValue(true);
      mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
      mockAuthService.logout.mockResolvedValue(undefined);

      const TestComponent = () => {
        const { logout, isAuthenticated } = React.useContext(AuthContext);
        return (
          <div>
            <div data-testid="auth-status">{isAuthenticated ? 'authenticated' : 'not authenticated'}</div>
            <button onClick={logout}>Logout</button>
          </div>
        );
      };

      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('authenticated');
      });

      const logoutButton = screen.getByRole('button', { name: /logout/i });
      fireEvent.click(logoutButton);

      await waitFor(() => {
        expect(mockAuthService.logout).toHaveBeenCalled();
      });

      // After logout, should be unauthenticated
      mockAuthService.isAuthenticated.mockReturnValue(false);
      
      await waitFor(() => {
        expect(screen.getByTestId('auth-status')).toHaveTextContent('not authenticated');
      });
    });
  });
});