'use client';

import React, { useState, useEffect, useCallback, FC } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import * as api from '@/lib/services/api';
import Avatar from 'boring-avatars';
import { Plus, LogOut, Trash2, MoreVertical, Loader2, Crown, X, UserPlus } from 'lucide-react';

// --- TYPE DEFINITIONS ---
// This type helps manage the populated members data on the frontend
type RoomWithPopulatedMembers = Omit<api.Room, 'owner' | 'members'> & {
  owner: api.User | string;
  members: (api.User | string)[];
};


// --- SUB-COMPONENTS ---

const Modal: FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode }> = ({
  isOpen, onClose, children,
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
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600">
          <X size={24} />
        </button>
        {children}
      </div>
    </div>
  );
};

// Reusable Create Room Form Component
const CreateRoomForm: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [projectName, setProjectName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError('Project name cannot be empty.');
      return;
    }
    setIsLoading(true);
    setError('');
    try {
      const response = await api.createRoom(projectName);
      onClose();
      router.push(`/playground/${response.data.roomId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project.');
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">New Project</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={projectName}
          onChange={e => setProjectName(e.target.value)}
          placeholder="Enter project name..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
          disabled={isLoading} autoFocus
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full bg-[#166EC1] hover:bg-[#145ca5] text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : 'Create and Go'}
        </button>
      </form>
    </div>
  );
};

const InviteMemberForm: FC<{ room: RoomWithPopulatedMembers; onClose: () => void; onMemberAdded: () => void }> = ({ room, onClose, onMemberAdded }) => {
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
      // Use the human-readable roomId for the API call
      await api.addMember(room.roomId, userId);
      onMemberAdded();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to add member.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-2">Invite to "{room.name}"</h2>
      <p className="text-sm text-gray-500 mb-4">Enter the User ID of the person to invite.</p>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={userId} onChange={e => setUserId(e.target.value)}
          placeholder="Enter User ID..."
          className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4"
          disabled={isLoading}
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full bg-[#166EC1] hover:bg-[#145ca5] text-white py-3 rounded-lg font-semibold flex items-center justify-center"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : 'Send Invite'}
        </button>
      </form>
    </div>
  );
};


const RoomCard: FC<{
  room: RoomWithPopulatedMembers;
  currentUserId: string;
  onInvite: (room: RoomWithPopulatedMembers) => void;
  onDelete: (roomId: string, roomName: string) => void; // Now passes roomId
}> = ({ room, currentUserId, onInvite, onDelete }) => {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const isOwner = (typeof room.owner === 'string' ? room.owner : room.owner._id) === currentUserId;

  return (
    <div
      onClick={() => router.push(`/playground/${room.roomId}`)}
      className="bg-white rounded-lg shadow-md p-6 group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1"
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="text-xl font-bold text-gray-800 mb-2">{room.name}</h3>
          {isOwner && (
            <span className="flex items-center text-xs font-semibold text-amber-600 bg-amber-100 px-2 py-1 rounded-full">
              <Crown size={12} className="mr-1" /> Owner
            </span>
          )}
        </div>
        {isOwner && (
          <div className="relative">
            <button onClick={e => { e.stopPropagation(); setMenuOpen(!menuOpen); }}
              className="p-2 text-gray-400 hover:text-gray-700 rounded-full">
              <MoreVertical size={18} />
            </button>
            {menuOpen && (
              <div onMouseLeave={() => setMenuOpen(false)}
                className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-10 border">
                <button
                  onClick={e => { e.stopPropagation(); onInvite(room); setMenuOpen(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center">
                  <UserPlus size={16} className="mr-2" /> Invite Member
                </button>
                <button
                  onClick={e => {
                    e.stopPropagation();
                    // CRITICAL: Pass the human-readable `roomId` to the delete handler
                    onDelete(room.roomId, room.name);
                    setMenuOpen(false);
                  }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 flex items-center">
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

  const [rooms, setRooms] = useState<RoomWithPopulatedMembers[]>([]);
  const [isLoadingRooms, setIsLoadingRooms] = useState(true);
  const [isCreateModalOpen, setCreateModalOpen] = useState(false);
  const [inviteModalRoom, setInviteModalRoom] = useState<RoomWithPopulatedMembers | null>(null);
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState<{ id: string; name: string } | null>(null);

  const fetchRooms = useCallback(async () => {
    setIsLoadingRooms(true);
    try {
      const response = await api.getRooms();
      // Even if backend doesn't populate, this casting allows frontend components to work
      setRooms(response.data as RoomWithPopulatedMembers[]);
    } catch (error) {
      console.error('Failed to fetch rooms:', error);
    } finally {
      setIsLoadingRooms(false);
    }
  }, []);

  useEffect(() => {
    if (!isAuthLoading && !user) router.push('/');
    if (user) fetchRooms();
  }, [user, isAuthLoading, router, fetchRooms]);

  const handleDeleteRequest = (roomId: string, roomName: string) => {
    setDeleteConfirmRoom({ id: roomId, name: roomName });
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmRoom) return;
    try {
      // CRITICAL CHANGE: Use the `id` from state which is now the correct human-readable `roomId`
      await api.deleteRoom(deleteConfirmRoom.id);
      fetchRooms(); // Refresh the list
    } catch (error) {
      console.error("Failed to delete room:", error);
      alert("You do not have permission to delete this room.");
    } finally {
      setDeleteConfirmRoom(null);
    }
  };

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-[#166EC1]" />
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen bg-gray-50">
        <header className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Welcome, <span className="text-[#166EC1]">{user.username}</span>
              {user.isGuest && <span className="text-sm font-normal text-gray-500 ml-2">(Guest)</span>}
            </h1>
            <button onClick={logout} className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
              <LogOut size={20} /> Logout
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-800">Your Projects</h2>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="group bg-[#166EC1] hover:bg-[#145ca5] text-white px-5 py-2.5 rounded-lg font-semibold flex items-center space-x-2">
              <Plus size={20} /> <span>New Project</span>
            </button>
          </div>

          {isLoadingRooms ? (
             <div className="text-center py-16"><Loader2 className="w-8 h-8 mx-auto animate-spin text-[#166EC1]" /></div>
          ) : rooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map(room => (
                <RoomCard
                  key={room._id} room={room} currentUserId={user._id}
                  onInvite={setInviteModalRoom} onDelete={handleDeleteRequest}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-16 px-6 border-2 border-dashed rounded-lg">
              <h3 className="text-lg font-medium">No projects yet!</h3>
              <p className="mt-1 text-sm text-gray-500">Get started by creating a new project.</p>
            </div>
          )}
        </main>
      </div>

      {/* Modals */}
      <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)}>
        <CreateRoomForm onClose={() => setCreateModalOpen(false)} />
      </Modal>

      {inviteModalRoom && (
        <Modal isOpen={!!inviteModalRoom} onClose={() => setInviteModalRoom(null)}>
          <InviteMemberForm room={inviteModalRoom} onClose={() => setInviteModalRoom(null)} onMemberAdded={fetchRooms} />
        </Modal>
      )}

      {deleteConfirmRoom && (
        <Modal isOpen={!!deleteConfirmRoom} onClose={() => setDeleteConfirmRoom(null)}>
            <div className="text-center">
                <h2 className="text-2xl font-bold">Confirm Deletion</h2>
                <p className="text-gray-600 my-4">Delete the project "{deleteConfirmRoom.name}"? This action cannot be undone.</p>
                <div className="flex justify-center gap-4">
                    <button onClick={() => setDeleteConfirmRoom(null)} className="px-6 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 font-semibold">Cancel</button>
                    <button onClick={handleDeleteConfirm} className="px-6 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold">Delete</button>
                </div>
            </div>
        </Modal>
      )}
    </>
  );
};

export default DashboardPage;