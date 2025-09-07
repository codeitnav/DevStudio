import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
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

// Mock file operations
Object.defineProperty(window, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

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

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <ToastProvider>
    <AuthProvider>
      {children}
    </AuthProvider>
  </ToastProvider>
);

describe('ProfileSettings', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockAuthService.getCurrentUser.mockResolvedValue(mockUser);
  });

  it('renders profile settings modal when open', () => {
    render(
      <TestWrapper>
        <ProfileSettings isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Preferences')).toBeInTheDocument();
    expect(screen.getByText('Security')).toBeInTheDocument();
    expect(screen.getByText('Account')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(
      <TestWrapper>
        <ProfileSettings isOpen={false} onClose={mockOnClose} />
      </TestWrapper>
    );

    expect(screen.queryByText('Profile Settings')).not.toBeInTheDocument();
  });

  it('switches between tabs correctly', async () => {
    const user = userEvent.setup();
    
    render(
      <TestWrapper>
        <ProfileSettings isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    // Default tab should be Profile
    expect(screen.getByText('Profile Information')).toBeInTheDocument();

    // Switch to Preferences tab
    await user.click(screen.getByText('Preferences'));
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Editor Settings')).toBeInTheDocument();

    // Switch to Security tab
    await user.click(screen.getByText('Security'));
    expect(screen.getByText('Security Settings')).toBeInTheDocument();
    expect(screen.getByText('Change Password')).toBeInTheDocument();

    // Switch to Account tab
    await user.click(screen.getByText('Account'));
    expect(screen.getByText('Account Management')).toBeInTheDocument();
    expect(screen.getByText('Export Your Data')).toBeInTheDocument();
  });

  it('handles profile form submission', async () => {
    const user = userEvent.setup();
    mockAuthService.updateProfile.mockResolvedValue(mockUser);

    render(
      <TestWrapper>
        <ProfileSettings isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    // Fill in profile form
    const usernameInput = screen.getByLabelText(/username/i);
    const emailInput = screen.getByLabelText(/email/i);

    await user.clear(usernameInput);
    await user.type(usernameInput, 'newusername');
    
    await user.clear(emailInput);
    await user.type(emailInput, 'newemail@example.com');

    // Submit form
    const saveButton = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockAuthService.updateProfile).toHaveBeenCalledWith({
        username: 'newusername',
        email: 'newemail@example.com',
      });
    });
  });

  it('handles password change form submission', async () => {
    const user = userEvent.setup();
    mockAuthService.changePassword.mockResolvedValue(undefined);

    render(
      <TestWrapper>
        <ProfileSettings isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    // Switch to Security tab
    await user.click(screen.getByText('Security'));

    // Fill in password form
    await user.type(screen.getByLabelText(/current password/i), 'currentpass');
    await user.type(screen.getByLabelText(/new password/i), 'newpassword123');
    await user.type(screen.getByLabelText(/confirm new password/i), 'newpassword123');

    // Submit form
    const changePasswordButton = screen.getByRole('button', { name: /change password/i });
    await user.click(changePasswordButton);

    await waitFor(() => {
      expect(mockAuthService.changePassword).toHaveBeenCalledWith({
        currentPassword: 'currentpass',
        newPassword: 'newpassword123',
        confirmPassword: 'newpassword123',
      });
    });
  });

  it('handles avatar upload', async () => {
    const user = userEvent.setup();
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' });
    mockAuthService.uploadAvatar.mockResolvedValue({ ...mockUser, avatar: 'avatar-url' });

    render(
      <TestWrapper>
        <ProfileSettings isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const uploadButton = screen.getByText('Upload Avatar');
    await user.click(uploadButton);

    const fileInput = screen.getByRole('button', { name: /upload avatar/i }).parentElement?.querySelector('input[type="file"]');
    expect(fileInput).toBeInTheDocument();

    if (fileInput) {
      await user.upload(fileInput as HTMLInputElement, file);
    }

    await waitFor(() => {
      expect(mockAuthService.uploadAvatar).toHaveBeenCalledWith(file);
    });
  });

  it('validates file type and size for avatar upload', async () => {
    const user = userEvent.setup();
    const invalidFile = new File(['content'], 'document.txt', { type: 'text/plain' });

    render(
      <TestWrapper>
        <ProfileSettings isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const uploadButton = screen.getByText('Upload Avatar');
    await user.click(uploadButton);

    const fileInput = screen.getByRole('button', { name: /upload avatar/i }).parentElement?.querySelector('input[type="file"]');
    
    if (fileInput) {
      await user.upload(fileInput as HTMLInputElement, invalidFile);
    }

    // Should not call upload service for invalid file
    expect(mockAuthService.uploadAvatar).not.toHaveBeenCalled();
  });

  it('opens data export modal', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProfileSettings isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    // Switch to Account tab
    await user.click(screen.getByText('Account'));

    // Click export data button
    const exportButton = screen.getByText('Export Data');
    await user.click(exportButton);

    expect(screen.getByText('Export Your Data')).toBeInTheDocument();
    expect(screen.getByText('Profile Information')).toBeInTheDocument();
    expect(screen.getByText('Room Data')).toBeInTheDocument();
  });

  it('opens account deactivation modal', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProfileSettings isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    // Switch to Account tab
    await user.click(screen.getByText('Account'));

    // Click deactivate account button
    const deactivateButton = screen.getByText('Deactivate Account');
    await user.click(deactivateButton);

    expect(screen.getByText('Deactivate Account')).toBeInTheDocument();
    expect(screen.getByText('Warning: This action cannot be undone')).toBeInTheDocument();
  });

  it('handles preferences updates', async () => {
    const user = userEvent.setup();
    mockAuthService.updateProfile.mockResolvedValue(mockUser);

    render(
      <TestWrapper>
        <ProfileSettings isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    // Switch to Preferences tab
    await user.click(screen.getByText('Preferences'));

    // Change theme
    const themeSelect = screen.getByDisplayValue('Light');
    await user.selectOptions(themeSelect, 'dark');

    // Change font size
    const fontSizeInput = screen.getByDisplayValue('14');
    await user.clear(fontSizeInput);
    await user.type(fontSizeInput, '16');

    // Save preferences
    const saveButton = screen.getByRole('button', { name: /save preferences/i });
    await user.click(saveButton);

    await waitFor(() => {
      expect(mockAuthService.updateProfile).toHaveBeenCalledWith({
        preferences: expect.objectContaining({
          theme: 'dark',
          editorSettings: expect.objectContaining({
            fontSize: 16,
          }),
        }),
      });
    });
  });

  it('closes modal when close button is clicked', async () => {
    const user = userEvent.setup();

    render(
      <TestWrapper>
        <ProfileSettings isOpen={true} onClose={mockOnClose} />
      </TestWrapper>
    );

    const closeButton = screen.getByLabelText('Close dialog');
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });
});