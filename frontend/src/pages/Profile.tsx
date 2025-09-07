import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Settings, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { ProfileSettings } from '../components/profile/ProfileSettings';
import { useAuth } from '../contexts/AuthContext';

export const Profile: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    return null;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Back</span>
          </Button>
          <h1 className="text-2xl font-bold text-gray-900">Profile</h1>
        </div>
        <Button
          onClick={() => setShowSettings(true)}
          className="flex items-center space-x-2"
        >
          <Settings className="h-4 w-4" />
          <span>Edit Profile</span>
        </Button>
      </div>

      {/* Profile Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Card */}
        <Card className="lg:col-span-1 p-6">
          <div className="text-center">
            <div className="mx-auto mb-4">
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt="Profile avatar"
                  className="h-24 w-24 rounded-full object-cover mx-auto"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-gray-200 flex items-center justify-center mx-auto">
                  <User className="h-12 w-12 text-gray-400" />
                </div>
              )}
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {user.username}
            </h2>
            <p className="text-gray-600 mb-4">{user.email}</p>
            <div className="text-sm text-gray-500">
              <p>Member since {new Date(user.createdAt).toLocaleDateString()}</p>
              {user.lastLogin && (
                <p>Last login: {new Date(user.lastLogin).toLocaleDateString()}</p>
              )}
            </div>
          </div>
        </Card>

        {/* Account Information */}
        <Card className="lg:col-span-2 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Username
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {user.username}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-sm text-gray-900 bg-gray-50 px-3 py-2 rounded-md">
                  {user.email}
                </p>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Account Status
              </label>
              <div className="flex items-center space-x-2">
                <div className={`w-2 h-2 rounded-full ${user.isActive ? 'bg-green-500' : 'bg-red-500'}`} />
                <span className="text-sm text-gray-900">
                  {user.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Preferences Overview */}
      {user.preferences && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Preferences</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Theme */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Theme</h4>
              <p className="text-sm text-gray-600 capitalize">
                {user.preferences.theme}
              </p>
            </div>

            {/* Editor Settings */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Editor</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Font Size: {user.preferences.editorSettings.fontSize}px</p>
                <p>Tab Size: {user.preferences.editorSettings.tabSize} spaces</p>
                <p>Auto Save: {user.preferences.editorSettings.autoSave ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>

            {/* Notifications */}
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Notifications</h4>
              <div className="text-sm text-gray-600 space-y-1">
                <p>Email: {user.preferences.notifications.emailNotifications ? 'Enabled' : 'Disabled'}</p>
                <p>Push: {user.preferences.notifications.pushNotifications ? 'Enabled' : 'Disabled'}</p>
                <p>Sound: {user.preferences.notifications.soundEnabled ? 'Enabled' : 'Disabled'}</p>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Profile Settings Modal */}
      <ProfileSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};