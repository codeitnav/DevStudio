import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { RoomSettings } from '../RoomSettings';
import { roomService } from '../../../services/roomService';
import type { Room, RoomMember } from '../../../types/room';

// Mock the room service
vi.mock('../../../services/roomService', () => ({
  roomService: {
    updateRoomSettings: vi.fn(),
    deleteRoom: vi.fn(),
    exportRoomData: vi.fn(),
    getRoomMembers: vi.fn(),
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
    inviteMember: vi.fn(),
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

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: vi.fn(() => true),
});

describe('RoomSettings Integration', () => {
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

  const mockMembers: RoomMember[] = [
    {
      userId: 'user-1',
      username: 'owner',
      userType: 'user',
      role: 'owner',
      isOnline: true,
      joinedAt: new Date(),
      color: '#ff0000',
    },
    {
      userId: 'user-2',
      username: 'member1',
      userType: 'user',
      role: 'member',
      isOnline: false,
      joinedAt: new Date(),
      color: '#00ff00',
    },
  ];

  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    room: mockRoom,
    currentUserRole: 'owner' as const,
    onRoomUpdated: vi.fn(),
    onRoomDeleted: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(roomService.getRoomMembers).mockResolvedValue(mockMembers);
  });

  it('should complete full room settings workflow', async () => {
    const updatedRoom = { ...mockRoom, name: 'Updated Room', isPublic: false };
    vi.mocked(roomService.updateRoomSettings).mockResolvedValue(updatedRoom);

    render(<RoomSettings {...defaultProps} />);

    // Wait for members to load
    await waitFor(() => {
      expect(screen.getByText('Members (2)')).toBeInTheDocument();
    });

    // Update room settings
    const nameInput = screen.getByDisplayValue('Test Room');
    fireEvent.change(nameInput, { target: { value: 'Updated Room' } });

    // Switch to private
    const privateRadio = screen.getByLabelText('Private (password required)');
    fireEvent.click(privateRadio);

    // Add password
    await waitFor(() => {
      const passwordInput = screen.getByLabelText(/room password/i);
      fireEvent.change(passwordInput, { target: { value: 'newpassword' } });
    });

    // Save changes
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(roomService.updateRoomSettings).toHaveBeenCalledWith('room-1', {
        name: 'Updated Room',
        description: 'Test Description',
        isPublic: false,
        password: 'newpassword',
        maxMembers: 10,
        language: 'javascript',
      });
    });

    expect(defaultProps.onRoomUpdated).toHaveBeenCalledWith(updatedRoom);
  });

  it('should complete member management workflow', async () => {
    vi.mocked(roomService.inviteMember).mockResolvedValue(undefined);
    vi.mocked(roomService.updateMemberRole).mockResolvedValue(undefined);

    render(<RoomSettings {...defaultProps} />);

    // Switch to members tab
    await waitFor(() => {
      const membersTab = screen.getByText('Members (2)');
      fireEvent.click(membersTab);
    });

    // Invite a new member
    const inviteButton = screen.getByText('Invite Member');
    fireEvent.click(inviteButton);

    const emailInput = screen.getByLabelText('Email Address *');
    fireEvent.change(emailInput, { target: { value: 'newmember@example.com' } });

    const sendButton = screen.getByText('Send Invite');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(roomService.inviteMember).toHaveBeenCalledWith('room-1', {
        email: 'newmember@example.com',
        role: 'member',
      });
    });

    // Update member role
    const roleSelects = screen.getAllByDisplayValue('member');
    if (roleSelects.length > 0) {
      fireEvent.change(roleSelects[0], { target: { value: 'owner' } });

      await waitFor(() => {
        expect(roomService.updateMemberRole).toHaveBeenCalledWith('room-1', 'user-2', 'owner');
      });
    }
  });

  it('should complete danger zone workflow', async () => {
    const mockExportData = {
      room: mockRoom,
      members: mockMembers,
      files: [],
      createdAt: new Date(),
    };
    vi.mocked(roomService.exportRoomData).mockResolvedValue(mockExportData);
    vi.mocked(roomService.deleteRoom).mockResolvedValue(undefined);

    render(<RoomSettings {...defaultProps} />);

    // Switch to danger zone
    const dangerTab = screen.getByText('Danger Zone');
    fireEvent.click(dangerTab);

    // Export data
    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(roomService.exportRoomData).toHaveBeenCalledWith('room-1');
    });

    // Delete room
    const deleteButton = screen.getByText('Delete Room');
    fireEvent.click(deleteButton);

    // Confirm deletion
    const confirmButton = screen.getByRole('button', { name: /delete room/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(roomService.deleteRoom).toHaveBeenCalledWith('room-1');
    });

    expect(defaultProps.onRoomDeleted).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should handle errors gracefully throughout workflow', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    // Mock various errors
    vi.mocked(roomService.getRoomMembers).mockRejectedValue(new Error('Failed to load members'));
    vi.mocked(roomService.updateRoomSettings).mockRejectedValue(new Error('Update failed'));

    render(<RoomSettings {...defaultProps} />);

    // Should handle member loading error
    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to load members:', expect.any(Error));
    });

    // Should handle settings update error
    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to update room settings:', expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it('should maintain proper accessibility throughout workflow', async () => {
    render(<RoomSettings {...defaultProps} />);

    // Check modal accessibility
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByLabelText('Close dialog')).toBeInTheDocument();

    // Check form accessibility
    expect(screen.getByLabelText('Room Name *')).toBeInTheDocument();
    expect(screen.getByLabelText('Programming Language')).toBeInTheDocument();

    // Switch to members tab and check accessibility
    await waitFor(() => {
      const membersTab = screen.getByText('Members (2)');
      fireEvent.click(membersTab);
    });

    // Check invite form accessibility
    const inviteButton = screen.getByText('Invite Member');
    fireEvent.click(inviteButton);

    expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
  });
});