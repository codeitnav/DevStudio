import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import { MemberManagement } from '../MemberManagement';
import { roomService } from '../../../services/roomService';
import type { RoomMember } from '../../../types/room';

// Mock the room service
vi.mock('../../../services/roomService', () => ({
  roomService: {
    updateMemberRole: vi.fn(),
    removeMember: vi.fn(),
    inviteMember: vi.fn(),
  },
}));

// Mock window.confirm
Object.defineProperty(window, 'confirm', {
  value: vi.fn(() => true),
});

describe('MemberManagement', () => {
  const mockMembers: RoomMember[] = [
    {
      userId: 'user-1',
      username: 'owner',
      userType: 'user',
      role: 'owner',
      isOnline: true,
      joinedAt: new Date('2024-01-01'),
      color: '#ff0000',
    },
    {
      userId: 'user-2',
      username: 'member1',
      userType: 'user',
      role: 'member',
      isOnline: false,
      joinedAt: new Date('2024-01-02'),
      color: '#00ff00',
    },
    {
      userId: 'user-3',
      username: 'guest1',
      userType: 'guest',
      role: 'member',
      isOnline: true,
      joinedAt: new Date('2024-01-03'),
      color: '#0000ff',
    },
  ];

  const defaultProps = {
    roomId: 'room-1',
    members: mockMembers,
    currentUserRole: 'owner' as const,
    onMembersUpdated: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render member management interface', () => {
    render(<MemberManagement {...defaultProps} />);

    expect(screen.getByText('Room Members')).toBeInTheDocument();
    expect(screen.getByText('Manage member roles and permissions')).toBeInTheDocument();
    expect(screen.getByText('Invite Member')).toBeInTheDocument();
  });

  it('should display all members with correct information', () => {
    render(<MemberManagement {...defaultProps} />);

    // Check owner
    expect(screen.getByText('owner')).toBeInTheDocument();
    expect(screen.getByText('Room Owner')).toBeInTheDocument();
    expect(screen.getByText('Online')).toBeInTheDocument();

    // Check member
    expect(screen.getByText('member1')).toBeInTheDocument();
    expect(screen.getByText('Offline')).toBeInTheDocument();

    // Check guest
    expect(screen.getByText('guest1')).toBeInTheDocument();
    expect(screen.getByText('Guest')).toBeInTheDocument();
  });

  it('should not show invite button for members', () => {
    render(<MemberManagement {...defaultProps} currentUserRole="member" />);

    expect(screen.queryByText('Invite Member')).not.toBeInTheDocument();
  });

  it('should open invite modal when invite button is clicked', () => {
    render(<MemberManagement {...defaultProps} />);

    const inviteButton = screen.getByText('Invite Member');
    fireEvent.click(inviteButton);

    expect(screen.getByText('Invite Member')).toBeInTheDocument();
    expect(screen.getByLabelText('Email Address *')).toBeInTheDocument();
    expect(screen.getByLabelText('Role')).toBeInTheDocument();
  });

  it('should handle member invitation', async () => {
    vi.mocked(roomService.inviteMember).mockResolvedValue(undefined);

    render(<MemberManagement {...defaultProps} />);

    const inviteButton = screen.getByText('Invite Member');
    fireEvent.click(inviteButton);

    const emailInput = screen.getByLabelText('Email Address *');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const roleSelect = screen.getByLabelText('Role');
    fireEvent.change(roleSelect, { target: { value: 'member' } });

    const sendButton = screen.getByText('Send Invite');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(roomService.inviteMember).toHaveBeenCalledWith('room-1', {
        email: 'test@example.com',
        role: 'member',
      });
    });

    expect(defaultProps.onMembersUpdated).toHaveBeenCalled();
  });

  it('should validate email in invite form', async () => {
    render(<MemberManagement {...defaultProps} />);

    const inviteButton = screen.getByText('Invite Member');
    fireEvent.click(inviteButton);

    const sendButton = screen.getByText('Send Invite');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Email is required')).toBeInTheDocument();
    });

    const emailInput = screen.getByLabelText('Email Address *');
    fireEvent.change(emailInput, { target: { value: 'invalid-email' } });
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address')).toBeInTheDocument();
    });

    expect(roomService.inviteMember).not.toHaveBeenCalled();
  });

  it('should handle member role update', async () => {
    vi.mocked(roomService.updateMemberRole).mockResolvedValue(undefined);

    render(<MemberManagement {...defaultProps} />);

    // Find the role select for member1 (not owner)
    const roleSelects = screen.getAllByDisplayValue('member');
    const memberRoleSelect = roleSelects[0]; // First member (not owner)

    fireEvent.change(memberRoleSelect, { target: { value: 'owner' } });

    await waitFor(() => {
      expect(roomService.updateMemberRole).toHaveBeenCalledWith('room-1', 'user-2', 'owner');
    });

    expect(defaultProps.onMembersUpdated).toHaveBeenCalled();
  });

  it('should handle member removal with confirmation', async () => {
    vi.mocked(roomService.removeMember).mockResolvedValue(undefined);

    render(<MemberManagement {...defaultProps} />);

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);

    expect(window.confirm).toHaveBeenCalledWith(
      'Are you sure you want to remove member1 from this room?'
    );

    await waitFor(() => {
      expect(roomService.removeMember).toHaveBeenCalledWith('room-1', 'user-2');
    });

    expect(defaultProps.onMembersUpdated).toHaveBeenCalled();
  });

  it('should not remove member if confirmation is cancelled', async () => {
    vi.mocked(window.confirm).mockReturnValue(false);

    render(<MemberManagement {...defaultProps} />);

    const removeButtons = screen.getAllByText('Remove');
    fireEvent.click(removeButtons[0]);

    expect(window.confirm).toHaveBeenCalled();
    expect(roomService.removeMember).not.toHaveBeenCalled();
  });

  it('should not show actions for owner member', () => {
    render(<MemberManagement {...defaultProps} />);

    // Owner should not have role select or remove button
    const ownerRow = screen.getByText('owner').closest('div');
    expect(ownerRow).toBeInTheDocument();
    expect(screen.getByText('Room Owner')).toBeInTheDocument();

    // Should not have role select for owner
    const roleSelects = screen.getAllByDisplayValue('member');
    expect(roleSelects).toHaveLength(2); // Only for the two members, not owner
  });

  it('should not show actions for non-owners', () => {
    render(<MemberManagement {...defaultProps} currentUserRole="member" />);

    expect(screen.queryByText('Remove')).not.toBeInTheDocument();
    expect(screen.queryByDisplayValue('member')).not.toBeInTheDocument();
  });

  it('should display empty state when no members', () => {
    render(<MemberManagement {...defaultProps} members={[]} />);

    expect(screen.getByText('No members found')).toBeInTheDocument();
  });

  it('should handle invite error', async () => {
    const errorMessage = 'User already invited';
    vi.mocked(roomService.inviteMember).mockRejectedValue({
      response: { data: { message: errorMessage } },
    });

    render(<MemberManagement {...defaultProps} />);

    const inviteButton = screen.getByText('Invite Member');
    fireEvent.click(inviteButton);

    const emailInput = screen.getByLabelText('Email Address *');
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });

    const sendButton = screen.getByText('Send Invite');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText(errorMessage)).toBeInTheDocument();
    });
  });

  it('should close invite modal when cancel is clicked', () => {
    render(<MemberManagement {...defaultProps} />);

    const inviteButton = screen.getByText('Invite Member');
    fireEvent.click(inviteButton);

    expect(screen.getByText('Invite Member')).toBeInTheDocument();

    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);

    // Modal should be closed (invite form should not be visible)
    expect(screen.queryByLabelText('Email Address *')).not.toBeInTheDocument();
  });

  it('should show loading state during actions', async () => {
    vi.mocked(roomService.updateMemberRole).mockImplementation(
      () => new Promise(resolve => setTimeout(resolve, 100))
    );

    render(<MemberManagement {...defaultProps} />);

    const roleSelects = screen.getAllByDisplayValue('member');
    fireEvent.change(roleSelects[0], { target: { value: 'owner' } });

    // Should show loading spinner
    await waitFor(() => {
      expect(screen.getByRole('status')).toBeInTheDocument();
    });
  });

  it('should format join dates correctly', () => {
    render(<MemberManagement {...defaultProps} />);

    expect(screen.getByText('Joined Jan 1, 2024')).toBeInTheDocument();
    expect(screen.getByText('Joined Jan 2, 2024')).toBeInTheDocument();
    expect(screen.getByText('Joined Jan 3, 2024')).toBeInTheDocument();
  });
});