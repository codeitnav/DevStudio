import React, { useMemo, useCallback } from 'react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import type { Room } from '../../types/room';

interface RoomCardProps {
  room: Room;
  onJoin: (roomId: string) => void;
  onSettings?: (roomId: string) => void;
  showSettings?: boolean;
  className?: string;
}

export const RoomCard: React.FC<RoomCardProps> = React.memo(({
  room,
  onJoin,
  onSettings,
  showSettings = false,
  className = '',
}) => {
  const formattedDate = useMemo(() => {
    return new Date(room.lastActivity).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [room.lastActivity]);

  const languageColorClass = useMemo(() => {
    const colors: Record<string, string> = {
      javascript: 'bg-yellow-100 text-yellow-800',
      typescript: 'bg-blue-100 text-blue-800',
      python: 'bg-green-100 text-green-800',
      java: 'bg-red-100 text-red-800',
      cpp: 'bg-purple-100 text-purple-800',
      csharp: 'bg-indigo-100 text-indigo-800',
      go: 'bg-cyan-100 text-cyan-800',
      rust: 'bg-orange-100 text-orange-800',
      php: 'bg-violet-100 text-violet-800',
      ruby: 'bg-pink-100 text-pink-800',
    };
    return colors[room.language.toLowerCase()] || 'bg-gray-100 text-gray-800';
  }, [room.language]);

  const handleJoin = useCallback(() => {
    onJoin(room.id);
  }, [onJoin, room.id]);

  const handleSettings = useCallback(() => {
    onSettings?.(room.id);
  }, [onSettings, room.id]);

  const isRoomFull = useMemo(() => {
    return room.currentMembers >= room.maxMembers;
  }, [room.currentMembers, room.maxMembers]);

  return (
    <Card className={`p-4 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">
              {room.name}
            </h3>
            {room.description && (
              <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                {room.description}
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 ml-3">
            {room.hasPassword && (
              <div className="w-4 h-4 text-gray-400" title="Password protected">
                🔒
              </div>
            )}
            {!room.isPublic && (
              <div className="w-4 h-4 text-gray-400" title="Private room">
                👁️‍🗨️
              </div>
            )}
          </div>
        </div>

        {/* Language and Members */}
        <div className="flex items-center gap-3 mb-3">
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${languageColorClass}`}>
            {room.language}
          </span>
          <span className="text-sm text-gray-500">
            {room.currentMembers}/{room.maxMembers} members
          </span>
        </div>

        {/* Last Activity */}
        <div className="text-xs text-gray-400 mb-4">
          Last active: {formattedDate}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-auto">
          <Button
            onClick={handleJoin}
            className="flex-1"
            disabled={isRoomFull}
          >
            {isRoomFull ? 'Full' : 'Join'}
          </Button>
          {showSettings && onSettings && (
            <Button
              variant="outline"
              onClick={handleSettings}
              className="px-3"
            >
              ⚙️
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
});

export default RoomCard;