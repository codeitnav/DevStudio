"use client"

import type React from "react"
import { useState, useEffect, useCallback, type FC } from "react"
import { useRouter } from "next/navigation"
import { useAuth } from "@/context/AuthContext"
import * as api from "@/lib/services/api"
import { Plus, LogOut, Trash2, MoreVertical, Loader2, Crown, X, UserPlus, Users, Home } from "lucide-react"

type RoomWithPopulatedMembers = Omit<api.Room, "owner" | "members"> & {
  owner: api.User | string
  members: (api.User | string)[]
}

const Modal: FC<{ isOpen: boolean; onClose: () => void; children: React.ReactNode; size?: "md" | "lg" }> = ({
  isOpen,
  onClose,
  children,
  size = "md",
}) => {
  if (!isOpen) return null
  const widthClass = size === "lg" ? "max-w-2xl" : "max-w-md"
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center" onClick={onClose}>
      <div
        className={`bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6 w-full ${widthClass} relative border border-gray-200 dark:border-gray-700`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 z-10"
        >
          <X size={24} />
        </button>
        {children}
      </div>
    </div>
  )
}

const CreateRoomForm: FC<{ onClose: () => void }> = ({ onClose }) => {
  const [projectName, setProjectName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!projectName.trim()) {
      setError("Project name cannot be empty.")
      return
    }
    setIsLoading(true)
    setError("")
    try {
      const response = await api.createRoom(projectName)
      onClose()
      router.push(`/playground/${response.data.roomId}`)
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create project.")
      setIsLoading(false)
    }
  }

  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">New Project</h2>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          placeholder="Enter project name..."
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg mb-4 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-[#166EC1]"
          disabled={isLoading}
          autoFocus
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-[#166EC1] to-blue-600 hover:from-[#145ca5] hover:to-blue-700 text-white px-8 py-3 rounded-lg font-semibold flex items-center justify-center transition-all duration-300"
          disabled={isLoading}
        >
          {isLoading ? <Loader2 className="animate-spin" /> : "Create and Go"}
        </button>
      </form>
    </div>
  )
}

