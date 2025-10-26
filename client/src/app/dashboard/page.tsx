'use client';

import React, { useState, useEffect, useCallback, FC } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext'; // Updated path
import * as api from '@/lib/services/api';
import Avatar from 'boring-avatars';
import {
  Plus,
  LogOut,
  Trash2,
  MoreVertical,
  Loader2,
  Crown,
  X,
  UserPlus,
} from 'lucide-react';

// --- TYPE DEFINITIONS (FIXED) ---
// This new type correctly combines Room properties with a flexible members array
type RoomWithMembers = Omit<api.Room, 'members'> & {
  members: (api.User | string)[];
};

// --- SUB-COMPONENTS ---

const Modal: FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({
  isOpen,
  onClose,
  children,
}) => {
  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
        >
          <X size={24} />
        </button>
        {children}
      </div>
    </div>
  );
};

const CreateRoomForm: FC<{ onClose: () => void; onRoomCreated: () => void }> = ({
  onClose,
  onRoomCreated,
}) => {
  const [roomName, setRoomName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomName.trim()) {
      setError('Room name cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await api.createRoom(roomName);
      onRoomCreated();
      onClose();
    } catch (err) {
      setError('Failed to create room. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">Create New Room</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={roomName}
          onChange={e => setRoomName(e.target.value)}
          placeholder="Enter room name..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
          disabled={isLoading}
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full bg-[#166EC1] hover:bg-[#145ca5] text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : 'Create Room'}
        </button>
      </form>
    </div>
  );
};

const InviteMemberForm: FC<{ room: RoomWithMembers; onClose: () => void; onMemberAdded: () => void }> = ({
  room,
  onClose,
  onMemberAdded,
}) => {
  const [userId, setUserId] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userId.trim()) {
      setError('User ID cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      await api.addMember(room.roomId, userId);
      onMemberAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add member. Please check the ID.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Invite to "{room.name}"</h2>
      <p className="text-sm text-gray-500 mb-4">Enter the User ID of the person you want to invite.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={userId}
          onChange={e => setUserId(e.target.value)}
          placeholder="Enter User ID..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
          disabled={isLoading}
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full bg-[#166EC1] hover:bg-[#145ca5] text-white px-8 py-3 rounded-lg font-semibold text-lg transition-colors flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : 'Send Invite'}
        </button>
      </form>
    </div>
  );
};

const RoomCard: FC<{
  room: RoomWithMembers;
  currentUserId: string;
  onInvite: (room: RoomWithMembers) => void;
  onDelete: (roomId: string, roomName: string) => void;
}> = ({ room, currentUserId, onInvite, onDelete }) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwner = room.owner === currentUserId;

  return (
    <div
      onClick={() => router.push(`/playground/${room.roomId}`)}
      className="bg-white rounded-lg shadow-md p-6 group cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1 border border-gray-200"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{room.name}</h3>
          <div className="flex items-center">
            {isOwner && (
              <span className="flex items-center text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded-full mr-2">
                <Crown size={12} className="mr-1" />
                Owner
              </span>
            )}
            <div className="flex -space-x-2">
              {room.members.slice(0, 4).map(member => (
                <div key={typeof member === 'string' ? member : member._id} className="h-8 w-8 rounded-full border-2 border-white">
                  <Avatar
                    size={32}
                    name={typeof member === 'string' ? member : (member as api.User).username}
                    variant="beam"
                    colors={['#166EC1', '#145ca5', '#F0AB3D', '#C271B4', '#C20D90']}
                  />
                </div>
              ))}
            </div>
          </div>
        </div>
        {isOwner && (
          <div className="relative">
            <button
              onClick={e => {
                e.stopPropagation();
                setMenuOpen(!menuOpen);
              }}
              className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full"
            >
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <div
                onMouseLeave={() => setMenuOpen(false)}
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border"
              >
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onInvite(room);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center"
                >
                  <UserPlus size={16} className="mr-2" /> Invite Member
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    onDelete(room._id, room.name);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center"
                >
                  <Trash2 size={16} className="mr-2" /> Delete Room
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- MAIN DASHBOARD PAGE ---

const DashboardPage = () => {
  const { user, logout, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();

  const [rooms, setRooms] = useState<RoomWithMembers[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [inviteModalRoom, setInviteModalRoom] = useState<RoomWithMembers | null>(null);
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState<{ id: string; name: string } | null>(null);

  const fetchRooms = useCallback(async () => {
    try {
      const response = await api.getRooms();
      setRooms(response.data as RoomWithMembers[]); // Cast the response data to the new type
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !user) {
      router.push('/');
    }
    if (user) {
      fetchRooms();
    }
  }, [user, isAuthLoading, router, fetchRooms]);

  const handleDeleteRequest = (roomId: string, roomName: string) => {
    setDeleteConfirmRoom({ id: roomId, name: roomName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmRoom) return;
    try {
      const roomToDeleteDetails = rooms.find(r => r._id === deleteConfirmRoom.id);
      if (roomToDeleteDetails) {
        await api.deleteRoom(roomToDeleteDetails.roomId);
        fetchRooms();
      }
    } catch (error) {
      console.error("Failed to delete room:", error);
      alert("You do not have permission to delete this room.");
    } finally {
      setDeleteConfirmRoom(null);
    }
  };

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#166EC1]" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Welcome,{' '}
                <span className="bg-gradient-to-r from-[#166EC1] to-[#145ca5] bg-clip-text text-transparent">
                  {user.username}!
                </span>
              </h1>
              <p className="text-gray-600">Your collaborative projects dashboard.</p>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Your Projects</h2>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="group bg-[#166EC1] hover:bg-[#145ca5] text-white px-5 py-2.5 rounded-lg font-semibold text-md transition-all duration-300 hover:scale-105 hover:shadow-lg flex items-center justify-center space-x-2"
            >
              <Plus size={20} />
              <span>New Project</span>
            </button>
          </div>

          {isLoadingRooms ? (
             <div className="text-center py-16"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[#166EC1]" /></div>
          ) : rooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map(room => (
                <RoomCard
                  key={room._id}
                  room={room}
                  currentUserId={user._id}
                  onInvite={setInviteModalRoom}
                  onDelete={handleDeleteRequest}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-6 border-2 border-dashed border-gray-300 rounded-lg">
              <h3 className="text-lg font-medium text-gray-900">No rooms yet!</h3>
              <p className="mt-1 text-sm text-gray-500">
                Get started by creating your first collaborative room.
              </p>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)}>
        <CreateRoomForm
          onClose={() => setCreateModalOpen(false)}
          onRoomCreated={fetchRooms}
        />
      </Modal>

      {inviteModalRoom && (
        <Modal isOpen={!!inviteModalRoom} onClose={() => setInviteModalRoom(null)}>
          <InviteMemberForm
            room={inviteModalRoom}
            onClose={() => setInviteModalRoom(null)}
            onMemberAdded={fetchRooms}
          />
        </Modal>
      )}

      {deleteConfirmRoom && (
        <Modal isOpen={!!deleteConfirmRoom} onClose={() => setDeleteConfirmRoom(null)}>
            <div className="text-center">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Confirm Deletion</h2>
                <p className="text-gray-600 mb-6">
                    Are you sure you want to permanently delete the room "{deleteConfirmRoom.name}"? This action cannot be undone.
                </p>
                <div className="flex justify-center gap-4">
                    <button onClick={() => setDeleteConfirmRoom(null)} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-800 font-semibold">
                        Cancel
                    </button>
                    <button onClick={handleDeleteConfirm} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold">
                        Delete
                    </button>
                </div>
            </div>
        </Modal>
      )}
    </>
  );
};

export default DashboardPage;