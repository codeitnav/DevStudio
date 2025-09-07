import { useState } from 'react'
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
import { TypingIndicators } from '../components/editor/TypingIndicators'
import { useCollaborativeEditor } from '../hooks/useCollaborativeEditor'
import { useUserPresence } from '../hooks/useUserPresence'
import { useResponsive } from '../hooks/useResponsive'

type MobileView = 'editor' | 'files' | 'users'

export function Room() {
  const { roomId } = useParams<{ roomId: string }>()
  const { isMobile } = useResponsive()
  const [mobileView, setMobileView] = useState<MobileView>('editor')
  const [showSidePanels, setShowSidePanels] = useState(!isMobile)

  // Mock user data - in real app this would come from auth context
  const currentUserId = 'current-user-id'
  const currentUsername = 'Current User'

  // Use collaborative editor hook for typing indicators
  const { collaborators } = useCollaborativeEditor({
    roomId: roomId || '',
    currentUserId,
    currentUsername,
    editor: null, // Would be the Monaco editor instance
  })

  // Use user presence hook for enhanced awareness
  const { activities, activeUsers } = useUserPresence({
    roomId: roomId || '',
    userId: currentUserId,
    username: currentUsername,
  })

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
            {activeUsers.length} online
          </span>
        </div>
      </div>
      <div className="space-y-3 overflow-y-auto p-3 sm:p-4">
        {Array.from(collaborators.values()).map((user) => {
          const activity = activities.get(user.userId)
          const isTyping = user.isTyping
          const isActive = activity?.isActive ?? true
          const isFocused = activity?.isFocused ?? true

          return (
            <div key={user.userId} className="flex items-center space-x-3">
              <div
                className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: user.color }}
              >
                {user.username.charAt(0).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-gray-900">
                  {user.username}
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
        {collaborators.size === 0 && (
          <div className="py-4 text-center text-sm text-gray-500">
            No other users in this room
          </div>
        )}

        {/* Typing Indicators */}
        <div className="border-t pt-3">
          <TypingIndicators collaborators={collaborators} />
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
              Collaborative coding session
            </p>
          </div>
          <div className="ml-4 flex items-center space-x-2 sm:space-x-3">
            <div className="hidden items-center space-x-2 text-sm text-gray-600 sm:flex">
              <Users className="h-4 w-4" />
              <span>3 members</span>
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
