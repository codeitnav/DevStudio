import { Link } from 'react-router-dom'
import { Plus, Users, Lock, Globe } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'

// Mock data for demonstration
const mockRooms = [
  {
    id: '1',
    name: 'React Project',
    description: 'Working on the new dashboard',
    isPublic: true,
    currentMembers: 3,
    maxMembers: 10,
    language: 'typescript',
    lastActivity: '2 hours ago'
  },
  {
    id: '2',
    name: 'API Development',
    description: 'Building REST endpoints',
    isPublic: false,
    currentMembers: 2,
    maxMembers: 5,
    language: 'javascript',
    lastActivity: '1 day ago'
  }
]

export function Rooms() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Rooms</h1>
          <p className="text-gray-600">
            Manage your collaborative coding sessions
          </p>
        </div>
        <div className="flex space-x-3">
          <Link to="/rooms/create">
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Room
            </Button>
          </Link>
          <Link to="/rooms/join">
            <Button variant="outline">
              <Users className="h-4 w-4 mr-2" />
              Join Room
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockRooms.map((room) => (
          <Card key={room.id} className="p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-semibold text-gray-900">
                    {room.name}
                  </h3>
                  {room.isPublic ? (
                    <Globe className="h-4 w-4 text-green-500" />
                  ) : (
                    <Lock className="h-4 w-4 text-gray-500" />
                  )}
                </div>
                <p className="text-gray-600 text-sm mb-3">
                  {room.description}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
              <div className="flex items-center space-x-4">
                <span className="flex items-center">
                  <Users className="h-4 w-4 mr-1" />
                  {room.currentMembers}/{room.maxMembers}
                </span>
                <span className="capitalize">{room.language}</span>
              </div>
              <span>{room.lastActivity}</span>
            </div>

            <div className="flex space-x-2">
              <Link to={`/room/${room.id}`} className="flex-1">
                <Button className="w-full" size="sm">
                  Join Room
                </Button>
              </Link>
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {mockRooms.length === 0 && (
        <Card className="p-12">
          <div className="text-center">
            <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No rooms yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create your first room to start collaborating with others
            </p>
            <Link to="/rooms/create">
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Room
              </Button>
            </Link>
          </div>
        </Card>
      )}
    </div>
  )
}