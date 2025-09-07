import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { Profile } from '../Profile';
import { AuthProvider } from '../../contexts/AuthContext';
import { ToastProvider } from '../../contexts/ToastContext';

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

vi.mock('../../services/authService', () => ({
  authService: mockAuthService,
}));

// Mock the theme hook
vi.mock('../../hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: vi.fn(),
    systemTheme: 'light',
  }),
}));

// Mock react-router-dom navigate
const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  createdAt: new Date('2023-01-01'),
  lastLogin: new Date('2024-01-01'),
  isActive: true,
  avatar: 'https://example.com/avatar.jpg',
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

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    <ToastProvider>
      <AuthProvider>
        {children}
      </AuthProvider>
    </ToastProvider>
  </BrowserRouter>
);

describe('Profile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
  });

  it('renders profile page with user information', () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('testuser')).toBeInTheDocument();
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
    expect(screen.getByText('Member since 1/1/2023')).toBeInTheDocument();
    expect(screen.getByText('Last login: 1/1/2024')).toBeInTheDocument();
  });

  it('displays user avatar when available', () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    const avatar = screen.getByAltText('Profile avatar');
    expect(avatar).toBeInTheDocument();
    expect(avatar).toHaveAttribute('src', 'https://example.com/avatar.jpg');
  });

  it('displays default avatar when user has no avatar', () => {
    const userWithoutAvatar = { ...mockUser, avatar: undefined };
    vi.mocked(require('../../contexts/AuthContext').useAuth).mockReturnValue({
      user: userWithoutAvatar,
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      uploadAvatar: vi.fn(),
      deleteAvatar: vi.fn(),
      deactivateAccount: vi.fn(),
      exportData: vi.fn(),
    });

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    // Should show default user icon instead of image
    expect(screen.queryByAltText('Profile avatar')).not.toBeInTheDocument();
  });

  it('displays account status correctly', () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  it('displays inactive status for inactive users', () => {
    const inactiveUser = { ...mockUser, isActive: false };
    vi.mocked(require('../../contexts/AuthContext').useAuth).mockReturnValue({
      user: inactiveUser,
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      uploadAvatar: vi.fn(),
      deleteAvatar: vi.fn(),
      deactivateAccount: vi.fn(),
      exportData: vi.fn(),
    });

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    expect(screen.getByText('Inactive')).toBeInTheDocument();
  });

  it('displays user preferences when available', () => {
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    expect(screen.getByText('Current Preferences')).toBeInTheDocument();
    expect(screen.getByText('light')).toBeInTheDocument();
    expect(screen.getByText('Font Size: 14px')).toBeInTheDocument();
    expect(screen.getByText('Tab Size: 2 spaces')).toBeInTheDocument();
    expect(screen.getByText('Auto Save: Enabled')).toBeInTheDocument();
    expect(screen.getByText('Email: Enabled')).toBeInTheDocument();
    expect(screen.getByText('Push: Enabled')).toBeInTheDocument();
    expect(screen.getByText('Sound: Enabled')).toBeInTheDocument();
  });

  it('does not display preferences section when user has no preferences', () => {
    const userWithoutPreferences = { ...mockUser, preferences: undefined };
    vi.mocked(require('../../contexts/AuthContext').useAuth).mockReturnValue({
      user: userWithoutPreferences,
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      uploadAvatar: vi.fn(),
      deleteAvatar: vi.fn(),
      deactivateAccount: vi.fn(),
      exportData: vi.fn(),
    });

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    expect(screen.queryByText('Current Preferences')).not.toBeInTheDocument();
  });

  it('opens profile settings modal when edit button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    const editButton = screen.getByText('Edit Profile');
    await user.click(editButton);

    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
  });

  it('navigates back when back button is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    const backButton = screen.getByText('Back');
    await user.click(backButton);

    expect(mockNavigate).toHaveBeenCalledWith(-1);
  });

  it('handles disabled preferences correctly', () => {
    const userWithDisabledPreferences = {
      ...mockUser,
      preferences: {
        ...mockUser.preferences,
        editorSettings: {
          ...mockUser.preferences.editorSettings,
          autoSave: false,
        },
        notifications: {
          emailNotifications: false,
          pushNotifications: false,
          soundEnabled: false,
        },
      },
    };

    vi.mocked(require('../../contexts/AuthContext').useAuth).mockReturnValue({
      user: userWithDisabledPreferences,
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      uploadAvatar: vi.fn(),
      deleteAvatar: vi.fn(),
      deactivateAccount: vi.fn(),
      exportData: vi.fn(),
    });

    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    expect(screen.getByText('Auto Save: Disabled')).toBeInTheDocument();
    expect(screen.getByText('Email: Disabled')).toBeInTheDocument();
    expect(screen.getByText('Push: Disabled')).toBeInTheDocument();
    expect(screen.getByText('Sound: Disabled')).toBeInTheDocument();
  });

  it('does not render when user is not available', () => {
    vi.mocked(require('../../contexts/AuthContext').useAuth).mockReturnValue({
      user: null,
      updateProfile: vi.fn(),
      changePassword: vi.fn(),
      uploadAvatar: vi.fn(),
      deleteAvatar: vi.fn(),
      deactivateAccount: vi.fn(),
      exportData: vi.fn(),
    });

    const { container } = render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    expect(container.firstChild).toBeNull();
  });

  it('closes profile settings modal when onClose is called', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <Profile />
      </TestWrapper>
    );

    // Open modal
    const editButton = screen.getByText('Edit Profile');
    await user.click(editButton);

    expect(screen.getByText('Profile Settings')).toBeInTheDocument();

    // Close modal (this would be triggered by the ProfileSettings component)
    const closeButton = screen.getByLabelText('Close dialog');
    await user.click(closeButton);

    await waitFor(() => {
      expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();
    });
  });
});