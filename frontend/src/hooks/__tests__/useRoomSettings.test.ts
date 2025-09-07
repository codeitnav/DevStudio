import { renderHook, act } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { useRoomSettings } from '../useRoomSettings';
import { roomService } from '../../services/roomService';
import type { Room, RoomSettings, RoomMember, MemberInvitation } from '../../types/room';

// Mock the room service
vi.mock('../../services/roomService', () => ({
  roomService: {
    updateRoomSettings: vi.fn(),
    deleteRoom: vi.fn(),
    exportRoomData: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
    inviteMember: vi.fn(),
    getRoomMembers: vi.fn(),
  },
}));

// Mock URL.createObjectURL and related APIs
Object.defineProperty(global, 'URL', {
  value: {
    createObjectURL: vi.fn(() => 'mock-url'),
    revokeObjectURL: vi.fn(),
  },
});

// Mock document methods
Object.defineProperty(document, 'createElement', {
  value: vi.fn(() => ({
    href: '',
    download: '',
    click: vi.fn(),
  })),
});

Object.defineProperty(document.body, 'appendChild', {
  value: vi.fn(),
});

Object.defineProperty(document.body, 'removeChild', {
  value: vi.fn(),
});

describe('useRoomSettings', () => {
  const mockRoom: Room = {
    id: 'room-1',
    name: 'Test Room',
    description: 'Test Description',
    ownerId: 'user-1',
    isPublic: true,
    hasPassword: false,
    maxMembers: 10,
    currentMembers: 3,
    language: 'javascript',
    createdAt: new Date(),
    lastActivity: new Date(),
  };

  const mockMember: RoomMember = {
    userId: 'user-2',
    username: 'testuser',
    userType: 'user',
    role: 'member',
    isOnline: true,
    joinedAt: new Date(),
    color: '#ff0000',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const { result } = renderHook(() => useRoomSettings());

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(typeof result.current.updateRoomSettings).toBe('function');
    expect(typeof result.current.deleteRoom).toBe('function');
    expect(typeof result.current.exportRoomData).toBe('function');
    expect(typeof result.current.updateMemberRole).toBe('function');
    expect(typeof result.current.removeMember).toBe('function');
    expect(typeof result.current.inviteMember).toBe('function');
    expect(typeof result.current.getRoomMembers).toBe('function');
    expect(typeof result.current.clearError).toBe('function');
  });

  it('should update room settings successfully', async () => {
    const mockUpdatedRoom = { ...mockRoom, name: 'Updated Room' };
    vi.mocked(roomService.updateRoomSettings).mockResolvedValue(mockUpdatedRoom);

    const { result } = renderHook(() => useRoomSettings());

    const settings: RoomSettings = { name: 'Updated Room' };
    let updatedRoom: Room | null = null;

    await act(async () => {
      updatedRoom = await result.current.updateRoomSettings('room-1', settings);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(updatedRoom).toEqual(mockUpdatedRoom);
    expect(roomService.updateRoomSettings).toHaveBeenCalledWith('room-1', settings);
  });

  it('should handle update room settings error', async () => {
    const errorMessage = 'Failed to update room';
    vi.mocked(roomService.updateRoomSettings).mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    const { result } = renderHook(() => useRoomSettings());

    let updatedRoom: Room | null = null;

    await act(async () => {
      updatedRoom = await result.current.updateRoomSettings('room-1', {});
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(updatedRoom).toBe(null);
  });

  it('should delete room successfully', async () => {
    vi.mocked(roomService.deleteRoom).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRoomSettings());

    let success = false;

    await act(async () => {
      success = await result.current.deleteRoom('room-1');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(success).toBe(true);
    expect(roomService.deleteRoom).toHaveBeenCalledWith('room-1');
  });

  it('should handle delete room error', async () => {
    const errorMessage = 'Failed to delete room';
    vi.mocked(roomService.deleteRoom).mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    const { result } = renderHook(() => useRoomSettings());

    let success = true;

    await act(async () => {
      success = await result.current.deleteRoom('room-1');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(errorMessage);
    expect(success).toBe(false);
  });

  it('should export room data successfully', async () => {
    const mockExportData = {
      room: mockRoom,
      members: [mockMember],
      files: [],
      createdAt: new Date(),
    };
    vi.mocked(roomService.exportRoomData).mockResolvedValue(mockExportData);

    const { result } = renderHook(() => useRoomSettings());

    let success = false;

    await act(async () => {
      success = await result.current.exportRoomData('room-1', 'Test Room');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(success).toBe(true);
    expect(roomService.exportRoomData).toHaveBeenCalledWith('room-1');
  });

  it('should update member role successfully', async () => {
    vi.mocked(roomService.updateMemberRole).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRoomSettings());

    let success = false;

    await act(async () => {
      success = await result.current.updateMemberRole('room-1', 'user-2', 'owner');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(success).toBe(true);
    expect(roomService.updateMemberRole).toHaveBeenCalledWith('room-1', 'user-2', 'owner');
  });

  it('should remove member successfully', async () => {
    vi.mocked(roomService.removeMember).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRoomSettings());

    let success = false;

    await act(async () => {
      success = await result.current.removeMember('room-1', 'user-2');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(success).toBe(true);
    expect(roomService.removeMember).toHaveBeenCalledWith('room-1', 'user-2');
  });

  it('should invite member successfully', async () => {
    vi.mocked(roomService.inviteMember).mockResolvedValue(undefined);

    const { result } = renderHook(() => useRoomSettings());

    const invitation: MemberInvitation = {
      email: 'test@example.com',
      role: 'member',
    };

    let success = false;

    await act(async () => {
      success = await result.current.inviteMember('room-1', invitation);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(success).toBe(true);
    expect(roomService.inviteMember).toHaveBeenCalledWith('room-1', invitation);
  });

  it('should get room members successfully', async () => {
    const mockMembers = [mockMember];
    vi.mocked(roomService.getRoomMembers).mockResolvedValue(mockMembers);

    const { result } = renderHook(() => useRoomSettings());

    let members: RoomMember[] = [];

    await act(async () => {
      members = await result.current.getRoomMembers('room-1');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(members).toEqual(mockMembers);
    expect(roomService.getRoomMembers).toHaveBeenCalledWith('room-1');
  });

  it('should clear error', () => {
    const { result } = renderHook(() => useRoomSettings());

    // Set an error first
    act(() => {
      (result.current as any).setError('Test error');
    });

    act(() => {
      result.current.clearError();
    });

    expect(result.current.error).toBe(null);
  });

  it('should handle loading states correctly', async () => {
    vi.mocked(roomService.updateRoomSettings).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    const { result } = renderHook(() => useRoomSettings());

    expect(result.current.isLoading).toBe(false);

    const promise = act(async () => {
      result.current.updateRoomSettings('room-1', {});
    });

    expect(result.current.isLoading).toBe(true);

    await promise;

    expect(result.current.isLoading).toBe(false);
  });
});