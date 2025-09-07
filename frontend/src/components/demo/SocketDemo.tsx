import { useEffect, useState } from 'react';
import { useSocket, useSocketRoom } from '../../hooks';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import type { ConnectionStatus } from '../../types';

interface SocketDemoProps {
  roomId?: string;
}

export function SocketDemo({ roomId = 'demo-room' }: SocketDemoProps) {
  const [messages, setMessages] = useState<string[]>([]);
  const [cursorPosition, setCursorPosition] = useState({ line: 1, column: 1 });

  const {
    isConnected,
    connectionStatus,
    error,
    connect,
    disconnect,
    reconnectAttempts,
  } = useSocket();

  const {
    joinRoom,
    leaveRoom,
    sendCursorUpdate,
    sendCodeChange,
    sendLanguageChange,
    sendTypingStatus,
    isInRoom,
  } = useSocketRoom({ roomId, autoJoin: false });

  const addMessage = (message: string) => {
    setMessages(prev => [...prev.slice(-9), `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  useEffect(() => {
    addMessage(`Connection status: ${connectionStatus}`);
  }, [connectionStatus]);

  useEffect(() => {
    if (error) {
      addMessage(`Error: ${error.message}`);
    }
  }, [error]);

  const handleConnect = () => {
    connect();
    addMessage('Connecting to socket server...');
  };

  const handleDisconnect = () => {
    disconnect();
    addMessage('Disconnecting from socket server...');
  };

  const handleJoinRoom = () => {
    joinRoom();
    addMessage(`Joining room: ${roomId}`);
  };

  const handleLeaveRoom = () => {
    leaveRoom();
    addMessage(`Leaving room: ${roomId}`);
  };

  const handleSendCursor = () => {
    sendCursorUpdate(cursorPosition);
    addMessage(`Sent cursor position: line ${cursorPosition.line}, column ${cursorPosition.column}`);
  };

  const handleSendCode = () => {
    const code = 'console.log("Hello from socket demo!");';
    sendCodeChange(code, { ops: [{ insert: code }] });
    addMessage('Sent code change');
  };

  const handleSendLanguage = () => {
    sendLanguageChange('typescript');
    addMessage('Changed language to TypeScript');
  };

  const handleSendTyping = () => {
    sendTypingStatus(true);
    addMessage('Sent typing status: true');
    setTimeout(() => {
      sendTypingStatus(false);
      addMessage('Sent typing status: false');
    }, 2000);
  };

  const getStatusColor = (status: ConnectionStatus): string => {
    switch (status) {
      case 'connected':
        return 'text-green-600';
      case 'connecting':
      case 'reconnecting':
        return 'text-yellow-600';
      case 'disconnected':
        return 'text-gray-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Socket.io Service Demo</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Connection Status */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Connection Status</h2>
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="font-medium">Status:</span>
              <span className={`font-mono ${getStatusColor(connectionStatus)}`}>
                {connectionStatus}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Connected:</span>
              <span className={isConnected ? 'text-green-600' : 'text-red-600'}>
                {isConnected ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">Reconnect Attempts:</span>
              <span className="font-mono">{reconnectAttempts}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-medium">In Room:</span>
              <span className={isInRoom ? 'text-green-600' : 'text-red-600'}>
                {isInRoom ? 'Yes' : 'No'}
              </span>
            </div>
          </div>
        </Card>

        {/* Connection Controls */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Connection Controls</h2>
          <div className="space-y-2">
            <Button
              onClick={handleConnect}
              disabled={isConnected}
              className="w-full"
            >
              Connect
            </Button>
            <Button
              onClick={handleDisconnect}
              disabled={!isConnected}
              variant="outline"
              className="w-full"
            >
              Disconnect
            </Button>
          </div>
        </Card>

        {/* Room Controls */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Room Controls</h2>
          <div className="space-y-2">
            <div className="text-sm text-gray-600 mb-2">Room ID: {roomId}</div>
            <Button
              onClick={handleJoinRoom}
              disabled={!isConnected || isInRoom}
              className="w-full"
            >
              Join Room
            </Button>
            <Button
              onClick={handleLeaveRoom}
              disabled={!isInRoom}
              variant="outline"
              className="w-full"
            >
              Leave Room
            </Button>
          </div>
        </Card>

        {/* Collaboration Controls */}
        <Card className="p-4">
          <h2 className="text-lg font-semibold mb-4">Collaboration Controls</h2>
          <div className="space-y-2">
            <div className="flex gap-2 mb-2">
              <input
                type="number"
                value={cursorPosition.line}
                onChange={(e) => setCursorPosition(prev => ({ ...prev, line: parseInt(e.target.value) || 1 }))}
                className="w-20 px-2 py-1 border rounded text-sm"
                placeholder="Line"
                min="1"
              />
              <input
                type="number"
                value={cursorPosition.column}
                onChange={(e) => setCursorPosition(prev => ({ ...prev, column: parseInt(e.target.value) || 1 }))}
                className="w-20 px-2 py-1 border rounded text-sm"
                placeholder="Col"
                min="1"
              />
            </div>
            <Button
              onClick={handleSendCursor}
              disabled={!isInRoom}
              size="sm"
              className="w-full"
            >
              Send Cursor
            </Button>
            <Button
              onClick={handleSendCode}
              disabled={!isInRoom}
              size="sm"
              className="w-full"
            >
              Send Code Change
            </Button>
            <Button
              onClick={handleSendLanguage}
              disabled={!isInRoom}
              size="sm"
              className="w-full"
            >
              Change Language
            </Button>
            <Button
              onClick={handleSendTyping}
              disabled={!isInRoom}
              size="sm"
              className="w-full"
            >
              Send Typing Status
            </Button>
          </div>
        </Card>
      </div>

      {/* Messages Log */}
      <Card className="p-4 mt-6">
        <h2 className="text-lg font-semibold mb-4">Activity Log</h2>
        <div className="bg-gray-50 p-3 rounded-md h-48 overflow-y-auto">
          {messages.length === 0 ? (
            <div className="text-gray-500 text-sm">No activity yet...</div>
          ) : (
            <div className="space-y-1">
              {messages.map((message, index) => (
                <div key={index} className="text-sm font-mono">
                  {message}
                </div>
              ))}
            </div>
          )}
        </div>
        <Button
          onClick={() => setMessages([])}
          size="sm"
          variant="outline"
          className="mt-2"
        >
          Clear Log
        </Button>
      </Card>

      {/* Error Display */}
      {error && (
        <Card className="p-4 mt-6 border-red-200 bg-red-50">
          <h2 className="text-lg font-semibold mb-2 text-red-800">Error</h2>
          <div className="text-sm">
            <div><strong>Type:</strong> {error.type}</div>
            <div><strong>Message:</strong> {error.message}</div>
            {error.code && <div><strong>Code:</strong> {error.code}</div>}
            {error.details && (
              <div><strong>Details:</strong> {JSON.stringify(error.details, null, 2)}</div>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}

export default SocketDemo;