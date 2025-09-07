import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface JoinRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roomId: string, password?: string) => Promise<void>;
  isLoading?: boolean;
}

export const JoinRoomModal: React.FC<JoinRoomModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
}) => {
  const [roomId, setRoomId] = useState('');
  const [password, setPassword] = useState('');
  const [showPasswordField, setShowPasswordField] = useState(false);
  const [errors, setErrors] = useState<{
    roomId?: string;
    password?: string;
    general?: string;
  }>({});

  const handleRoomIdChange = (value: string) => {
    setRoomId(value);
    setShowPasswordField(false);
    setPassword('');
    // Clear errors when user starts typing
    if (errors.roomId || errors.general) {
      setErrors(prev => ({ ...prev, roomId: undefined, general: undefined }));
    }
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (errors.password) {
      setErrors(prev => ({ ...prev, password: undefined }));
    }
  };

  const validateRoomId = (): boolean => {
    if (!roomId.trim()) {
      setErrors(prev => ({ ...prev, roomId: 'Room ID is required' }));
      return false;
    }

    // Basic room ID format validation (assuming UUID or similar)
    const roomIdPattern = /^[a-zA-Z0-9-_]{8,}$/;
    if (!roomIdPattern.test(roomId.trim())) {
      setErrors(prev => ({ ...prev, roomId: 'Invalid room ID format' }));
      return false;
    }

    return true;
  };

  const handleInitialSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateRoomId()) {
      return;
    }

    try {
      // First attempt to join without password
      await onSubmit(roomId.trim());
      handleClose();
    } catch (error: any) {
      // If password is required, show password field
      if (error?.type === 'ROOM_ACCESS_ERROR' && error?.code === 'PASSWORD_REQUIRED') {
        setShowPasswordField(true);
        setErrors(prev => ({ ...prev, general: 'This room requires a password' }));
      } else if (error?.type === 'ROOM_ACCESS_ERROR' && error?.code === 'ROOM_NOT_FOUND') {
        setErrors(prev => ({ ...prev, roomId: 'Room not found' }));
      } else if (error?.type === 'ROOM_ACCESS_ERROR' && error?.code === 'ROOM_FULL') {
        setErrors(prev => ({ ...prev, general: 'This room is full' }));
      } else {
        setErrors(prev => ({ ...prev, general: error?.message || 'Failed to join room' }));
      }
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!password.trim()) {
      setErrors(prev => ({ ...prev, password: 'Password is required' }));
      return;
    }

    try {
      await onSubmit(roomId.trim(), password.trim());
      handleClose();
    } catch (error: any) {
      if (error?.type === 'ROOM_ACCESS_ERROR' && error?.code === 'INVALID_PASSWORD') {
        setErrors(prev => ({ ...prev, password: 'Incorrect password' }));
      } else {
        setErrors(prev => ({ ...prev, general: error?.message || 'Failed to join room' }));
      }
    }
  };

  const handleClose = () => {
    setRoomId('');
    setPassword('');
    setShowPasswordField(false);
    setErrors({});
    onClose();
  };

  const handleBack = () => {
    setShowPasswordField(false);
    setPassword('');
    setErrors(prev => ({ ...prev, password: undefined, general: undefined }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              {showPasswordField ? 'Enter Room Password' : 'Join Room'}
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 text-xl"
              disabled={isLoading}
            >
              ×
            </button>
          </div>

          {!showPasswordField ? (
            // Room ID Form
            <form onSubmit={handleInitialSubmit} className="space-y-4">
              <div>
                <label htmlFor="roomId" className="block text-sm font-medium text-gray-700 mb-1">
                  Room ID or Join Code
                </label>
                <Input
                  id="roomId"
                  type="text"
                  value={roomId}
                  onChange={(e) => handleRoomIdChange(e.target.value)}
                  placeholder="Enter room ID or join code"
                  error={errors.roomId}
                  disabled={isLoading}
                  autoFocus
                />
                <p className="text-xs text-gray-500 mt-1">
                  You can find the room ID in the room URL or ask the room owner for it.
                </p>
              </div>

              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{errors.general}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading || !roomId.trim()}
                >
                  {isLoading ? 'Joining...' : 'Join Room'}
                </Button>
              </div>
            </form>
          ) : (
            // Password Form
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <div>
                <p className="text-sm text-gray-600 mb-3">
                  Room: <span className="font-medium">{roomId}</span>
                </p>
                <label htmlFor="roomPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Password
                </label>
                <Input
                  id="roomPassword"
                  type="password"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Enter room password"
                  error={errors.password}
                  disabled={isLoading}
                  autoFocus
                />
              </div>

              {errors.general && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                  <p className="text-red-600 text-sm">{errors.general}</p>
                </div>
              )}

              <div className="flex gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBack}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  className="flex-1"
                  disabled={isLoading || !password.trim()}
                >
                  {isLoading ? 'Joining...' : 'Join Room'}
                </Button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default JoinRoomModal;