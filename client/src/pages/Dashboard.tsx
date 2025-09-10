"use client"

import type React from "react"
import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuthStore } from "../store/authStore"
import type { Room } from "../types"
import { roomService } from "../services/roomService"
import { userService } from "../services/userService"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import LoadingSpinner from "../components/ui/LoadingSpinner"
import { Plus, Code, Users, Calendar, Settings, LogOut, Search, Filter } from "lucide-react"
import toast from "react-hot-toast"

const Dashboard: React.FC = () => {
  const [rooms, setRooms] = useState<Room[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [createLoading, setCreateLoading] = useState(false)
  const [newRoom, setNewRoom] = useState({
    name: "",
    description: "",
    isPublic: false,
  })

  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  useEffect(() => {
    fetchRooms()
  }, [])

  const fetchRooms = async () => {
    try {
      const response = await userService.getUserRooms()
      setRooms(response.data || [])
    } catch (error) {
      toast.error("Failed to fetch rooms")
      setRooms([]) 
    } finally {
      setLoading(false)
    }
  }

  const handleCreateRoom = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newRoom.name.trim()) return

    setCreateLoading(true)
    try {
      const response = await roomService.createRoom({
        roomName: newRoom.name,
        description: newRoom.description,
        isPrivate: !newRoom.isPublic,
      })
      const room = response.room
      setRooms((prev) => [room, ...prev])
      setShowCreateModal(false)
      setNewRoom({ name: "", description: "", isPublic: false })
      toast.success("Room created successfully!")
      navigate(`/editor/${room.roomId}`)
    } catch (error: any) {
      toast.error(error.response?.data?.error || "Failed to create room")
    } finally {
      setCreateLoading(false)
    }
  }

  const handleJoinRoom = (roomId: string) => {
    navigate(`/editor/${roomId}`)
  }

  const filteredRooms = rooms.filter(
    (room) =>
      room.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      room.description?.toLowerCase().includes(searchTerm.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <Code className="h-8 w-8 text-primary-600" />
              <h1 className="text-xl font-bold text-gray-900">DevStudio</h1>
            </div>

            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-700">Welcome, {user?.name}</span>
              <Button variant="ghost" size="sm" icon={Settings} onClick={() => {}}>
                Settings
              </Button>
              <Button variant="ghost" size="sm" icon={LogOut} onClick={logout}>
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Your Workspaces</h2>
            <p className="text-gray-600">Collaborate on code in real-time</p>
          </div>

          <Button icon={Plus} onClick={() => setShowCreateModal(true)}>
            Create Room
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search rooms..."
              className="pl-10 input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <Button variant="outline" icon={Filter}>
            Filter
          </Button>
        </div>

        {/* Rooms Grid */}
        {filteredRooms.length === 0 ? (
          <div className="text-center py-12">
            <Code className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No rooms found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm ? "Try adjusting your search terms." : "Get started by creating a new room."}
            </p>
            {!searchTerm && (
              <div className="mt-6">
                <Button onClick={() => setShowCreateModal(true)}>Create your first room</Button>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredRooms.map((room) => (
              <div
                key={room._id}
                className="bg-white rounded-lg shadow-sm border hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleJoinRoom(room._id)}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-2">{room.name}</h3>
                      {room.description && <p className="text-sm text-gray-600 mb-4">{room.description}</p>}
                    </div>
                    {room.isPublic && (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Public
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center">
                        <Users className="h-4 w-4 mr-1" />
                        {room.collaborators.length + 1}
                      </div>
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-1" />
                        {new Date(room.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Room Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Create New Room</h3>

            <form onSubmit={handleCreateRoom} className="space-y-4">
              <Input
                label="Room Name"
                value={newRoom.name}
                onChange={(e) => setNewRoom((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="Enter room name"
                required
              />

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
                <textarea
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  rows={3}
                  value={newRoom.description}
                  onChange={(e) => setNewRoom((prev) => ({ ...prev, description: e.target.value }))}
                  placeholder="Describe your room..."
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="isPublic"
                  checked={newRoom.isPublic}
                  onChange={(e) => setNewRoom((prev) => ({ ...prev, isPublic: e.target.checked }))}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                />
                <label htmlFor="isPublic" className="ml-2 block text-sm text-gray-900">
                  Make room public
                </label>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <Button type="button" variant="secondary" onClick={() => setShowCreateModal(false)}>
                  Cancel
                </Button>
                <Button type="submit" loading={createLoading}>
                  Create Room
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard
