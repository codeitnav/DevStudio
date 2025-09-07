import React, { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Settings, Download, Upload, Trash2, AlertTriangle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useToast } from '../../contexts/ToastContext';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Card } from '../ui/Card';
import { Modal } from '../ui/Modal';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { useTheme } from '../../hooks/useTheme';
import { 
  UserPreferences, 
  EditorSettings, 
  NotificationSettings, 
  DataExportRequest,
  User as UserType
} from '../../types/user';

// Validation schemas
const profileSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters').max(50, 'Username must be less than 50 characters'),
  email: z.string().email('Invalid email address'),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string().min(1, 'Please confirm your password'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

const deactivationSchema = z.object({
  password: z.string().min(1, 'Password is required'),
  reason: z.string().optional(),
  feedback: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;
type DeactivationFormData = z.infer<typeof deactivationSchema>;

interface ProfileSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSettings: React.FC<ProfileSettingsProps> = ({ isOpen, onClose }) => {
  const { user, updateProfile, changePassword, uploadAvatar, deleteAvatar, deactivateAccount, exportData } = useAuth();
  const { showSuccess, showError } = useToast();
  const { theme, setTheme } = useTheme();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [activeTab, setActiveTab] = useState<'profile' | 'preferences' | 'security' | 'account'>('profile');
  const [isUploading, setIsUploading] = useState(false);
  const [showDeactivationModal, setShowDeactivationModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Form instances
  const profileForm = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      username: user?.username || '',
      email: user?.email || '',
    },
  });

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const deactivationForm = useForm<DeactivationFormData>({
    resolver: zodResolver(deactivationSchema),
  });

  // User preferences state
  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: theme as 'light' | 'dark' | 'system',
    editorSettings: {
      fontSize: 14,
      fontFamily: 'Monaco, Consolas, monospace',
      tabSize: 2,
      wordWrap: true,
      minimap: true,
      lineNumbers: true,
      autoSave: true,
      autoSaveDelay: 1000,
      ...user?.preferences?.editorSettings,
    },
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      soundEnabled: true,
      ...user?.preferences?.notifications,
    },
  });

  const handleProfileSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile(data);
      showSuccess('Profile updated successfully');
    } catch (error: any) {
      showError(error.message || 'Failed to update profile');
    }
  };

  const handlePasswordSubmit = async (data: PasswordFormData) => {
    try {
      await changePassword({
        currentPassword: data.currentPassword,
        newPassword: data.newPassword,
        confirmPassword: data.confirmPassword,
      });
      passwordForm.reset();
      showSuccess('Password changed successfully');
    } catch (error: any) {
      showError(error.message || 'Failed to change password');
    }
  };

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    if (!file.type.startsWith('image/')) {
      showError('Please select an image file');
      return;
    }

    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      showError('Image must be less than 5MB');
      return;
    }

    try {
      setIsUploading(true);
      await uploadAvatar(file);
      showSuccess('Avatar updated successfully');
    } catch (error: any) {
      showError(error.message || 'Failed to upload avatar');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDeleteAvatar = async () => {
    try {
      await deleteAvatar();
      showSuccess('Avatar removed successfully');
    } catch (error: any) {
      showError(error.message || 'Failed to remove avatar');
    }
  };

  const handlePreferencesUpdate = async () => {
    try {
      await updateProfile({ preferences });
      setTheme(preferences.theme);
      showSuccess('Preferences updated successfully');
    } catch (error: any) {
      showError(error.message || 'Failed to update preferences');
    }
  };

  const handleDataExport = async (request: DataExportRequest) => {
    try {
      setIsExporting(true);
      const blob = await exportData(request);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `devstudio-data-export.${request.format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      showSuccess('Data exported successfully');
      setShowExportModal(false);
    } catch (error: any) {
      showError(error.message || 'Failed to export data');
    } finally {
      setIsExporting(false);
    }
  };

  const handleAccountDeactivation = async (data: DeactivationFormData) => {
    try {
      await deactivateAccount(data);
      showSuccess('Account deactivated successfully');
      setShowDeactivationModal(false);
      onClose();
    } catch (error: any) {
      showError(error.message || 'Failed to deactivate account');
    }
  };

  if (!user) return null;

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Profile Settings"
        size="lg"
        className="max-h-[90vh] overflow-hidden"
      >
        <div className="flex h-full">
          {/* Sidebar */}
          <div className="w-48 border-r border-gray-200 pr-4">
            <nav className="space-y-1">
              {[
                { id: 'profile', label: 'Profile', icon: User },
                { id: 'preferences', label: 'Preferences', icon: Settings },
                { id: 'security', label: 'Security', icon: AlertTriangle },
                { id: 'account', label: 'Account', icon: Settings },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveTab(id as any)}
                  className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                    activeTab === id
                      ? 'bg-blue-100 text-blue-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`}
                >
                  <Icon className="mr-3 h-4 w-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="flex-1 pl-6 overflow-y-auto">
            {activeTab === 'profile' && (
              <ProfileTab
                user={user}
                profileForm={profileForm}
                onProfileSubmit={handleProfileSubmit}
                onAvatarUpload={handleAvatarUpload}
                onDeleteAvatar={handleDeleteAvatar}
                isUploading={isUploading}
                fileInputRef={fileInputRef}
              />
            )}

            {activeTab === 'preferences' && (
              <PreferencesTab
                preferences={preferences}
                onPreferencesChange={setPreferences}
                onSave={handlePreferencesUpdate}
              />
            )}

            {activeTab === 'security' && (
              <SecurityTab
                passwordForm={passwordForm}
                onPasswordSubmit={handlePasswordSubmit}
              />
            )}

            {activeTab === 'account' && (
              <AccountTab
                onExportData={() => setShowExportModal(true)}
                onDeactivateAccount={() => setShowDeactivationModal(true)}
              />
            )}
          </div>
        </div>
      </Modal>

      {/* Data Export Modal */}
      <DataExportModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        onExport={handleDataExport}
        isExporting={isExporting}
      />

      {/* Account Deactivation Modal */}
      <AccountDeactivationModal
        isOpen={showDeactivationModal}
        onClose={() => setShowDeactivationModal(false)}
        form={deactivationForm}
        onSubmit={handleAccountDeactivation}
      />
    </>
  );
};

