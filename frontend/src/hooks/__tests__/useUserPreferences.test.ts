import { renderHook, act, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useUserPreferences } from '../useUserPreferences';
import { AuthProvider } from '../../contexts/AuthContext';
import React from 'react';

// Mock the auth context
const mockUpdateProfile = vi.fn();
const mockUser = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  createdAt: new Date(),
  isActive: true,
  preferences: {
    theme: 'dark' as const,
    editorSettings: {
      fontSize: 16,
      fontFamily: 'Fira Code, monospace',
      tabSize: 4,
      wordWrap: false,
      minimap: false,
      lineNumbers: true,
      autoSave: true,
      autoSaveDelay: 2000,
    },
    notifications: {
      emailNotifications: false,
      pushNotifications: true,
      soundEnabled: false,
    },
  },
};

vi.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: mockUser,
    updateProfile: mockUpdateProfile,
  }),
}));

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useUserPreferences', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  it('initializes with user preferences when user is authenticated', () => {
    const { result } = renderHook(() => useUserPreferences());

    expect(result.current.preferences).toEqual(mockUser.preferences);
    expect(result.current.isLoading).toBe(false);
  });

  it('initializes with default preferences when user has no preferences', () => {
    vi.mocked(require('../../contexts/AuthContext').useAuth).mockReturnValue({
      user: { ...mockUser, preferences: undefined },
      updateProfile: mockUpdateProfile,
    });

    const { result } = renderHook(() => useUserPreferences());

    expect(result.current.preferences.theme).toBe('system');
    expect(result.current.preferences.editorSettings.fontSize).toBe(14);
    expect(result.current.preferences.notifications.emailNotifications).toBe(true);
  });

  it('loads preferences from localStorage when user is not authenticated', () => {
    const savedPreferences = {
      theme: 'light',
      editorSettings: {
        fontSize: 18,
        tabSize: 8,
      },
      notifications: {
        soundEnabled: false,
      },
    };

    localStorageMock.getItem.mockReturnValue(JSON.stringify(savedPreferences));
    vi.mocked(require('../../contexts/AuthContext').useAuth).mockReturnValue({
      user: null,
      updateProfile: mockUpdateProfile,
    });

    const { result } = renderHook(() => useUserPreferences());

    expect(result.current.preferences.theme).toBe('light');
    expect(result.current.preferences.editorSettings.fontSize).toBe(18);
    expect(result.current.preferences.editorSettings.tabSize).toBe(8);
    expect(result.current.preferences.notifications.soundEnabled).toBe(false);
    // Should merge with defaults
    expect(result.current.preferences.editorSettings.fontFamily).toBe('Monaco, Consolas, monospace');
  });

  it('handles corrupted localStorage data gracefully', () => {
    localStorageMock.getItem.mockReturnValue('invalid-json');
    vi.mocked(require('../../contexts/AuthContext').useAuth).mockReturnValue({
      user: null,
      updateProfile: mockUpdateProfile,
    });

    const { result } = renderHook(() => useUserPreferences());

    // Should fall back to defaults
    expect(result.current.preferences.theme).toBe('system');
    expect(result.current.preferences.editorSettings.fontSize).toBe(14);
  });

  it('updates preferences and saves to server when user is authenticated', async () => {
    mockUpdateProfile.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUserPreferences());

    const newPreferences = {
      theme: 'light' as const,
      editorSettings: {
        fontSize: 18,
      },
    };

    await act(async () => {
      await result.current.updatePreferences(newPreferences);
    });

    expect(result.current.preferences.theme).toBe('light');
    expect(result.current.preferences.editorSettings.fontSize).toBe(18);
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'devstudio-preferences',
      expect.stringContaining('"theme":"light"')
    );
    expect(mockUpdateProfile).toHaveBeenCalledWith({
      preferences: expect.objectContaining({
        theme: 'light',
        editorSettings: expect.objectContaining({
          fontSize: 18,
        }),
      }),
    });
  });

  it('only saves to localStorage when user is not authenticated', async () => {
    vi.mocked(require('../../contexts/AuthContext').useAuth).mockReturnValue({
      user: null,
      updateProfile: mockUpdateProfile,
    });

    const { result } = renderHook(() => useUserPreferences());

    const newPreferences = {
      theme: 'dark' as const,
    };

    await act(async () => {
      await result.current.updatePreferences(newPreferences);
    });

    expect(result.current.preferences.theme).toBe('dark');
    expect(localStorageMock.setItem).toHaveBeenCalled();
    expect(mockUpdateProfile).not.toHaveBeenCalled();
  });

  it('reverts changes when server update fails', async () => {
    const error = new Error('Server error');
    mockUpdateProfile.mockRejectedValue(error);

    const { result } = renderHook(() => useUserPreferences());
    const originalPreferences = result.current.preferences;

    const newPreferences = {
      theme: 'light' as const,
    };

    await act(async () => {
      try {
        await result.current.updatePreferences(newPreferences);
      } catch (e) {
        // Expected to throw
      }
    });

    expect(result.current.preferences).toEqual(originalPreferences);
    expect(mockUpdateProfile).toHaveBeenCalled();
  });

  it('updates editor settings correctly', async () => {
    mockUpdateProfile.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUserPreferences());

    const newEditorSettings = {
      fontSize: 20,
      wordWrap: true,
    };

    await act(async () => {
      await result.current.updateEditorSettings(newEditorSettings);
    });

    expect(result.current.preferences.editorSettings.fontSize).toBe(20);
    expect(result.current.preferences.editorSettings.wordWrap).toBe(true);
    // Should preserve other settings
    expect(result.current.preferences.editorSettings.fontFamily).toBe('Fira Code, monospace');
  });

  it('updates notification settings correctly', async () => {
    mockUpdateProfile.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUserPreferences());

    const newNotificationSettings = {
      emailNotifications: true,
      soundEnabled: true,
    };

    await act(async () => {
      await result.current.updateNotificationSettings(newNotificationSettings);
    });

    expect(result.current.preferences.notifications.emailNotifications).toBe(true);
    expect(result.current.preferences.notifications.soundEnabled).toBe(true);
    // Should preserve other settings
    expect(result.current.preferences.notifications.pushNotifications).toBe(true);
  });

  it('resets to default preferences', async () => {
    mockUpdateProfile.mockResolvedValue(undefined);

    const { result } = renderHook(() => useUserPreferences());

    await act(async () => {
      await result.current.resetToDefaults();
    });

    expect(result.current.preferences.theme).toBe('system');
    expect(result.current.preferences.editorSettings.fontSize).toBe(14);
    expect(result.current.preferences.editorSettings.fontFamily).toBe('Monaco, Consolas, monospace');
    expect(result.current.preferences.notifications.emailNotifications).toBe(true);
  });

  it('manages loading state correctly', async () => {
    let resolvePromise: (value?: any) => void;
    const promise = new Promise((resolve) => {
      resolvePromise = resolve;
    });
    mockUpdateProfile.mockReturnValue(promise);

    const { result } = renderHook(() => useUserPreferences());

    expect(result.current.isLoading).toBe(false);

    act(() => {
      result.current.updatePreferences({ theme: 'light' });
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      resolvePromise();
      await promise;
    });

    expect(result.current.isLoading).toBe(false);
  });
});