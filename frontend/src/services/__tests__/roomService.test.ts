import { describe, it, expect, vi, beforeEach } from 'vitest';
import { roomService } from '../roomService';
import { httpClient } from '../../lib/httpClient';
import type { Room, CreateRoomData, RoomJoinResponse } from '../../types/room';

// Mock the httpClient
vi.mock('../../lib/httpClient', () => ({
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
  },
}));

const mockHttpClient = httpClient as any;

describe('RoomService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createRoom', () => {
    it('should create a room successfully', async () => {
      const roomData: CreateRoomData = {
        name: 'Test Room',
        description: 'A test room',
        isPublic: true,
        maxMembers: 10,
        language: 'javascript',
      };

      const mockRoom: Room = {
        id: 'room-123',
        name: 'Test Room',
        description: 'A test room',
        ownerId: 'user-123',
        isPublic: true,
        hasPassword: false,
        maxMembers: 10,
        currentMembers: 1,
        language: 'javascript',
        createdAt: new Date(),
        lastActivity: new Date(),
      };

      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: mockRoom,
      });

      const result = await roomService.createRoom(roomData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/rooms', roomData);
      expect(result).toEqual(mockRoom);
    });
  });

  describe('joinRoom', () => {
    it('should join a room without password', async () => {
      const roomId = 'room-123';
      const mockResponse: RoomJoinResponse = {
        room: {
          id: roomId,
          name: 'Test Room',
          description: 'A test room',
          ownerId: 'user-456',
          isPublic: true,
          hasPassword: false,
          maxMembers: 10,
          currentMembers: 2,
          language: 'javascript',
          createdAt: new Date(),
          lastActivity: new Date(),
        },
        members: [],
        currentUser: {
          userId: 'user-123',
          username: 'testuser',
          userType: 'user',
          role: 'member',
          isOnline: true,
          joinedAt: new Date(),
          color: '#ff0000',
        },
      };

      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const result = await roomService.joinRoom(roomId);

      expect(mockHttpClient.post).toHaveBeenCalledWith(`/rooms/${roomId}/join`, {
        password: undefined,
      });
      expect(result).toEqual(mockResponse);
    });

    it('should join a room with password', async () => {
      const roomId = 'room-123';
      const password = 'secret123';
      const mockResponse: RoomJoinResponse = {
        room: {
          id: roomId,
          name: 'Private Room',
          description: 'A private room',
          ownerId: 'user-456',
          isPublic: false,
          hasPassword: true,
          maxMembers: 5,
          currentMembers: 2,
          language: 'python',
          createdAt: new Date(),
          lastActivity: new Date(),
        },
        members: [],
        currentUser: {
          userId: 'user-123',
          username: 'testuser',
          userType: 'user',
          role: 'member',
          isOnline: true,
          joinedAt: new Date(),
          color: '#00ff00',
        },
      };

      mockHttpClient.post.mockResolvedValue({
        success: true,
        data: mockResponse,
      });

      const result = await roomService.joinRoom(roomId, password);

      expect(mockHttpClient.post).toHaveBeenCalledWith(`/rooms/${roomId}/join`, {
        password,
      });
      expect(result).toEqual(mockResponse);
    });
  });

  describe('getUserRooms', () => {
    it('should get user rooms', async () => {
      const mockRooms: Room[] = [
        {
          id: 'room-1',
          name: 'My Room 1',
          description: 'First room',
          ownerId: 'user-123',
          isPublic: true,
          hasPassword: false,
          maxMembers: 10,
          currentMembers: 3,
          language: 'javascript',
          createdAt: new Date(),
          lastActivity: new Date(),
        },
        {
          id: 'room-2',
          name: 'My Room 2',
          description: 'Second room',
          ownerId: 'user-123',
          isPublic: false,
          hasPassword: true,
          maxMembers: 5,
          currentMembers: 1,
          language: 'python',
          createdAt: new Date(),
          lastActivity: new Date(),
        },
      ];

      mockHttpClient.get.mockResolvedValue({
        success: true,
        data: mockRooms,
      });

      const result = await roomService.getUserRooms();

      expect(mockHttpClient.get).toHaveBeenCalledWith('/rooms/my-rooms');
      expect(result).toEqual(mockRooms);
    });
  });

  describe('searchRooms', () => {
    it('should search rooms by query', async () => {
      const query = 'javascript';
      const mockRooms: Room[] = [
        {
          id: 'room-1',
          name: 'JavaScript Study Group',
          description: 'Learning JS together',
          ownerId: 'user-456',
          isPublic: true,
          hasPassword: false,
          maxMembers: 15,
          currentMembers: 8,
          language: 'javascript',
          createdAt: new Date(),
          lastActivity: new Date(),
        },
      ];

      mockHttpClient.get.mockResolvedValue({
        success: true,
        data: mockRooms,
      });

      const result = await roomService.searchRooms(query);

      expect(mockHttpClient.get).toHaveBeenCalledWith('/rooms/search', {
        params: { q: query, limit: 20 },
      });
      expect(result).toEqual(mockRooms);
    });
  });

  describe('leaveRoom', () => {
    it('should leave a room', async () => {
      const roomId = 'room-123';

      mockHttpClient.post.mockResolvedValue({
        success: true,
      });

      await roomService.leaveRoom(roomId);

      expect(mockHttpClient.post).toHaveBeenCalledWith(`/rooms/${roomId}/leave`);
    });
  });

  describe('deleteRoom', () => {
    it('should delete a room', async () => {
      const roomId = 'room-123';

      mockHttpClient.delete.mockResolvedValue({
        success: true,
      });

      await roomService.deleteRoom(roomId);

      expect(mockHttpClient.delete).toHaveBeenCalledWith(`/rooms/${roomId}`);
    });
  });
});