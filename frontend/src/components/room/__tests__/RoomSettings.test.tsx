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

describe('RoomSettings', () => {
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
      username: 'member',
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

  it('should render room settings modal when open', async () => {
    render(<RoomSettings {...defaultProps} />);

    expect(screen.getByText('Room Settings')).toBeInTheDocument();
    expect(screen.getByText('General')).toBeInTheDocument();
    expect(screen.getByText('Members (0)')).toBeInTheDocument();
    expect(screen.getByText('Danger Zone')).toBeInTheDocument();

    // Wait for members to load
    await waitFor(() => {
      expect(screen.getByText('Members (2)')).toBeInTheDocument();
    });
  });

  it('should not render when closed', () => {
    render(<RoomSettings {...defaultProps} isOpen={false} />);

    expect(screen.queryByText('Room Settings')).not.toBeInTheDocument();
  });

  it('should display room information in general tab', async () => {
    render(<RoomSettings {...defaultProps} />);

    expect(screen.getByDisplayValue('Test Room')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Test Description')).toBeInTheDocument();
    expect(screen.getByDisplayValue('10')).toBeInTheDocument();
    expect(screen.getByDisplayValue('javascript')).toBeInTheDocument();
  });

  it('should allow owner to update room settings', async () => {
    const updatedRoom = { ...mockRoom, name: 'Updated Room' };
    vi.mocked(roomService.updateRoomSettings).mockResolvedValue(updatedRoom);

    render(<RoomSettings {...defaultProps} />);

    const nameInput = screen.getByDisplayValue('Test Room');
    fireEvent.change(nameInput, { target: { value: 'Updated Room' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(roomService.updateRoomSettings).toHaveBeenCalledWith('room-1', {
        name: 'Updated Room',
        description: 'Test Description',
        isPublic: true,
        maxMembers: 10,
        language: 'javascript',
      });
    });

    expect(defaultProps.onRoomUpdated).toHaveBeenCalledWith(updatedRoom);
  });

  it('should not allow member to update room settings', () => {
    render(<RoomSettings {...defaultProps} currentUserRole="member" />);

    const nameInput = screen.getByDisplayValue('Test Room');
    expect(nameInput).toBeDisabled();

    expect(screen.queryByText('Save Changes')).not.toBeInTheDocument();
  });

  it('should switch to members tab', async () => {
    render(<RoomSettings {...defaultProps} />);

    const membersTab = screen.getByText('Members (0)');
    fireEvent.click(membersTab);

    await waitFor(() => {
      expect(screen.getByText('Room Members')).toBeInTheDocument();
    });
  });

  it('should switch to danger zone tab for owners', () => {
    render(<RoomSettings {...defaultProps} />);

    const dangerTab = screen.getByText('Danger Zone');
    fireEvent.click(dangerTab);

    expect(screen.getByText('Export Room Data')).toBeInTheDocument();
    expect(screen.getByText('Delete Room')).toBeInTheDocument();
  });

  it('should not show danger zone tab for members', () => {
    render(<RoomSettings {...defaultProps} currentUserRole="member" />);

    expect(screen.queryByText('Danger Zone')).not.toBeInTheDocument();
  });

  it('should handle room export', async () => {
    const mockExportData = {
      room: mockRoom,
      members: mockMembers,
      files: [],
      createdAt: new Date(),
    };
    vi.mocked(roomService.exportRoomData).mockResolvedValue(mockExportData);

    render(<RoomSettings {...defaultProps} />);

    const dangerTab = screen.getByText('Danger Zone');
    fireEvent.click(dangerTab);

    const exportButton = screen.getByText('Export');
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(roomService.exportRoomData).toHaveBeenCalledWith('room-1');
    });
  });

  it('should handle room deletion with confirmation', async () => {
    vi.mocked(roomService.deleteRoom).mockResolvedValue(undefined);

    render(<RoomSettings {...defaultProps} />);

    const dangerTab = screen.getByText('Danger Zone');
    fireEvent.click(dangerTab);

    const deleteButton = screen.getByText('Delete Room');
    fireEvent.click(deleteButton);

    // Confirm deletion in modal
    const confirmButton = screen.getByRole('button', { name: /delete room/i });
    fireEvent.click(confirmButton);

    await waitFor(() => {
      expect(roomService.deleteRoom).toHaveBeenCalledWith('room-1');
    });

    expect(defaultProps.onRoomDeleted).toHaveBeenCalled();
    expect(defaultProps.onClose).toHaveBeenCalled();
  });

  it('should validate form inputs', async () => {
    render(<RoomSettings {...defaultProps} />);

    const nameInput = screen.getByDisplayValue('Test Room');
    fireEvent.change(nameInput, { target: { value: '' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText('Room name is required')).toBeInTheDocument();
    });

    expect(roomService.updateRoomSettings).not.toHaveBeenCalled();
  });

  it('should handle private room password settings', async () => {
    render(<RoomSettings {...defaultProps} />);

    // Switch to private
    const privateRadio = screen.getByLabelText('Private (password required)');
    fireEvent.click(privateRadio);

    // Password field should appear
    await waitFor(() => {
      expect(screen.getByLabelText(/room password/i)).toBeInTheDocument();
    });

    const passwordInput = screen.getByLabelText(/room password/i);
    fireEvent.change(passwordInput, { target: { value: 'newpassword' } });

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(roomService.updateRoomSettings).toHaveBeenCalledWith('room-1', {
        name: 'Test Room',
        description: 'Test Description',
        isPublic: false,
        password: 'newpassword',
        maxMembers: 10,
        language: 'javascript',
      });
    });
  });

  it('should handle errors gracefully', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(roomService.updateRoomSettings).mockRejectedValue(new Error('Update failed'));

    render(<RoomSettings {...defaultProps} />);

    const saveButton = screen.getByText('Save Changes');
    fireEvent.click(saveButton);

    await waitFor(() => {
      expect(consoleError).toHaveBeenCalledWith('Failed to update room settings:', expect.any(Error));
    });

    consoleError.mockRestore();
  });

  it('should close modal when close button is clicked', () => {
    render(<RoomSettings {...defaultProps} />);

    const closeButton = screen.getByLabelText('Close dialog');
    fireEvent.click(closeButton);

    expect(defaultProps.onClose).toHaveBeenCalled();
  });
});