// Profile Tab Component
interface ProfileTabProps {
  user: UserType;
  profileForm: any;
  onProfileSubmit: (data: ProfileFormData) => Promise<void>;
  onAvatarUpload: (event: React.ChangeEvent<HTMLInputElement>) => Promise<void>;
  onDeleteAvatar: () => Promise<void>;
  isUploading: boolean;
  fileInputRef: React.RefObject<HTMLInputElement>;
}

const ProfileTab: React.FC<ProfileTabProps> = ({
  user,
  profileForm,
  onProfileSubmit,
  onAvatarUpload,
  onDeleteAvatar,
  isUploading,
  fileInputRef,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Profile Information</h3>
        
        {/* Avatar Section */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative">
            {user.avatar ? (
              <img
                src={user.avatar}
                alt="Profile avatar"
                className="h-20 w-20 rounded-full object-cover"
              />
            ) : (
              <div className="h-20 w-20 rounded-full bg-gray-200 flex items-center justify-center">
                <User className="h-8 w-8 text-gray-400" />
              </div>
            )}
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                <LoadingSpinner size="sm" />
              </div>
            )}
          </div>
          
          <div className="space-y-2">
            <div className="flex space-x-2">
              <Button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                size="sm"
                variant="outline"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Avatar
              </Button>
              
              {user.avatar && (
                <Button
                  onClick={onDeleteAvatar}
                  disabled={isUploading}
                  size="sm"
                  variant="outline"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-500">
              JPG, PNG or GIF. Max size 5MB.
            </p>
          </div>
          
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onAvatarUpload}
            className="hidden"
          />
        </div>

        {/* Profile Form */}
        <form onSubmit={profileForm.handleSubmit(onProfileSubmit)} className="space-y-4">
          <Input
            label="Username"
            {...profileForm.register('username')}
            error={profileForm.formState.errors.username?.message}
            required
          />
          
          <Input
            label="Email"
            type="email"
            {...profileForm.register('email')}
            error={profileForm.formState.errors.email?.message}
            required
          />
          
          <div className="flex justify-end">
            <Button
              type="submit"
              isLoading={profileForm.formState.isSubmitting}
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Preferences Tab Component
interface PreferencesTabProps {
  preferences: UserPreferences;
  onPreferencesChange: (preferences: UserPreferences) => void;
  onSave: () => Promise<void>;
}

const PreferencesTab: React.FC<PreferencesTabProps> = ({
  preferences,
  onPreferencesChange,
  onSave,
}) => {
  const updatePreferences = (updates: Partial<UserPreferences>) => {
    onPreferencesChange({ ...preferences, ...updates });
  };

  const updateEditorSettings = (updates: Partial<EditorSettings>) => {
    onPreferencesChange({
      ...preferences,
      editorSettings: { ...preferences.editorSettings, ...updates },
    });
  };

  const updateNotificationSettings = (updates: Partial<NotificationSettings>) => {
    onPreferencesChange({
      ...preferences,
      notifications: { ...preferences.notifications, ...updates },
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Preferences</h3>
        
        {/* Theme Settings */}
        <Card className="p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Appearance</h4>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Theme
              </label>
              <select
                value={preferences.theme}
                onChange={(e) => updatePreferences({ theme: e.target.value as any })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="light">Light</option>
                <option value="dark">Dark</option>
                <option value="system">System</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Editor Settings */}
        <Card className="p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Editor Settings</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Size
              </label>
              <input
                type="number"
                min="10"
                max="24"
                value={preferences.editorSettings.fontSize}
                onChange={(e) => updateEditorSettings({ fontSize: parseInt(e.target.value) })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tab Size
              </label>
              <select
                value={preferences.editorSettings.tabSize}
                onChange={(e) => updateEditorSettings({ tabSize: parseInt(e.target.value) })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value={2}>2 spaces</option>
                <option value={4}>4 spaces</option>
                <option value={8}>8 spaces</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Font Family
              </label>
              <select
                value={preferences.editorSettings.fontFamily}
                onChange={(e) => updateEditorSettings({ fontFamily: e.target.value })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="Monaco, Consolas, monospace">Monaco</option>
                <option value="'Fira Code', monospace">Fira Code</option>
                <option value="'Source Code Pro', monospace">Source Code Pro</option>
                <option value="'JetBrains Mono', monospace">JetBrains Mono</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Auto Save Delay (ms)
              </label>
              <input
                type="number"
                min="500"
                max="5000"
                step="500"
                value={preferences.editorSettings.autoSaveDelay}
                onChange={(e) => updateEditorSettings({ autoSaveDelay: parseInt(e.target.value) })}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="mt-4 space-y-3">
            {[
              { key: 'wordWrap', label: 'Word Wrap' },
              { key: 'minimap', label: 'Show Minimap' },
              { key: 'lineNumbers', label: 'Show Line Numbers' },
              { key: 'autoSave', label: 'Auto Save' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.editorSettings[key as keyof EditorSettings] as boolean}
                  onChange={(e) => updateEditorSettings({ [key]: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </Card>

        {/* Notification Settings */}
        <Card className="p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-3">Notifications</h4>
          <div className="space-y-3">
            {[
              { key: 'emailNotifications', label: 'Email Notifications' },
              { key: 'pushNotifications', label: 'Push Notifications' },
              { key: 'soundEnabled', label: 'Sound Notifications' },
            ].map(({ key, label }) => (
              <label key={key} className="flex items-center">
                <input
                  type="checkbox"
                  checked={preferences.notifications[key as keyof NotificationSettings]}
                  onChange={(e) => updateNotificationSettings({ [key]: e.target.checked })}
                  className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <span className="ml-2 text-sm text-gray-700">{label}</span>
              </label>
            ))}
          </div>
        </Card>

        <div className="flex justify-end">
          <Button onClick={onSave}>
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  );
};

// Security Tab Component
interface SecurityTabProps {
  passwordForm: any;
  onPasswordSubmit: (data: PasswordFormData) => Promise<void>;
}

const SecurityTab: React.FC<SecurityTabProps> = ({
  passwordForm,
  onPasswordSubmit,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Security Settings</h3>
        
        <Card className="p-4">
          <h4 className="font-medium text-gray-900 mb-3">Change Password</h4>
          <form onSubmit={passwordForm.handleSubmit(onPasswordSubmit)} className="space-y-4">
            <Input
              label="Current Password"
              type="password"
              {...passwordForm.register('currentPassword')}
              error={passwordForm.formState.errors.currentPassword?.message}
              required
            />
            
            <Input
              label="New Password"
              type="password"
              {...passwordForm.register('newPassword')}
              error={passwordForm.formState.errors.newPassword?.message}
              helperText="Password must be at least 8 characters long"
              required
            />
            
            <Input
              label="Confirm New Password"
              type="password"
              {...passwordForm.register('confirmPassword')}
              error={passwordForm.formState.errors.confirmPassword?.message}
              required
            />
            
            <div className="flex justify-end">
              <Button
                type="submit"
                isLoading={passwordForm.formState.isSubmitting}
              >
                Change Password
              </Button>
            </div>
          </form>
        </Card>
      </div>
    </div>
  );
};

// Account Tab Component
interface AccountTabProps {
  onExportData: () => void;
  onDeactivateAccount: () => void;
}

const AccountTab: React.FC<AccountTabProps> = ({
  onExportData,
  onDeactivateAccount,
}) => {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Account Management</h3>
        
        {/* Data Export */}
        <Card className="p-4 mb-6">
          <h4 className="font-medium text-gray-900 mb-2">Export Your Data</h4>
          <p className="text-sm text-gray-600 mb-4">
            Download a copy of your account data, including profile information, rooms, and files.
          </p>
          <Button
            onClick={onExportData}
            variant="outline"
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </Card>

        {/* Account Deactivation */}
        <Card className="p-4 border-red-200">
          <h4 className="font-medium text-red-900 mb-2">Deactivate Account</h4>
          <p className="text-sm text-red-600 mb-4">
            Permanently deactivate your account. This action cannot be undone.
          </p>
          <Button
            onClick={onDeactivateAccount}
            variant="outline"
            className="border-red-300 text-red-700 hover:bg-red-50"
          >
            <AlertTriangle className="h-4 w-4 mr-2" />
            Deactivate Account
          </Button>
        </Card>
      </div>
    </div>
  );
};

// Data Export Modal Component
interface DataExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onExport: (request: DataExportRequest) => Promise<void>;
  isExporting: boolean;
}

const DataExportModal: React.FC<DataExportModalProps> = ({
  isOpen,
  onClose,
  onExport,
  isExporting,
}) => {
  const [exportRequest, setExportRequest] = useState<DataExportRequest>({
    includeProfile: true,
    includeRooms: true,
    includeFiles: false,
    format: 'json',
  });

  const handleExport = () => {
    onExport(exportRequest);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Export Your Data"
      size="md"
    >
      <div className="space-y-4">
        <p className="text-sm text-gray-600">
          Select what data you'd like to include in your export:
        </p>
        
        <div className="space-y-3">
          {[
            { key: 'includeProfile', label: 'Profile Information' },
            { key: 'includeRooms', label: 'Room Data' },
            { key: 'includeFiles', label: 'File Contents' },
          ].map(({ key, label }) => (
            <label key={key} className="flex items-center">
              <input
                type="checkbox"
                checked={exportRequest[key as keyof DataExportRequest] as boolean}
                onChange={(e) => setExportRequest(prev => ({ ...prev, [key]: e.target.checked }))}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="ml-2 text-sm text-gray-700">{label}</span>
            </label>
          ))}
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Export Format
          </label>
          <select
            value={exportRequest.format}
            onChange={(e) => setExportRequest(prev => ({ ...prev, format: e.target.value as 'json' | 'csv' }))}
            className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          >
            <option value="json">JSON</option>
            <option value="csv">CSV</option>
          </select>
        </div>
        
        <div className="flex justify-end space-x-3 pt-4">
          <Button
            onClick={onClose}
            variant="outline"
            disabled={isExporting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleExport}
            isLoading={isExporting}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Data
          </Button>
        </div>
      </div>
    </Modal>
  );
};

// Account Deactivation Modal Component
interface AccountDeactivationModalProps {
  isOpen: boolean;
  onClose: () => void;
  form: any;
  onSubmit: (data: DeactivationFormData) => Promise<void>;
}

const AccountDeactivationModal: React.FC<AccountDeactivationModalProps> = ({
  isOpen,
  onClose,
  form,
  onSubmit,
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Deactivate Account"
      size="md"
    >
      <div className="space-y-4">
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <AlertTriangle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">
                Warning: This action cannot be undone
              </h3>
              <p className="mt-2 text-sm text-red-700">
                Deactivating your account will permanently delete all your data, including rooms, files, and profile information.
              </p>
            </div>
          </div>
        </div>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Confirm your password"
            type="password"
            {...form.register('password')}
            error={form.formState.errors.password?.message}
            required
          />
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason for deactivation (optional)
            </label>
            <select
              {...form.register('reason')}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Select a reason</option>
              <option value="not_using">Not using the service</option>
              <option value="privacy_concerns">Privacy concerns</option>
              <option value="found_alternative">Found an alternative</option>
              <option value="technical_issues">Technical issues</option>
              <option value="other">Other</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional feedback (optional)
            </label>
            <textarea
              {...form.register('feedback')}
              rows={3}
              className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Help us improve by sharing your feedback..."
            />
          </div>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={form.formState.isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              isLoading={form.formState.isSubmitting}
              className="bg-red-600 hover:bg-red-700 focus-visible:ring-red-500"
            >
              Deactivate Account
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};