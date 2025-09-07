import React, { useState, useEffect } from 'react';
import { CodeEditor } from '../editor/CodeEditor';
import { TypingIndicators } from '../editor/TypingIndicators';
import { socketService } from '../../services/socketService';
import { useCollaborativeEditor } from '../../hooks/useCollaborativeEditor';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const CollaborativeEditorDemo: React.FC = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [roomId] = useState('demo-room-123');
  const [currentUserId] = useState(`user-${Math.random().toString(36).substring(2, 9)}`);
  const [currentUsername] = useState(`User${Math.floor(Math.random() * 1000)}`);
  const [code, setCode] = useState(`// Collaborative Code Editor Demo
// Multiple users can edit this code simultaneously
// You'll see their cursors and selections in real-time

function fibonacci(n) {
  if (n <= 1) return n;
  return fibonacci(n - 1) + fibonacci(n - 2);
}

console.log('Fibonacci sequence:');
for (let i = 0; i < 10; i++) {
  console.log(\`F(\${i}) = \${fibonacci(i)}\`);
}

// Try editing this code with multiple browser tabs open!
`);

  // Use collaborative editor hook for enhanced typing indicators
  const { collaborators, typingUsers } = useCollaborativeEditor({
    roomId,
    currentUserId,
    currentUsername,
    editor: null, // Would be set to Monaco editor instance in real usage
    typingDebounceMs: 1500, // Faster debounce for demo
  });

  useEffect(() => {
    // Set up connection status listener
    const handleConnectionStatus = (status: string) => {
      setIsConnected(status === 'connected');
    };

    socketService.on('connection:status', handleConnectionStatus);
    setIsConnected(socketService.isConnected());

    return () => {
      socketService.off('connection:status', handleConnectionStatus);
    };
  }, []);

  const handleConnect = () => {
    if (!isConnected) {
      socketService.connect();
    }
  };

  const handleJoinRoom = () => {
    if (isConnected && roomId) {
      socketService.joinRoom(roomId);
    }
  };

  const handleLeaveRoom = () => {
    if (isConnected && roomId) {
      socketService.leaveRoom(roomId);
    }
  };

  const handleDisconnect = () => {
    socketService.disconnect();
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <Card className="mb-6">
        <div className="p-4">
          <h2 className="text-2xl font-bold mb-4">Collaborative Editor Demo</h2>
          <p className="text-gray-600 mb-4">
            This demo showcases real-time collaborative editing with cursor positions, 
            text selections, and typing indicators.
          </p>
          
          <div className="flex flex-wrap gap-4 items-center mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Status:</span>
              <span className={`px-2 py-1 rounded text-xs font-medium ${
                isConnected 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-red-100 text-red-800'
              }`}>
                {isConnected ? 'Connected' : 'Disconnected'}
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">User:</span>
              <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs font-medium">
                {currentUsername} ({currentUserId.slice(-6)})
              </span>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Room:</span>
              <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                {roomId}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {!isConnected ? (
              <Button onClick={handleConnect} variant="primary">
                Connect to Server
              </Button>
            ) : (
              <>
                <Button onClick={handleJoinRoom} variant="primary">
                  Join Room
                </Button>
                <Button onClick={handleLeaveRoom} variant="secondary">
                  Leave Room
                </Button>
                <Button onClick={handleDisconnect} variant="secondary">
                  Disconnect
                </Button>
              </>
            )}
          </div>

          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
            <p className="text-sm text-yellow-800">
              <strong>To test collaboration:</strong> Open this page in multiple browser tabs 
              or windows, connect to the server, and join the same room. You'll see real-time 
              cursor positions, text selections, and typing indicators from other users.
            </p>
          </div>
        </div>
      </Card>

      <Card>
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Code Editor</h3>
          <div className="border border-gray-200 rounded overflow-hidden">
            <div className="h-96">
              <CodeEditor
                value={code}
                onChange={(newCode) => setCode(newCode || '')}
                language="javascript"
                enableCollaboration={isConnected}
                roomId={roomId}
                currentUserId={currentUserId}
                currentUsername={currentUsername}
                height="100%"
              />
            </div>
            
            {/* Typing Indicators */}
            <TypingIndicators 
              collaborators={collaborators}
              className="border-t"
            />
          </div>
          
          {/* Collaboration Status */}
          {isConnected && (
            <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded">
              <div className="flex items-center justify-between">
                <div className="text-sm text-blue-800">
                  <strong>Active Collaborators:</strong> {collaborators.size}
                </div>
                {typingUsers.length > 0 && (
                  <div className="text-sm text-green-700">
                    {typingUsers.length} user{typingUsers.length !== 1 ? 's' : ''} typing
                  </div>
                )}
              </div>
              
              {collaborators.size > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {Array.from(collaborators.values()).map((user) => (
                    <div
                      key={user.userId}
                      className="flex items-center space-x-2 px-2 py-1 bg-white rounded border"
                    >
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: user.color }}
                      />
                      <span className="text-xs font-medium">{user.username}</span>
                      {user.isTyping && (
                        <span className="text-xs text-green-600">typing...</span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Card>

      <Card className="mt-6">
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-4">Features Demonstrated</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-700 mb-2">✅ Implemented</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Real-time cursor position sharing</li>
                <li>• Text selection indicators</li>
                <li>• Typing status indicators</li>
                <li>• User color assignment</li>
                <li>• Smooth cursor animations</li>
                <li>• User identification labels</li>
                <li>• Socket.io real-time communication</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-700 mb-2">🔧 Technical Details</h4>
              <ul className="text-sm space-y-1 text-gray-600">
                <li>• Monaco Editor integration</li>
                <li>• Custom React hooks for collaboration</li>
                <li>• Debounced typing indicators</li>
                <li>• CSS animations for smooth UX</li>
                <li>• TypeScript type safety</li>
                <li>• Event-driven architecture</li>
                <li>• Automatic cleanup on disconnect</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};