import React, { useState, useEffect } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Modal } from '../ui/Modal';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { MemberManagement } from './MemberManagement';
import { roomService } from '../../services/roomService';
import type { Room, RoomSettings as IRoomSettings, RoomMember } from '../../types/room';

interface RoomSettingsProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room;
  currentUserRole: 'owner' | 'member';
  onRoomUpdated: (room: Room) => void;
  onRoomDeleted: () => void;
}

// Define separate error type for form validation
interface FormErrors {
  name?: string;
  description?: string;
  password?: string;
  maxMembers?: string;
  language?: string;
  isPublic?: string;
}

const PROGRAMMING_LANGUAGES = [
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'cpp', label: 'C++' },
  { value: 'csharp', label: 'C#' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'php', label: 'PHP' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'json', label: 'JSON' },
  { value: 'markdown', label: 'Markdown' },
  { value: 'plaintext', label: 'Plain Text' },
];

export const RoomSettings: React.FC<RoomSettingsProps> = ({
  isOpen,
  onClose,
  room,
  currentUserRole,
  onRoomUpdated,
  onRoomDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'danger'>('general');
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState<RoomMember[]>([]);
  const [formData, setFormData] = useState<IRoomSettings>({
    name: room.name,
    description: room.description,
    isPublic: room.isPublic,
    password: '',
    maxMembers: room.maxMembers,
    language: room.language,
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const isOwner = currentUserRole === 'owner';

  useEffect(() => {
    if (isOpen) {
      loadMembers();
    }
  }, [isOpen, room.id]);

  const loadMembers = async () => {
    try {
      const roomMembers = await roomService.getRoomMembers(room.id);
      setMembers(roomMembers);
    } catch (error) {
      console.error('Failed to load members:', error);
    }
  };

  const handleInputChange = (field: keyof IRoomSettings, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name?.trim()) {
      newErrors.name = 'Room name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Room name must be at least 3 characters';
    } else if (formData.name.length > 50) {
      newErrors.name = 'Room name must be less than 50 characters';
    }

    if (formData.description && formData.description.length > 200) {
      newErrors.description = 'Description must be less than 200 characters';
    }

    if (!formData.isPublic && formData.password && formData.password.length < 4) {
      newErrors.password = 'Password must be at least 4 characters';
    }

    if (formData.maxMembers && (formData.maxMembers < 2 || formData.maxMembers > 50)) {
      newErrors.maxMembers = 'Max members must be between 2 and 50';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSaveSettings = async () => {
    if (!validateForm() || !isOwner) {
      return;
    }

    setIsLoading(true);
    try {
      const updateData = { ...formData };
      // Don't send password if room is public or password is empty
      if (formData.isPublic || !formData.password?.trim()) {
        delete updateData.password;
      }

      const updatedRoom = await roomService.updateRoomSettings(room.id, updateData);
      onRoomUpdated(updatedRoom);
      
      // Reset password field after successful update
      setFormData(prev => ({ ...prev, password: '' }));
    } catch (error) {
      console.error('Failed to update room settings:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteRoom = async () => {
    if (!isOwner) return;

    setIsLoading(true);
    try {
      await roomService.deleteRoom(room.id);
      onRoomDeleted();
      onClose();
    } catch (error) {
      console.error('Failed to delete room:', error);
    } finally {
      setIsLoading(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleExportData = async () => {
    if (!isOwner) return;

    try {
      const exportData = await roomService.exportRoomData(room.id);
      
      // Create and download the export file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `room-${room.name}-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Failed to export room data:', error);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Room Settings" size="large">
      <div className="flex flex-col h-full">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('general')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'general'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            General
          </button>
          <button
            onClick={() => setActiveTab('members')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'members'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Members ({members.length})
          </button>
          {isOwner && (
            <button
              onClick={() => setActiveTab('danger')}
              className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'danger'
                  ? 'border-red-500 text-red-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              Danger Zone
            </button>
          )}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-y-auto">
          {activeTab === 'general' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Room Name */}
                <div>
                  <label htmlFor="roomName" className="block text-sm font-medium text-gray-700 mb-1">
                    Room Name *
                  </label>
                  <Input
                    id="roomName"
                    type="text"
                    value={formData.name || ''}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter room name"
                    error={errors.name}
                    disabled={!isOwner || isLoading}
                  />
                </div>

                {/* Programming Language */}
                <div>
                  <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
                    Programming Language
                  </label>
                  <select
                    id="language"
                    value={formData.language || ''}
                    onChange={(e) => handleInputChange('language', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100"
                    disabled={!isOwner || isLoading}
                  >
                    {PROGRAMMING_LANGUAGES.map((lang) => (
                      <option key={lang.value} value={lang.value}>
                        {lang.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description */}
              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                  Description
                </label>
                <textarea
                  id="description"
                  value={formData.description || ''}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Optional room description"
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none disabled:bg-gray-100"
                  disabled={!isOwner || isLoading}
                />
                {errors.description && (
                  <p className="text-red-500 text-sm mt-1">{errors.description}</p>
                )}
              </div>

              {/* Max Members */}
              <div>
                <label htmlFor="maxMembers" className="block text-sm font-medium text-gray-700 mb-1">
                  Maximum Members
                </label>
                <Input
                  id="maxMembers"
                  type="number"
                  min="2"
                  max="50"
                  value={formData.maxMembers || 10}
                  onChange={(e) => handleInputChange('maxMembers', parseInt(e.target.value) || 2)}
                  error={errors.maxMembers}
                  disabled={!isOwner || isLoading}
                />
              </div>

              {/* Privacy Settings */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Privacy Settings
                </label>
                <div className="space-y-2">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      checked={formData.isPublic}
                      onChange={() => handleInputChange('isPublic', true)}
                      className="mr-2"
                      disabled={!isOwner || isLoading}
                    />
                    <span className="text-sm">Public (anyone can join)</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      name="privacy"
                      checked={!formData.isPublic}
                      onChange={() => handleInputChange('isPublic', false)}
                      className="mr-2"
                      disabled={!isOwner || isLoading}
                    />
                    <span className="text-sm">Private (password required)</span>
                  </label>
                </div>
              </div>

              {/* Password (only for private rooms) */}
              {!formData.isPublic && (
                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Room Password {room.hasPassword ? '(leave empty to keep current)' : '*'}
                  </label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password || ''}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    placeholder={room.hasPassword ? 'Enter new password' : 'Enter room password'}
                    error={errors.password}
                    disabled={!isOwner || isLoading}
                  />
                </div>
              )}

              {/* Save Button */}
              {isOwner && (
                <div className="flex justify-end pt-4 border-t">
                  <Button
                    onClick={handleSaveSettings}
                    disabled={isLoading}
                    className="min-w-[120px]"
                  >
                    {isLoading ? <LoadingSpinner size="sm" /> : 'Save Changes'}
                  </Button>
                </div>
              )}
            </div>
          )}

          {activeTab === 'members' && (
            <MemberManagement
              roomId={room.id}
              members={members}
              currentUserRole={currentUserRole}
              onMembersUpdated={loadMembers}
            />
          )}

          {activeTab === 'danger' && isOwner && (
            <div className="space-y-6">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h3 className="text-lg font-medium text-red-800 mb-2">Danger Zone</h3>
                <p className="text-sm text-red-600 mb-4">
                  These actions are irreversible. Please proceed with caution.
                </p>

                <div className="space-y-4">
                  {/* Export Data */}
                  <div className="flex items-center justify-between p-4 bg-white border border-red-200 rounded-md">
                    <div>
                      <h4 className="font-medium text-gray-900">Export Room Data</h4>
                      <p className="text-sm text-gray-600">
                        Download all room data including settings, members, and files.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={handleExportData}
                      disabled={isLoading}
                    >
                      Export
                    </Button>
                  </div>

                  {/* Delete Room */}
                  <div className="flex items-center justify-between p-4 bg-white border border-red-200 rounded-md">
                    <div>
                      <h4 className="font-medium text-gray-900">Delete Room</h4>
                      <p className="text-sm text-gray-600">
                        Permanently delete this room and all associated data.
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => setShowDeleteConfirm(true)}
                      disabled={isLoading}
                      className="border-red-300 text-red-700 hover:bg-red-50"
                    >
                      Delete Room
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          title="Delete Room"
          size="small"
        >
          <div className="space-y-4">
            <p className="text-gray-600">
              Are you sure you want to delete "{room.name}"? This action cannot be undone.
              All room data, including files and chat history, will be permanently lost.
            </p>
            <div className="flex gap-3 justify-end">
              <Button
                variant="outline"
                onClick={() => setShowDeleteConfirm(false)}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDeleteRoom}
                disabled={isLoading}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Delete Room'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};

export default RoomSettings;
