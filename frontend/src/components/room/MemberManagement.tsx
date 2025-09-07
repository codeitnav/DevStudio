import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { Modal } from '../ui/Modal';
import { roomService } from '../../services/roomService';
import type { RoomMember, RoomRole, MemberInvitation } from '../../types/room';

interface MemberManagementProps {
  roomId: string;
  members: RoomMember[];
  currentUserRole: 'owner' | 'member';
  onMembersUpdated: () => void;
}

export const MemberManagement: React.FC<MemberManagementProps> = ({
  roomId,
  members,
  currentUserRole,
  onMembersUpdated,
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<RoomRole>('member');
  const [inviteError, setInviteError] = useState('');
  const [actioningMember, setActioningMember] = useState<string | null>(null);

  const isOwner = currentUserRole === 'owner';

  const handleInviteMember = async () => {
    if (!inviteEmail.trim()) {
      setInviteError('Email is required');
      return;
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteEmail)) {
      setInviteError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setInviteError('');

    try {
      const invitation: MemberInvitation = {
        email: inviteEmail,
        role: inviteRole,
      };

      await roomService.inviteMember(roomId, invitation);
      setShowInviteModal(false);
      setInviteEmail('');
      setInviteRole('member');
      onMembersUpdated();
    } catch (error: any) {
      setInviteError(error.response?.data?.message || 'Failed to send invitation');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateMemberRole = async (memberId: string, newRole: RoomRole) => {
    if (!isOwner) return;

    setActioningMember(memberId);
    try {
      await roomService.updateMemberRole(roomId, memberId, newRole);
      onMembersUpdated();
    } catch (error) {
      console.error('Failed to update member role:', error);
    } finally {
      setActioningMember(null);
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!isOwner) return;

    const member = members.find(m => m.userId === memberId);
    if (!member) return;

    const confirmed = window.confirm(
      `Are you sure you want to remove ${member.username} from this room?`
    );

    if (!confirmed) return;

    setActioningMember(memberId);
    try {
      await roomService.removeMember(roomId, memberId);
      onMembersUpdated();
    } catch (error) {
      console.error('Failed to remove member:', error);
    } finally {
      setActioningMember(null);
    }
  };

  const getRoleColor = (role: RoomRole) => {
    return role === 'owner' 
      ? 'bg-purple-100 text-purple-800' 
      : 'bg-blue-100 text-blue-800';
  };

  const getStatusColor = (isOnline: boolean) => {
    return isOnline 
      ? 'bg-green-100 text-green-800' 
      : 'bg-gray-100 text-gray-800';
  };

  const formatJoinDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header with Invite Button */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium text-gray-900">Room Members</h3>
          <p className="text-sm text-gray-600">
            Manage member roles and permissions
          </p>
        </div>
        {isOwner && (
          <Button onClick={() => setShowInviteModal(true)}>
            Invite Member
          </Button>
        )}
      </div>

      {/* Members List */}
      <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
        <div className="divide-y divide-gray-200">
          {members.map((member) => (
            <div key={member.userId} className="p-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Avatar */}
                <div 
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white font-medium"
                  style={{ backgroundColor: member.color }}
                >
                  {member.username.charAt(0).toUpperCase()}
                </div>

                {/* Member Info */}
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="font-medium text-gray-900">{member.username}</h4>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleColor(member.role)}`}>
                      {member.role}
                    </span>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(member.isOnline)}`}>
                      {member.isOnline ? 'Online' : 'Offline'}
                    </span>
                    {member.userType === 'guest' && (
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        Guest
                      </span>
                    )}
                  </div>
                  <p className="text-sm text-gray-500">
                    Joined {formatJoinDate(member.joinedAt)}
                  </p>
                </div>
              </div>

              {/* Actions */}
              {isOwner && member.role !== 'owner' && (
                <div className="flex items-center space-x-2">
                  {actioningMember === member.userId ? (
                    <LoadingSpinner size="sm" />
                  ) : (
                    <>
                      {/* Role Toggle */}
                      <select
                        value={member.role}
                        onChange={(e) => handleUpdateMemberRole(member.userId, e.target.value as RoomRole)}
                        className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        disabled={actioningMember === member.userId}
                      >
                        <option value="member">Member</option>
                        <option value="owner">Owner</option>
                      </select>

                      {/* Remove Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveMember(member.userId)}
                        disabled={actioningMember === member.userId}
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        Remove
                      </Button>
                    </>
                  )}
                </div>
              )}

              {/* Owner Badge (no actions) */}
              {member.role === 'owner' && (
                <div className="text-sm text-gray-500">
                  Room Owner
                </div>
              )}
            </div>
          ))}
        </div>

        {members.length === 0 && (
          <div className="p-8 text-center text-gray-500">
            No members found
          </div>
        )}
      </div>

      {/* Invite Member Modal */}
      {showInviteModal && (
        <Modal
          isOpen={showInviteModal}
          onClose={() => {
            setShowInviteModal(false);
            setInviteEmail('');
            setInviteRole('member');
            setInviteError('');
          }}
          title="Invite Member"
          size="small"
        >
          <div className="space-y-4">
            <div>
              <label htmlFor="inviteEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email Address *
              </label>
              <Input
                id="inviteEmail"
                type="email"
                value={inviteEmail}
                onChange={(e) => {
                  setInviteEmail(e.target.value);
                  setInviteError('');
                }}
                placeholder="Enter email address"
                error={inviteError}
                disabled={isLoading}
              />
            </div>

            <div>
              <label htmlFor="inviteRole" className="block text-sm font-medium text-gray-700 mb-1">
                Role
              </label>
              <select
                id="inviteRole"
                value={inviteRole}
                onChange={(e) => setInviteRole(e.target.value as RoomRole)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                disabled={isLoading}
              >
                <option value="member">Member</option>
                <option value="owner">Owner</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Owners can manage room settings and members
              </p>
            </div>

            <div className="flex gap-3 justify-end pt-4">
              <Button
                variant="outline"
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteEmail('');
                  setInviteRole('member');
                  setInviteError('');
                }}
                disabled={isLoading}
              >
                Cancel
              </Button>
              <Button
                onClick={handleInviteMember}
                disabled={isLoading}
                className="min-w-[100px]"
              >
                {isLoading ? <LoadingSpinner size="sm" /> : 'Send Invite'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MemberManagement;