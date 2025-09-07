import React, { useState } from 'react';
import { User, Settings } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { ProfileSettings } from '../profile/ProfileSettings';

export const ProfileDemo: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile Management Demo</h1>
        <p className="text-gray-600 mb-8">
          Demonstration of the comprehensive profile and settings management system
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Overview Card */}
        <Card className="p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center">
              <User className="h-8 w-8 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Demo User</h3>
              <p className="text-gray-600">demo@example.com</p>
            </div>
          </div>
          <Button
            onClick={() => setShowSettings(true)}
            className="w-full flex items-center justify-center space-x-2"
          >
            <Settings className="h-4 w-4" />
            <span>Open Profile Settings</span>
          </Button>
        </Card>

        {/* Features Card */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Features Included</h3>
          <ul className="space-y-2 text-sm text-gray-600">
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Profile information management</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Avatar upload and management</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Password change with verification</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Theme and editor preferences</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Notification settings</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Data export functionality</span>
            </li>
            <li className="flex items-center space-x-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Account deactivation</span>
            </li>
          </ul>
        </Card>
      </div>

      {/* Implementation Details */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Implementation Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-sm text-gray-600">
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Profile Management</h4>
            <ul className="space-y-1">
              <li>• Form validation with Zod schemas</li>
              <li>• Real-time form feedback</li>
              <li>• Avatar upload with file validation</li>
              <li>• Profile picture management</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Security Features</h4>
            <ul className="space-y-1">
              <li>• Current password verification</li>
              <li>• Strong password requirements</li>
              <li>• Secure password change flow</li>
              <li>• Account deactivation with confirmation</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">User Preferences</h4>
            <ul className="space-y-1">
              <li>• Theme selection (light/dark/system)</li>
              <li>• Editor customization options</li>
              <li>• Font size and family settings</li>
              <li>• Auto-save configuration</li>
            </ul>
          </div>
          <div>
            <h4 className="font-medium text-gray-900 mb-2">Data Management</h4>
            <ul className="space-y-1">
              <li>• Comprehensive data export</li>
              <li>• Multiple export formats (JSON/CSV)</li>
              <li>• Selective data inclusion</li>
              <li>• GDPR compliance features</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Profile Settings Modal */}
      <ProfileSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
};