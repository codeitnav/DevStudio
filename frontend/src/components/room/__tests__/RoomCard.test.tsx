import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RoomCard } from '../RoomCard';
import type { Room } from '../../../types/room';

const mockRoom: Room = {
  id: 'room-123',
  name: 'Test Room',
  description: 'A test room for collaborative coding',
  ownerId: 'user-456',
  isPublic: true,
  hasPassword: false,
  maxMembers: 10,
  currentMembers: 3,
  language: 'javascript',
  createdAt: new Date('2024-01-01T10:00:00Z'),
  lastActivity: new Date('2024-01-01T12:00:00Z'),
};

describe('RoomCard', () => {
  it('renders room information correctly', () => {
    const mockOnJoin = vi.fn();

    render(<RoomCard room={mockRoom} onJoin={mockOnJoin} />);

    expect(screen.getByText('Test Room')).toBeInTheDocument();
    expect(screen.getByText('A test room for collaborative coding')).toBeInTheDocument();
    expect(screen.getByText('javascript')).toBeInTheDocument();
    expect(screen.getByText('3/10 members')).toBeInTheDocument();
  });

  it('calls onJoin when join button is clicked', () => {
    const mockOnJoin = vi.fn();

    render(<RoomCard room={mockRoom} onJoin={mockOnJoin} />);

    const joinButton = screen.getByText('Join');
    fireEvent.click(joinButton);

    expect(mockOnJoin).toHaveBeenCalledWith('room-123');
  });

  it('shows settings button when showSettings is true', () => {
    const mockOnJoin = vi.fn();
    const mockOnSettings = vi.fn();

    render(
      <RoomCard
        room={mockRoom}
        onJoin={mockOnJoin}
        onSettings={mockOnSettings}
        showSettings={true}
      />
    );

    const settingsButton = screen.getByText('⚙️');
    expect(settingsButton).toBeInTheDocument();

    fireEvent.click(settingsButton);
    expect(mockOnSettings).toHaveBeenCalledWith('room-123');
  });

  it('disables join button when room is full', () => {
    const fullRoom: Room = {
      ...mockRoom,
      currentMembers: 10,
    };
    const mockOnJoin = vi.fn();

    render(<RoomCard room={fullRoom} onJoin={mockOnJoin} />);

    const joinButton = screen.getByText('Full');
    expect(joinButton).toBeDisabled();
  });

  it('shows password and private indicators', () => {
    const privateRoom: Room = {
      ...mockRoom,
      isPublic: false,
      hasPassword: true,
    };
    const mockOnJoin = vi.fn();

    render(<RoomCard room={privateRoom} onJoin={mockOnJoin} />);

    expect(screen.getByTitle('Password protected')).toBeInTheDocument();
    expect(screen.getByTitle('Private room')).toBeInTheDocument();
  });
});