const RoomCard: FC<{
  room: RoomWithPopulatedMembers
  currentUserId: string
  onInvite: (room: RoomWithPopulatedMembers) => void
  onDelete: (roomId: string, roomName: string, isOwner: boolean) => void
}> = ({ room, currentUserId, onInvite, onDelete }) => {
  const router = useRouter()
  const [menuOpen, setMenuOpen] = useState(false)
  const isOwner = (typeof room.owner === "string" ? room.owner : room.owner._id) === currentUserId

  return (
    <div
      onClick={() => router.push(`/playground/${room.roomId}`)}
      className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 group cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex justify-between items-start">
        <div className="flex flex-col gap-2">
          <h3 className="text-xl font-bold text-gray-900 dark:text-white">{room.name}</h3>
          {isOwner ? (
            <span className="flex items-center text-xs font-semibold text-amber-600 dark:text-amber-400 bg-amber-100 dark:bg-amber-900/30 px-3 py-1 rounded-full w-fit">
              <Crown size={12} className="mr-1" /> Owner
            </span>
          ) : (
            <span className="flex items-center text-xs font-semibold text-[#166EC1] bg-blue-100 dark:bg-blue-900/30 px-3 py-1 rounded-full w-fit">
              <Users size={12} className="mr-1" /> Member
            </span>
          )}
        </div>

        <div className="relative">
          <button
            onClick={(e) => {
              e.stopPropagation()
              setMenuOpen(!menuOpen)
            }}
            className="p-2 text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 rounded-full transition-colors"
          >
            <MoreVertical size={18} />
          </button>
          {menuOpen && (
            <div
              onMouseLeave={() => setMenuOpen(false)}
              className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg z-10 border border-gray-200 dark:border-gray-700"
            >
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  onDelete(room.roomId, room.name, isOwner)
                  setMenuOpen(false)
                }}
                className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center transition-colors"
              >
                <Trash2 size={16} className="mr-2" /> Delete Room
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const FunnyLoader: React.FC<{ size?: "lg" | "sm" }> = ({ size = "lg" }) => {
  return (
    <div className="flex flex-col items-center justify-center text-center">
      <div className={`relative ${size === "lg" ? "w-24 h-24" : "w-12 h-12"}`}>
        <span
          className={`absolute left-0 font-bold text-blue-500 animate-bounce ${size === "lg" ? "text-6xl" : "text-3xl"}`}
          style={{ animationDelay: "0s", animationDuration: "1.5s" }}
        >
          {"{"}
        </span>
        <span
          className={`absolute right-0 font-bold text-blue-500 animate-bounce ${size === "lg" ? "text-6xl" : "text-3xl"}`}
          style={{ animationDelay: "0.2s", animationDuration: "1.5s" }}
        >
          {"}"}
        </span>
        <span
          className={`absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 font-bold text-gray-500 dark:text-gray-400 animate-spin ${
            size === "lg" ? "text-3xl" : "text-xl"
          }`}
          style={{ animationDuration: "2s" }}
        >
          /
        </span>
      </div>
      {size === "lg" && (
        <>
          <p className="mt-6 text-lg font-semibold text-gray-700 dark:text-gray-300">
            Compiling your dashboard...
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">(Don't worry, no syntax errors this time!)</p>
        </>
      )}
    </div>
  )
}

const DashboardPage = () => {
  const { user, logout, isLoading: isAuthLoading } = useAuth()
  const router = useRouter()

  const [rooms, setRooms] = useState<RoomWithPopulatedMembers[]>([])
  const [isLoadingRooms, setIsLoadingRooms] = useState(true)
  const [isCreateModalOpen, setCreateModalOpen] = useState(false)
  const [inviteModalRoom, setInviteModalRoom] = useState<RoomWithPopulatedMembers | null>(null)
  const [deleteConfirmRoom, setDeleteConfirmRoom] = useState<{ id: string; name: string } | null>(null)
  const [showOwnerOnlyModal, setShowOwnerOnlyModal] = useState(false)

  const fetchRooms = useCallback(async () => {
    setIsLoadingRooms(true)
    try {
      const response = await api.getRooms()
      setRooms(response.data as RoomWithPopulatedMembers[])
    } catch (error) {
      console.error("Failed to fetch rooms:", error)
    } finally {
      setIsLoadingRooms(false)
    }
  }, [])

  useEffect(() => {
    if (!isAuthLoading && !user) router.push("/")
    if (user) fetchRooms()
  }, [user, isAuthLoading, router, fetchRooms])

  const handleDeleteRequest = (roomId: string, roomName: string, isOwner: boolean) => {
    if (!isOwner) {
      setShowOwnerOnlyModal(true)
      return
    }
    setDeleteConfirmRoom({ id: roomId, name: roomName })
  }

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmRoom) return
    try {
      await api.deleteRoom(deleteConfirmRoom.id)
      fetchRooms()
    } catch (error) {
      console.error("Failed to delete room:", error)
      alert("You do not have permission to delete this room.")
    } finally {
      setDeleteConfirmRoom(null)
    }
  }

  if (isAuthLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <FunnyLoader size="lg" />
      </div>
    )
  }

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5 flex justify-between items-center">
            <div className="flex items-center gap-4">
              <button
                onClick={() => router.push("/")}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                title="Go to home"
              >
                <Home size={20} />
              </button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Welcome, <span className="text-[#166EC1]">{user.username}</span>
                {user.isGuest && (
                  <span className="text-sm font-normal text-gray-500 dark:text-gray-400 ml-2">(Guest)</span>
                )}
              </h1>
            </div>
            <button
              onClick={logout}
              className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <LogOut size={20} /> Logout
            </button>
          </div>
        </header>

        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex justify-between items-center mb-8">
            <h2 className="text-3xl font-semibold text-gray-900 dark:text-white">Your Projects</h2>
            <button
              onClick={() => setCreateModalOpen(true)}
              className="group bg-gradient-to-r from-[#166EC1] to-blue-600 hover:from-[#145ca5] hover:to-blue-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2 transition-all duration-300 hover:shadow-lg"
            >
              <Plus size={20} /> <span>New Project</span>
            </button>
          </div>

          {isLoadingRooms ? (
            <div className="text-center py-20">
              <FunnyLoader size="sm" />
            </div>
          ) : rooms.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {rooms.map((room) => (
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
            <div className="text-center py-20 px-6 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl bg-gray-50 dark:bg-gray-800/50">
              <h3 className="text-lg font-medium text-gray-900 dark:text-white">No projects yet!</h3>
              <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">Get started by creating a new project.</p>
            </div>
          )}
        </main>
      </div>

      <Modal isOpen={isCreateModalOpen} onClose={() => setCreateModalOpen(false)}>
        <CreateRoomForm onClose={() => setCreateModalOpen(false)} />
      </Modal>

      {deleteConfirmRoom && (
        <Modal isOpen={!!deleteConfirmRoom} onClose={() => setDeleteConfirmRoom(null)}>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Confirm Deletion</h2>
            <p className="text-gray-600 dark:text-gray-400 my-4">
              Delete the project "{deleteConfirmRoom.name}"? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setDeleteConfirmRoom(null)}
                className="px-6 py-2 rounded-lg bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 font-semibold text-gray-900 dark:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="px-6 py-2 rounded-lg bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800 text-white font-semibold transition-all duration-300"
              >
                Delete
              </button>
            </div>
          </div>
        </Modal>
      )}

      <Modal isOpen={showOwnerOnlyModal} onClose={() => setShowOwnerOnlyModal(false)}>
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Permission Denied</h2>
          <p className="text-gray-600 dark:text-gray-400 my-4">
            Only the project owner can delete this room.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={() => setShowOwnerOnlyModal(false)}
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-[#166EC1] to-blue-600 hover:from-[#145ca5] hover:to-blue-700 text-white font-semibold transition-all duration-300"
            >
              OK
            </button>
          </div>
        </div>
      </Modal>
    </>
  )
}

export default DashboardPage