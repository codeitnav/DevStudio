import { useState, useEffect } from 'react' // Added useEffect
import { useParams } from 'react-router-dom'
import {
  Users,
  Settings,
  FileText,
  Code,
  Eye,
  EyeOff,
} from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { useAuth } from '../contexts/AuthContext'
import { socketService } from '@/services/socketService'
import { TypingIndicators } from '../components/editor/TypingIndicators'
import { useCollaborativeEditor } from '../hooks/useCollaborativeEditor'
import { useUserPresence } from '../hooks/useUserPresence'
import { useResponsive } from '../hooks/useResponsive'

// Type definitions for better TypeScript support
interface UserData {
  userId: string
  username: string
  color: string
}

// Define CursorPosition to match what TypingIndicators expects
interface CursorPosition {
  position: number
  line: number
  column: number
}

interface CollaboratorData extends UserData {
  isTyping: boolean
  cursor?: CursorPosition | null // Changed to match expected type
}

interface TypingStatusData {
  userId: string
  isTyping: boolean
}

type MobileView = 'editor' | 'files' | 'users'

export function Room() {
  const { roomId } = useParams<{ roomId: string }>()
  const { user, token } = useAuth()
  const { isMobile } = useResponsive()
  const [mobileView, setMobileView] = useState<MobileView>('editor')
  const [showSidePanels, setShowSidePanels] = useState(!isMobile)
  const [connectionStatus, setConnectionStatus] = useState('disconnected')
  const [collaborators, setCollaborators] = useState(new Map<string, CollaboratorData>())

  // Define user variables from auth
  const currentUserId = user?.id || ''
  const currentUsername = user?.username || 'Anonymous'

  useEffect(() => {
    if (!user || !token || !roomId) return

    // Connect to socket with authentication token
    socketService.connect(token)

    // Setup event listeners with proper typing
    const handleConnectionStatus = (status: string) => {
      setConnectionStatus(status)
    }

    const handleRoomJoined = (data: any) => {
      console.log('Successfully joined room:', data)
    }

    const handleUserJoined = (userData: UserData) => {
      setCollaborators(prev => new Map(prev).set(userData.userId, {
        userId: userData.userId,
        username: userData.username,
        color: userData.color,
        isTyping: false,
        cursor: null
      }))
    }

    const handleUserLeft = (userData: UserData) => {
      setCollaborators(prev => {
        const newMap = new Map(prev)
        newMap.delete(userData.userId)
        return newMap
      })
    }

    const handleTypingStatus = (data: TypingStatusData) => {
      setCollaborators(prev => {
        const newMap = new Map(prev)
        const user = newMap.get(data.userId)
        if (user) {
          newMap.set(data.userId, { ...user, isTyping: data.isTyping })
        }
        return newMap
      })
    }

    // Add event listeners
    socketService.on('connection:status', handleConnectionStatus)
    socketService.on('room:joined', handleRoomJoined)
    socketService.on('user:joined', handleUserJoined)
    socketService.on('user:left', handleUserLeft)
    socketService.on('typing:status', handleTypingStatus)

    // Join room when socket connects
    if (socketService.isConnected()) {
      socketService.joinRoom(roomId)
    } else {
      const handleConnect = () => {
        socketService.joinRoom(roomId)
      }
      socketService.on('connect', handleConnect)
    }

    // Cleanup on unmount
    return () => {
      if (roomId) {
        socketService.leaveRoom(roomId)
      }
      socketService.off('connection:status', handleConnectionStatus)
      socketService.off('room:joined', handleRoomJoined)
      socketService.off('user:joined', handleUserJoined)
      socketService.off('user:left', handleUserLeft)
      socketService.off('typing:status', handleTypingStatus)
    }
  }, [user, token, roomId])

  // Show loading/error states
  if (!user) {
    return <div className="flex h-full items-center justify-center">Please log in to access this room</div>
  }

  if (!roomId) {
    return <div className="flex h-full items-center justify-center">Invalid room ID</div>
  }

  // Use collaborative editor hook for typing indicators
  const { collaborators: editorCollaborators } = useCollaborativeEditor({
    roomId: roomId || '',
    currentUserId,
    currentUsername,
    editor: null, 
  })

  const { activities, activeUsers } = useUserPresence({
    roomId: roomId || '',
    userId: currentUserId,
    username: currentUsername,
  })

  const normalizedEditorCollaborators = new Map(
    Array.from(editorCollaborators.entries()).map(([id, user]) => {
      const normalized: CollaboratorData = {
        userId: user.userId,
        username: user.username,
        color: user.color,
        isTyping: user.isTyping ?? false,
        cursor: user.cursor
          ? {
              position: (user.cursor as any).position ?? 0, // fallback if missing
              line: user.cursor.line,
              column: user.cursor.column,
            }
          : null, 
      }
      return [id, normalized]
    })
  )

  const allCollaborators = new Map([...collaborators, ...normalizedEditorCollaborators])

  const renderMobileNavigation = () => (
    <div className="flex border-b border-gray-200 bg-white px-2">
      <Button
        variant={mobileView === 'files' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setMobileView('files')}
        className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
      >
        <FileText className="mr-1 h-4 w-4" />
        Files
      </Button>
      <Button
        variant={mobileView === 'editor' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setMobileView('editor')}
        className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
      >
        <Code className="mr-1 h-4 w-4" />
        Editor
      </Button>
      <Button
        variant={mobileView === 'users' ? 'primary' : 'ghost'}
        size="sm"
        onClick={() => setMobileView('users')}
        className="flex-1 rounded-none border-b-2 border-transparent data-[state=active]:border-blue-500"
      >
        <Users className="mr-1 h-4 w-4" />
        Users ({activeUsers.length})
      </Button>
    </div>
  )

  const renderFileExplorer = () => (
    <Card className="h-full">
      <div className="border-b border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Files</h2>
          <Button variant="ghost" size="sm" className="p-2">
            <FileText className="h-4 w-4" />
          </Button>
        </div>
      </div>
      <div className="space-y-2 overflow-y-auto p-3 sm:p-4">
        <div className="cursor-pointer touch-manipulation rounded p-2 text-sm text-gray-600 hover:bg-gray-50">
          📁 src/
        </div>
        <div className="ml-4 cursor-pointer touch-manipulation rounded p-2 text-sm text-gray-600 hover:bg-gray-50">
          📄 index.ts
        </div>
        <div className="ml-4 cursor-pointer touch-manipulation rounded p-2 text-sm text-gray-600 hover:bg-gray-50">
          📄 App.tsx
        </div>
        <div className="cursor-pointer touch-manipulation rounded p-2 text-sm text-gray-600 hover:bg-gray-50">
          📄 README.md
        </div>
      </div>
    </Card>
  )

  const renderCodeEditor = () => (
    <Card className="h-full">
      <div className="border-b border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Editor</h2>
          <div className="flex items-center space-x-2">
            {!isMobile && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowSidePanels(!showSidePanels)}
                className="p-2"
                title={showSidePanels ? 'Hide panels' : 'Show panels'}
              >
                {showSidePanels ? (
                  <EyeOff className="h-4 w-4" />
                ) : (
                  <Eye className="h-4 w-4" />
                )}
              </Button>
            )}
            <select className="rounded border border-gray-300 bg-white px-2 py-1 text-sm">
              <option>TypeScript</option>
              <option>JavaScript</option>
              <option>Python</option>
            </select>
          </div>
        </div>
      </div>
      <div className="flex-1 p-3 sm:p-4">
        <div className="h-full min-h-[300px] overflow-auto rounded bg-gray-900 p-4 font-mono text-sm text-green-400 sm:min-h-[400px]">
          <div className="text-gray-500">
            // Monaco Editor will be integrated here
            // Connection Status: {connectionStatus}
          </div>
          <div className="mt-2">
            <span className="text-blue-400">function</span>{' '}
            <span className="text-yellow-400">hello</span>() {'{'}
          </div>
          <div className="ml-4">
            <span className="text-blue-400">console</span>.
            <span className="text-yellow-400">log</span>
            <span className="text-white">(</span>
            <span className="text-green-400">'Hello, DevStudio!'</span>
            <span className="text-white">)</span>
          </div>
          <div>{'}'}</div>
        </div>
      </div>
    </Card>
  )

  const renderUserPresence = () => (
    <Card className="h-full">
      <div className="border-b border-gray-200 p-3 sm:p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Active Users</h2>
          <span className="text-sm text-gray-600">
            {allCollaborators.size} online
          </span>
        </div>
      </div>
      <div className="space-y-3 overflow-y-auto p-3 sm:p-4">
        {Array.from(allCollaborators.values()).map((collaborator) => {
          const activity = activities.get(collaborator.userId)
          const isTyping = collaborator.isTyping
          const isActive = activity?.isActive ?? true
          const isFocused = activity?.isFocused ?? true

          return (
            <div key={collaborator.userId} className="flex items-center space-x-3">
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: collaborator.color }}
              >
                {collaborator.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gray-900">
                  {collaborator.username}
                </div>
                <div className="text-xs">
                  {isTyping ? (
                    <span className="text-green-600">● Typing...</span>
                  ) : isActive ? (
                    <span className="text-gray-500">
                      ● {isFocused ? 'Online' : 'Away'}
                    </span>
                  ) : (
                    <span className="text-gray-400">● Idle</span>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Show message if no collaborators */}
        {allCollaborators.size === 0 && (
          <div className="py-4 text-center text-sm text-gray-500">
            No other users in this room
          </div>
        )}

        {/* Typing Indicators - Fixed type compatibility */}
        <div className="border-t pt-3">
          <TypingIndicators 
            collaborators={allCollaborators as Map<string, any>} 
          />
        </div>
      </div>
    </Card>
  )

  return (
    <div className="flex h-full flex-col">
      {/* Room Header */}
      <div className="mb-3 flex-shrink-0 rounded-lg border border-gray-200 bg-white p-3 sm:mb-4 sm:p-4">
        <div className="flex items-center justify-between">
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-lg font-semibold text-gray-900 sm:text-xl">
              Room: {roomId}
            </h1>
            <p className="hidden text-sm text-gray-600 sm:block">
              Collaborative coding session • {connectionStatus}
            </p>
          </div>
          <div className="ml-4 flex items-center space-x-2 sm:space-x-3">
            <div className="hidden items-center space-x-2 text-sm text-gray-600 sm:flex">
              <Users className="h-4 w-4" />
              <span>{allCollaborators.size + 1} members</span>
            </div>
            <Button variant="outline" size="sm" className="p-2 sm:px-3">
              <Settings className="h-4 w-4" />
              <span className="ml-2 hidden sm:inline">Settings</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobile && renderMobileNavigation()}

      {/* Main Content Area */}
      <div className="min-h-0 flex-1">
        {isMobile ? (
          // Mobile: Single view with tabs
          <div className="h-full">
            {mobileView === 'files' && renderFileExplorer()}
            {mobileView === 'editor' && renderCodeEditor()}
            {mobileView === 'users' && renderUserPresence()}
          </div>
        ) : (
          // Desktop/Tablet: Grid layout
          <div
            className={`grid h-full gap-3 transition-all duration-200 sm:gap-4 ${
              showSidePanels ? 'grid-cols-1 lg:grid-cols-4' : 'grid-cols-1'
            }`}
          >
            {/* File Explorer */}
            {showSidePanels && (
              <div className="lg:col-span-1">{renderFileExplorer()}</div>
            )}

            {/* Code Editor */}
            <div className={showSidePanels ? 'lg:col-span-2' : 'col-span-1'}>
              {renderCodeEditor()}
            </div>

            {/* User Presence */}
            {showSidePanels && (
              <div className="lg:col-span-1">{renderUserPresence()}</div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
