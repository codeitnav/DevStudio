import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { ProfileSettings } from '../ProfileSettings';
import { AuthProvider } from '../../../contexts/AuthContext';
import { ToastProvider } from '../../../contexts/ToastContext';

// Mock the auth service
const mockAuthService = {
  updateProfile: vi.fn(),
  changePassword: vi.fn(),
  uploadAvatar: vi.fn(),
  deleteAvatar: vi.fn(),
  deactivateAccount: vi.fn(),
  exportData: vi.fn(),
  getCurrentUser: vi.fn(),
  isAuthenticated: vi.fn(() => true),
};

vi.mock('../../../services/authService', () => ({
  authService: mockAuthService,
}));

// Mock the theme hook
vi.mock('../../../hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    systemTheme: 'light',
  }),
}));

const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  createdAt: new Date(),
  isActive: true,
  avatar: null,
  preferences: {
    theme: 'light' as const,
    editorSettings: {
      fontSize: 14,
      fontFamily: 'Monaco, Consolas, monospace',
      tabSize: 2,
      wordWrap: true,
      minimap: true,
      lineNumbers: true,
      autoSave: true,
      autoSaveDelay: 1000,
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      soundEnabled: true,
    },
  },
};

// Mock the AuthContext
vi.mock('../../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    updateProfile: vi.fn(),
    changePassword: vi.fn(),
    uploadAvatar: vi.fn(),
    deleteAvatar: vi.fn(),
    deactivateAccount: vi.fn(),
    exportData: vi.fn(),
  }),
  AuthProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock the ToastContext
vi.mock('../../../contexts/ToastContext', () => ({
  useToast: () => ({
    showSuccess: vi.fn(),
    showError: vi.fn(),
    showInfo: vi.fn(),
    showWarning: vi.fn(),
  }),
  ToastProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ToastProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </ToastProvider>
);

describe('ProfileSettings Integration', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders without crashing when open', () => {
    render(
      <TestWrapper>
        <ProfileSettings isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <TestWrapper>
        <ProfileSettings isOpen={false} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();
  });

  it('renders all main tabs', () => {
    render(
      <TestWrapper>
        <ProfileSettings isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('renders profile information by default', () => {
    render(
      <TestWrapper>
        <ProfileSettings isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByText('Profile Information')).toBeInTheDocument();
    expect(screen.getByLabelText(/username/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
  });
});