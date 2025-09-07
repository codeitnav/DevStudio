import { useState, useCallback } from 'react';
import { roomService } from '../services/roomService';
import type { Room, RoomSettings, RoomMember, RoomRole, MemberInvitation } from '../types/room';

interface UseRoomSettingsReturn {
  isLoading: boolean;
  error: string | null;
  updateRoomSettings: (roomId: string, settings: RoomSettings) => Promise<Room | null>;
  deleteRoom: (roomId: string) => Promise<boolean>;
  exportRoomData: (roomId: string, roomName: string) => Promise<boolean>;
  updateMemberRole: (roomId: string, memberId: string, role: RoomRole) => Promise<boolean>;
  removeMember: (roomId: string, memberId: string) => Promise<boolean>;
  inviteMember: (roomId: string, invitation: MemberInvitation) => Promise<boolean>;
  getRoomMembers: (roomId: string) => Promise<RoomMember[]>;
  clearError: () => void;
}

export const useRoomSettings = (): UseRoomSettingsReturn => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const updateRoomSettings = useCallback(async (roomId: string, settings: RoomSettings): Promise<Room | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const updatedRoom = await roomService.updateRoomSettings(roomId, settings);
      return updatedRoom;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update room settings';
      setError(errorMessage);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteRoom = useCallback(async (roomId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await roomService.deleteRoom(roomId);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to delete room';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const exportRoomData = useCallback(async (roomId: string, roomName: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      const exportData = await roomService.exportRoomData(roomId);
      
      // Create and download the export file
      const blob = new Blob([JSON.stringify(exportData, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `room-${roomName}-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to export room data';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateMemberRole = useCallback(async (roomId: string, memberId: string, role: RoomRole): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await roomService.updateMemberRole(roomId, memberId, role);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to update member role';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const removeMember = useCallback(async (roomId: string, memberId: string): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await roomService.removeMember(roomId, memberId);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to remove member';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const inviteMember = useCallback(async (roomId: string, invitation: MemberInvitation): Promise<boolean> => {
    setIsLoading(true);
    setError(null);

    try {
      await roomService.inviteMember(roomId, invitation);
      return true;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to send invitation';
      setError(errorMessage);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getRoomMembers = useCallback(async (roomId: string): Promise<RoomMember[]> => {
    setIsLoading(true);
    setError(null);

    try {
      const members = await roomService.getRoomMembers(roomId);
      return members;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load room members';
      setError(errorMessage);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    isLoading,
    error,
    updateRoomSettings,
    deleteRoom,
    exportRoomData,
    updateMemberRole,
    removeMember,
    inviteMember,
    getRoomMembers,
    clearError,
  };
};

export default useRoomSettings;