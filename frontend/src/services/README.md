# Socket Service Documentation

## Overview

The Socket Service provides real-time communication capabilities for the DevStudio frontend application. It manages WebSocket connections using Socket.io client and handles all real-time collaborative features including room management, collaborative editing, and user presence.

## Features

- **Connection Management**: Automatic connection, disconnection, and reconnection handling
- **Room Operations**: Join/leave rooms with password support
- **Collaborative Editing**: Real-time code synchronization using Yjs
- **User Presence**: Cursor positions, typing indicators, and user awareness
- **Error Handling**: Comprehensive error handling and recovery
- **Event System**: Flexible event listener system for custom functionality

## Architecture

### SocketService Class

The main `SocketService` class implements the `ISocketService` interface and provides:

- Singleton pattern for global socket management
- Connection status monitoring
- Automatic reconnection with exponential backoff
- Event listener management
- Room-specific operations
- Error handling and reporting

### React Hooks

#### useSocket Hook

Manages socket connection state and provides connection controls:

```typescript
const {
  isConnected,
  connectionStatus,
  error,
  connect,
  disconnect,
  reconnectAttempts,
} = useSocket({
  autoConnect: true,
  token: 'auth-token'
});
```

#### useSocketRoom Hook

Manages room-specific operations and collaborative features:

```typescript
const {
  joinRoom,
  leaveRoom,
  sendCursorUpdate,
  sendCodeChange,
  sendLanguageChange,
  sendTypingStatus,
  sendYjsUpdate,
  isInRoom,
} = useSocketRoom({
  roomId: 'room-123',
  password: 'optional-password',
  autoJoin: true
});
```

## Usage Examples

### Basic Connection

```typescript
import { socketService } from '../services/socketService';

// Connect with authentication token
socketService.connect('your-auth-token');

// Listen for connection events
socketService.on('connect', () => {
  console.log('Connected to server');
});

socketService.on('disconnect', (reason) => {
  console.log('Disconnected:', reason);
});
```

### Room Management

```typescript
// Join a room
socketService.joinRoom('room-123', 'optional-password');

// Listen for room events
socketService.on('room:joined', (data) => {
  console.log('Joined room:', data.roomId);
  console.log('Room members:', data.members);
});

socketService.on('room:user-joined', (data) => {
  console.log('User joined:', data.member.username);
});

// Leave a room
socketService.leaveRoom('room-123');
```

### Collaborative Editing

```typescript
// Send cursor position
socketService.sendCursorUpdate('room-123', {
  line: 10,
  column: 5
});

// Send code changes
socketService.sendCodeChange('room-123', 'console.log("hello");', {
  ops: [{ insert: 'hello' }]
});

// Send Yjs updates for CRDT synchronization
socketService.sendYjsUpdate('room-123', yjsUpdateArray);

// Listen for collaborative events
socketService.on('cursor:update', (data) => {
  console.log(`User ${data.userId} moved cursor to:`, data.position);
});

socketService.on('code:change', (data) => {
  console.log(`Code changed by ${data.userId}:`, data.code);
});
```

### Error Handling

```typescript
socketService.on('socket:error', (error) => {
  switch (error.type) {
    case 'connection':
      console.error('Connection error:', error.message);
      break;
    case 'room':
      console.error('Room error:', error.message);
      break;
    case 'authentication':
      console.error('Auth error:', error.message);
      break;
    case 'collaboration':
      console.error('Collaboration error:', error.message);
      break;
  }
});
```

### Using with React Components

```typescript
import React from 'react';
import { useSocket, useSocketRoom } from '../hooks';

function CollaborativeEditor({ roomId }: { roomId: string }) {
  const { isConnected, connect } = useSocket({ autoConnect: true });
  const { 
    joinRoom, 
    sendCursorUpdate, 
    isInRoom 
  } = useSocketRoom({ roomId, autoJoin: true });

  const handleCursorMove = (position: CursorPosition) => {
    if (isInRoom) {
      sendCursorUpdate(position);
    }
  };

  return (
    <div>
      <div>Status: {isConnected ? 'Connected' : 'Disconnected'}</div>
      <div>In Room: {isInRoom ? 'Yes' : 'No'}</div>
      {/* Your editor component */}
    </div>
  );
}
```

## Configuration

### Environment Variables

```env
VITE_SOCKET_URL=http://localhost:3001
```

### Connection Options

The socket service supports various configuration options:

```typescript
interface SocketConnectionOptions {
  token?: string;              // Authentication token
  autoConnect?: boolean;       // Auto-connect on initialization
  reconnection?: boolean;      // Enable reconnection
  reconnectionAttempts?: number; // Max reconnection attempts (default: 5)
  reconnectionDelay?: number;  // Reconnection delay in ms (default: 1000)
  timeout?: number;           // Connection timeout (default: 10000)
}
```

## Event Types

### Connection Events

- `connect`: Socket connected successfully
- `disconnect`: Socket disconnected
- `connect_error`: Connection failed
- `reconnect`: Successfully reconnected
- `reconnect_attempt`: Attempting to reconnect
- `reconnect_error`: Reconnection failed
- `reconnect_failed`: All reconnection attempts failed

### Room Events

- `room:joined`: Successfully joined a room
- `room:left`: Left a room
- `room:user-joined`: Another user joined the room
- `room:user-left`: Another user left the room
- `room:error`: Room operation error

### Collaborative Events

- `yjs:update`: Yjs document update received
- `cursor:update`: User cursor position changed
- `code:change`: Code content changed
- `language:change`: Programming language changed
- `typing:status`: User typing status changed

### Presence Events

- `presence:update`: User presence information updated

## Error Types

```typescript
interface SocketError {
  type: 'connection' | 'room' | 'authentication' | 'collaboration';
  message: string;
  code?: string;
  details?: any;
}
```

## Testing

The socket service includes comprehensive tests covering:

- Connection management
- Room operations
- Collaborative editing features
- Error handling
- Reconnection logic
- Event management

Run tests with:

```bash
npm test -- socketService
```

## Best Practices

1. **Connection Management**: Always check connection status before sending data
2. **Error Handling**: Implement proper error handling for all socket operations
3. **Memory Management**: Clean up event listeners when components unmount
4. **Reconnection**: Handle reconnection scenarios gracefully
5. **Rate Limiting**: Debounce rapid updates to prevent network flooding
6. **Authentication**: Always use authentication tokens for secure connections

## Troubleshooting

### Common Issues

1. **Connection Failures**: Check server URL and network connectivity
2. **Authentication Errors**: Verify token validity and format
3. **Room Access Denied**: Check room permissions and passwords
4. **Event Not Firing**: Ensure event listeners are registered before events occur
5. **Memory Leaks**: Always remove event listeners in cleanup functions

### Debug Mode

Enable debug logging by setting the environment variable:

```env
DEBUG=socket.io-client:*
```

## Integration with Backend

The socket service is designed to work with the DevStudio backend Socket.io server. Ensure the backend implements the following event handlers:

- Room management: `room:join`, `room:leave`
- Collaborative editing: `yjs:update`, `cursor:update`, `code:change`
- Language changes: `language:change`
- Typing indicators: `typing:status`
- Authentication: Token-based authentication

## Performance Considerations

- **Debouncing**: Rapid cursor movements and typing events are debounced
- **Batching**: Multiple updates can be batched for efficiency
- **Compression**: Large Yjs updates are compressed automatically
- **Connection Pooling**: Single connection shared across the application
- **Memory Usage**: Event listeners are managed efficiently to prevent leaks