import { useState, useEffect } from 'react';
import { UserPreferences, EditorSettings, NotificationSettings } from '../types/user';
import { useAuth } from '../contexts/AuthContext';

const DEFAULT_EDITOR_SETTINGS: EditorSettings = {
  fontSize: 14,
  fontFamily: 'Monaco, Consolas, monospace',
  tabSize: 2,
  wordWrap: true,
  minimap: true,
  lineNumbers: true,
  autoSave: true,
  autoSaveDelay: 1000,
};

const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  emailNotifications: true,
  pushNotifications: true,
  soundEnabled: true,
};

const DEFAULT_PREFERENCES: UserPreferences = {
  theme: 'system',
  editorSettings: DEFAULT_EDITOR_SETTINGS,
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
};

export const useUserPreferences = () => {
  const { user, updateProfile } = useAuth();
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(false);

  // Initialize preferences from user data or localStorage
  useEffect(() => {
    if (user?.preferences) {
      setPreferences({
        ...DEFAULT_PREFERENCES,
        ...user.preferences,
        editorSettings: {
          ...DEFAULT_EDITOR_SETTINGS,
          ...user.preferences.editorSettings,
        },
        notifications: {
          ...DEFAULT_NOTIFICATION_SETTINGS,
          ...user.preferences.notifications,
        },
      });
    } else {
      // Try to load from localStorage for guest users or fallback
      const savedPreferences = localStorage.getItem('devstudio-preferences');
      if (savedPreferences) {
        try {
          const parsed = JSON.parse(savedPreferences);
          setPreferences({
            ...DEFAULT_PREFERENCES,
            ...parsed,
            editorSettings: {
              ...DEFAULT_EDITOR_SETTINGS,
              ...parsed.editorSettings,
            },
            notifications: {
              ...DEFAULT_NOTIFICATION_SETTINGS,
              ...parsed.notifications,
            },
          });
        } catch (error) {
          console.warn('Failed to parse saved preferences:', error);
        }
      }
    }
  }, [user]);

  const updatePreferences = async (newPreferences: Partial<UserPreferences>) => {
    const updatedPreferences = {
      ...preferences,
      ...newPreferences,
      editorSettings: {
        ...preferences.editorSettings,
        ...newPreferences.editorSettings,
      },
      notifications: {
        ...preferences.notifications,
        ...newPreferences.notifications,
      },
    };

    setPreferences(updatedPreferences);

    // Save to localStorage immediately for responsiveness
    localStorage.setItem('devstudio-preferences', JSON.stringify(updatedPreferences));

    // If user is authenticated, save to server
    if (user) {
      try {
        setIsLoading(true);
        await updateProfile({ preferences: updatedPreferences });
      } catch (error) {
        console.error('Failed to save preferences to server:', error);
        // Revert local changes if server update fails
        setPreferences(preferences);
        throw error;
      } finally {
        setIsLoading(false);
      }
    }
  };

  const updateEditorSettings = async (newSettings: Partial<EditorSettings>) => {
    await updatePreferences({
      editorSettings: {
        ...preferences.editorSettings,
        ...newSettings,
      },
    });
  };

  const updateNotificationSettings = async (newSettings: Partial<NotificationSettings>) => {
    await updatePreferences({
      notifications: {
        ...preferences.notifications,
        ...newSettings,
      },
    });
  };

  const resetToDefaults = async () => {
    await updatePreferences(DEFAULT_PREFERENCES);
  };

  return {
    preferences,
    updatePreferences,
    updateEditorSettings,
    updateNotificationSettings,
    resetToDefaults,
    isLoading,
  };
};