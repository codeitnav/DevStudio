import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { RoomSettings } from '../room/RoomSettings';
import type { Room } from '../../types/room';

export const RoomSettingsDemo: React.FC = () => {
  const [showSettings, setShowSettings] = useState(false);

  // Mock room data
  const mockRoom: Room = {
    id: 'demo-room-1',
    name: 'Demo Collaboration Room',
    description: 'A sample room for demonstrating room settings functionality',
    ownerId: 'current-user',
    isPublic: true,
    hasPassword: false,
    maxMembers: 15,
    currentMembers: 5,
    language: 'typescript',
    createdAt: new Date('2024-01-15'),
    lastActivity: new Date(),
  };

  const [room, setRoom] = useState<Room>(mockRoom);

  const handleRoomUpdated = (updatedRoom: Room) => {
    setRoom(updatedRoom);
    console.log('Room updated:', updatedRoom);
  };

  const handleRoomDeleted = () => {
    console.log('Room deleted');
    alert('Room would be deleted in a real application');
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">
          Room Settings Demo
        </h1>
        <p className="text-gray-600">
          This demo showcases the room settings and member management functionality.
          Click the settings button to open the room configuration panel.
        </p>
      </div>

      {/* Current Room Info */}
      <Card className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Current Room</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <h3 className="font-medium text-gray-700">Room Name</h3>
            <p className="text-gray-900">{room.name}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Language</h3>
            <p className="text-gray-900">{room.language}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Privacy</h3>
            <p className="text-gray-900">{room.isPublic ? 'Public' : 'Private'}</p>
          </div>
          <div>
            <h3 className="font-medium text-gray-700">Members</h3>
            <p className="text-gray-900">{room.currentMembers}/{room.maxMembers}</p>
          </div>
          <div className="md:col-span-2">
            <h3 className="font-medium text-gray-700">Description</h3>
            <p className="text-gray-900">{room.description}</p>
          </div>
        </div>
      </Card>

      {/* Demo Actions */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Demo Actions</h2>
        <div className="space-y-4">
          <div>
            <Button onClick={() => setShowSettings(true)}>
              Open Room Settings
            </Button>
            <p className="text-sm text-gray-600 mt-1">
              Opens the room settings modal with general settings, member management, and danger zone tabs.
            </p>
          </div>
        </div>
      </Card>

      {/* Features List */}
      <Card className="p-6 mt-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Features Demonstrated</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="font-medium text-gray-900 mb-2">General Settings</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Room name and description editing</li>
              <li>• Programming language selection</li>
              <li>• Privacy settings (public/private)</li>
              <li>• Password management for private rooms</li>
              <li>• Maximum members configuration</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Member Management</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• View all room members</li>
              <li>• Role management (owner/member)</li>
              <li>• Member invitation by email</li>
              <li>• Member removal functionality</li>
              <li>• Online/offline status indicators</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">Danger Zone</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Room data export (JSON format)</li>
              <li>• Room deletion with confirmation</li>
              <li>• Owner-only access controls</li>
            </ul>
          </div>
          <div>
            <h3 className="font-medium text-gray-900 mb-2">User Experience</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Responsive design for all screen sizes</li>
              <li>• Accessibility features and keyboard navigation</li>
              <li>• Form validation and error handling</li>
              <li>• Loading states and user feedback</li>
            </ul>
          </div>
        </div>
      </Card>

      {/* Room Settings Modal */}
      <RoomSettings
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
        room={room}
        currentUserRole="owner"
        onRoomUpdated={handleRoomUpdated}
        onRoomDeleted={handleRoomDeleted}
      />
    </div>
  );
};

export default RoomSettingsDemo;