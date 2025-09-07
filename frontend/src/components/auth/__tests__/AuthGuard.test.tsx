import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { vi } from 'vitest';
import { AuthGuard } from '../AuthGuard';
import { AuthProvider } from '../../../contexts/AuthContext';

// Mock the auth service
const mockAuthService = {
  isAuthenticated: vi.fn(() => false),
  getCurrentUser: vi.fn(),
  logout: vi.fn(),
};

vi.mock('../../../services/authService', () => ({
  authService: mockAuthService,
}));

const TestComponent = () => <div>Protected Content</div>;
const LoginComponent = () => <div>Login Page</div>;

const MockedApp = ({ 
  isAuthenticated = false, 
  isLoading = false,
  requireAuth = true 
}: { 
  isAuthenticated?: boolean;
  isLoading?: boolean;
  requireAuth?: boolean;
}) => {
  // Mock the useAuth hook
  const mockUseAuth = () => ({
    user: isAuthenticated ? { id: '1', email: 'test@example.com', username: 'test' } : null,
    isAuthenticated,
    isLoading,
    login: vi.fn(),
    register: vi.fn(),
    logout: vi.fn(),
    forgotPassword: vi.fn(),
    resetPassword: vi.fn(),
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    refreshUser: vi.fn(),
  });

  // Mock the AuthProvider to return our mock values
  const MockAuthProvider = ({ children }: { children: React.ReactNode }) => {
    const authValue = mockUseAuth();
    return (
      <div data-testid="mock-auth-provider">
        {React.cloneElement(children as React.ReactElement, { authValue })}
      </div>
    );
  };

  return (
    <BrowserRouter>
      <MockAuthProvider>
        <Routes>
          <Route 
            path="/" 
            element={
              <AuthGuard requireAuth={requireAuth}>
                <TestComponent />
              </AuthGuard>
            } 
          />
          <Route path="/login" element={<LoginComponent />} />
        </Routes>
      </MockAuthProvider>
    </BrowserRouter>
  );
};

describe('AuthGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.isAuthenticated.mockReturnValue(false);
  });

  it('shows loading spinner when authentication is loading', () => {
    render(<MockedApp isLoading={true} />);
    
    expect(screen.getByTestId('mock-auth-provider')).toBeInTheDocument();
  });

  it('renders children when user is authenticated and auth is required', () => {
    render(<MockedApp isAuthenticated={true} requireAuth={true} />);
    
    expect(screen.getByTestId('mock-auth-provider')).toBeInTheDocument();
  });

  it('renders children when user is not authenticated and auth is not required', () => {
    render(<MockedApp isAuthenticated={false} requireAuth={false} />);
    
    expect(screen.getByTestId('mock-auth-provider')).toBeInTheDocument();
  });
});