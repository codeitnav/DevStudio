import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, Users, Clock, Search, Grid, List } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Input } from '../components/ui/Input'
import { RoomCard, CreateRoomModal, JoinRoomModal } from '../components/room'
import { useAuth } from '../contexts/AuthContext'
import { useResponsive } from '../hooks/useResponsive'
import { roomService } from '../services'
import type { Room, CreateRoomData } from '../types/room'

export function Dashboard() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { isMobile, isTablet } = useResponsive()
  
  const [myRooms, setMyRooms] = useState<Room[]>([])
  const [publicRooms, setPublicRooms] = useState<Room[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<Room[]>([])
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')

  useEffect(() => {
    loadRooms()
  }, [])

  useEffect(() => {
    if (searchQuery.trim()) {
      searchRooms()
    } else {
      setSearchResults([])
    }
  }, [searchQuery])

  const loadRooms = async () => {
    try {
      setIsLoading(true)
      const [userRooms, publicRoomsData] = await Promise.all([
        roomService.getUserRooms(),
        roomService.getPublicRooms(10)
      ])
      setMyRooms(userRooms)
      setPublicRooms(publicRoomsData)
    } catch (error) {
      console.error('Failed to load rooms:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const searchRooms = async () => {
    try {
      const results = await roomService.searchRooms(searchQuery.trim())
      setSearchResults(results)
    } catch (error) {
      console.error('Failed to search rooms:', error)
      setSearchResults([])
    }
  }

  const handleCreateRoom = async (roomData: CreateRoomData) => {
    try {
      setIsCreating(true)
      const newRoom = await roomService.createRoom(roomData)
      navigate(`/room/${newRoom.id}`)
    } catch (error) {
      console.error('Failed to create room:', error)
      throw error
    } finally {
      setIsCreating(false)
    }
  }

  const handleJoinRoom = async (roomId: string, password?: string) => {
    try {
      setIsJoining(true)
      await roomService.joinRoom(roomId, password)
      navigate(`/room/${roomId}`)
    } catch (error) {
      console.error('Failed to join room:', error)
      throw error
    } finally {
      setIsJoining(false)
    }
  }

  const handleRoomJoin = (roomId: string) => {
    navigate(`/room/${roomId}`)
  }

  const displayedRooms = searchQuery.trim() ? searchResults : publicRooms

  const getGridCols = () => {
    if (isMobile) return 'grid-cols-1'
    if (isTablet) return 'grid-cols-2'
    return 'grid-cols-3'
  }

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Welcome back, {user?.username || "Guest"}!
          </h1>
          <p className="text-sm sm:text-base text-gray-600">
            Start collaborating on code with your team
          </p>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3">
          <Button 
            onClick={() => setIsCreateModalOpen(true)}
            size={isMobile ? 'sm' : 'md'}
            className="w-full sm:w-auto"
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Room
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setIsJoinModalOpen(true)}
            size={isMobile ? 'sm' : 'md'}
            className="w-full sm:w-auto"
          >
            <Users className="h-4 w-4 mr-2" />
            Join Room
          </Button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`grid ${getGridCols()} gap-4 sm:gap-6`}>
        <Card className="p-4 sm:p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Plus className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Create Room</h3>
              <p className="text-sm text-gray-600 truncate">Start a new collaborative session</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <Button 
              className="w-full" 
              onClick={() => setIsCreateModalOpen(true)}
              size={isMobile ? 'sm' : 'md'}
            >
              Get Started
            </Button>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Users className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Join Room</h3>
              <p className="text-sm text-gray-600 truncate">Join an existing coding session</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <Button 
              variant="outline" 
              className="w-full" 
              onClick={() => setIsJoinModalOpen(true)}
              size={isMobile ? 'sm' : 'md'}
            >
              Join Now
            </Button>
          </div>
        </Card>

        <Card className="p-4 sm:p-6">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">My Rooms</h3>
              <p className="text-sm text-gray-600 truncate">View your created rooms</p>
            </div>
          </div>
          <div className="mt-3 sm:mt-4">
            <p className="text-xl sm:text-2xl font-bold text-purple-600">{myRooms.length}</p>
          </div>
        </Card>
      </div>

      {/* My Rooms */}
      {myRooms.length > 0 && (
        <div>
          <h2 className="text-lg sm:text-xl font-semibold text-gray-900 mb-3 sm:mb-4">My Rooms</h2>
          <div className={`grid ${getGridCols()} gap-3 sm:gap-4`}>
            {myRooms.map((room) => (
              <RoomCard
                key={room.id}
                room={room}
                onJoin={handleRoomJoin}
                showSettings={true}
                onSettings={(roomId) => navigate(`/room/${roomId}/settings`)}
              />
            ))}
          </div>
        </div>
      )}

      {/* Search and Public Rooms */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 mb-3 sm:mb-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
              {searchQuery.trim() ? 'Search Results' : 'Public Rooms'}
            </h2>
            {!isMobile && (
              <div className="flex items-center space-x-2 ml-4">
                <Button
                  variant={viewMode === 'grid' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('grid')}
                  className="p-2"
                >
                  <Grid className="h-4 w-4" />
                </Button>
                <Button
                  variant={viewMode === 'list' ? 'primary' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('list')}
                  className="p-2"
                >
                  <List className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search rooms..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        {isLoading ? (
          <div className={`grid ${getGridCols()} gap-3 sm:gap-4`}>
            {[...Array(isMobile ? 3 : 6)].map((_, i) => (
              <Card key={i} className="p-3 sm:p-4 animate-pulse">
                <div className="h-4 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 bg-gray-200 rounded mb-4"></div>
                <div className="h-8 bg-gray-200 rounded"></div>
              </Card>
            ))}
          </div>
        ) : displayedRooms.length > 0 ? (
          viewMode === 'grid' || isMobile ? (
            <div className={`grid ${getGridCols()} gap-3 sm:gap-4`}>
              {displayedRooms.map((room) => (
                <RoomCard
                  key={room.id}
                  room={room}
                  onJoin={handleRoomJoin}
                />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {displayedRooms.map((room) => (
                <Card key={room.id} className="p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h3 className="font-medium text-gray-900 truncate">{room.name}</h3>
                      <div className="flex items-center space-x-4 mt-1">
                        <div className="flex items-center text-sm text-gray-500">
                          <Users className="h-4 w-4 mr-1" />
                          {room.currentMembers}/{room.maxMembers} members
                        </div>
                        <div className="flex items-center text-sm text-gray-500">
                          <Clock className="h-4 w-4 mr-1" />
                          {new Date(room.lastActivity).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="ml-4"
                      onClick={() => handleRoomJoin(room.id)}
                    >
                      Join
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          )
        ) : (
          <Card className="p-6">
            <div className="text-center py-8">
              {searchQuery.trim() ? (
                <>
                  <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No rooms found for "{searchQuery}"</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Try a different search term or create a new room
                  </p>
                </>
              ) : (
                <>
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No public rooms available</p>
                  <p className="text-sm text-gray-400 mt-1">
                    Create a room to start collaborating
                  </p>
                </>
              )}
            </div>
          </Card>
        )}
      </div>

      {/* Modals */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onSubmit={handleCreateRoom}
        isLoading={isCreating}
      />

      <JoinRoomModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onSubmit={handleJoinRoom}
        isLoading={isJoining}
      />
    </div>
  )
}