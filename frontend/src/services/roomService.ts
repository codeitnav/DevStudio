import { httpClient } from '../lib/httpClient';
import type { 
  Room, 
  RoomMember, 
  CreateRoomData, 
  RoomJoinResponse, 
  RoomSettings,
  RoomRole,
  MemberInvitation,
  RoomExportData
} from '../types/room';
import type { RoomService as IRoomService } from '../types/services';

class RoomService implements IRoomService {
  /**
   * Create a new room
   */
  async createRoom(roomData: CreateRoomData): Promise<Room> {
    const response = await httpClient.post<Room>('/rooms', roomData);
    return response.data!;
  }

  /**
   * Join an existing room
   */
  async joinRoom(roomId: string, password?: string): Promise<RoomJoinResponse> {
    const response = await httpClient.post<RoomJoinResponse>(`/rooms/${roomId}/join`, {
      password,
    });
    return response.data!;
  }

  /**
   * Leave a room
   */
  async leaveRoom(roomId: string): Promise<void> {
    await httpClient.post(`/rooms/${roomId}/leave`);
  }

  /**
   * Get room information
   */
  async getRoomInfo(roomId: string): Promise<Room> {
    const response = await httpClient.get<Room>(`/rooms/${roomId}`);
    return response.data!;
  }

  /**
   * Update room settings (owner only)
   */
  async updateRoomSettings(roomId: string, settings: RoomSettings): Promise<Room> {
    const response = await httpClient.patch<Room>(`/rooms/${roomId}`, settings);
    return response.data!;
  }

  /**
   * Get room members
   */
  async getRoomMembers(roomId: string): Promise<RoomMember[]> {
    const response = await httpClient.get<RoomMember[]>(`/rooms/${roomId}/members`);
    return response.data!;
  }

  /**
   * Delete a room (owner only)
   */
  async deleteRoom(roomId: string): Promise<void> {
    await httpClient.delete(`/rooms/${roomId}`);
  }

  /**
   * Get user's rooms
   */
  async getUserRooms(): Promise<Room[]> {
    const response = await httpClient.get<Room[]>('/rooms/my-rooms');
    return response.data!;
  }

  /**
   * Get public rooms (for discovery)
   */
  async getPublicRooms(limit = 20, offset = 0): Promise<Room[]> {
    const response = await httpClient.get<Room[]>('/rooms/public', {
      params: { limit, offset }
    });
    return response.data!;
  }

  /**
   * Search rooms by name
   */
  async searchRooms(query: string, limit = 20): Promise<Room[]> {
    const response = await httpClient.get<Room[]>('/rooms/search', {
      params: { q: query, limit }
    });
    return response.data!;
  }

  /**
   * Update member role (owner only)
   */
  async updateMemberRole(roomId: string, memberId: string, role: RoomRole): Promise<void> {
    await httpClient.patch(`/rooms/${roomId}/members/${memberId}`, { role });
  }

  /**
   * Remove member from room (owner only)
   */
  async removeMember(roomId: string, memberId: string): Promise<void> {
    await httpClient.delete(`/rooms/${roomId}/members/${memberId}`);
  }

  /**
   * Invite member to room (owner only)
   */
  async inviteMember(roomId: string, invitation: MemberInvitation): Promise<void> {
    await httpClient.post(`/rooms/${roomId}/invite`, invitation);
  }

  /**
   * Export room data (owner only)
   */
  async exportRoomData(roomId: string): Promise<RoomExportData> {
    const response = await httpClient.get<RoomExportData>(`/rooms/${roomId}/export`);
    return response.data!;
  }
}

// Export singleton instance
export const roomService = new RoomService();
export default roomService;