# Collaborative Editor Components

This directory contains the collaborative editing components that enable real-time collaboration features in the Monaco code editor.

## Components

### CollaborativeCursors

Displays real-time cursor positions of other users in the editor.

**Features:**
- Real-time cursor position updates
- Unique colors for each user
- User identification labels on hover
- Smooth cursor animations
- Typing indicators
- Automatic cleanup on user disconnect

**Usage:**
```tsx
<CollaborativeCursors
  editor={editorInstance}
  collaborators={collaboratorsMap}
  currentUserId="current-user-id"
/>
```

### UserSelections

Shows text selections made by other users in the editor.

**Features:**
- Real-time selection highlighting
- Color-coded selections per user
- Smooth selection animations
- Transparent overlays
- Automatic cleanup

**Usage:**
```tsx
<UserSelections
  editor={editorInstance}
  collaborators={collaboratorsMap}
  currentUserId="current-user-id"
/>
```

### CodeEditor (Enhanced)

The main code editor component now supports collaborative editing features.

**New Props:**
- `enableCollaboration`: Enable/disable collaborative features
- `roomId`: Room identifier for collaboration
- `currentUserId`: Current user's unique identifier
- `currentUsername`: Current user's display name

**Usage:**
```tsx
<CodeEditor
  value={code}
  onChange={handleCodeChange}
  language="javascript"
  enableCollaboration={true}
  roomId="room-123"
  currentUserId="user-456"
  currentUsername="John Doe"
/>
```

## Hooks

### useCollaborativeEditor

A custom hook that manages collaborative editing state and real-time communication.

**Features:**
- Cursor position tracking and broadcasting
- Text selection sharing
- Typing status indicators with debouncing
- User presence management
- Socket.io integration
- Automatic event cleanup

**Usage:**
```tsx
const {
  collaborators,
  sendCursorUpdate,
  sendSelectionUpdate,
  sendTypingStatus,
} = useCollaborativeEditor({
  roomId: 'room-123',
  currentUserId: 'user-456',
  currentUsername: 'John Doe',
  editor: editorInstance,
});
```

## Real-time Events

The collaborative editor handles the following Socket.io events:

### Outgoing Events
- `cursor:update` - Send cursor position changes
- `selection:update` - Send text selection changes
- `typing:status` - Send typing status updates

### Incoming Events
- `cursor:update` - Receive cursor position from other users
- `selection:update` - Receive text selection from other users
- `typing:status` - Receive typing status from other users
- `room:user-joined` - Handle new user joining
- `room:user-left` - Handle user leaving

## Color System

Users are automatically assigned unique colors from a predefined palette:

```typescript
const colors = [
  '#FF6B6B', // Red
  '#4ECDC4', // Teal
  '#45B7D1', // Blue
  '#96CEB4', // Green
  '#FFEAA7', // Yellow
  '#DDA0DD', // Plum
  // ... more colors
];
```

Colors are consistently assigned based on user ID hash to ensure the same user always gets the same color.

## Performance Optimizations

- **Debounced Updates**: Typing status is debounced to reduce network traffic
- **Duplicate Prevention**: Cursor and selection updates are deduplicated
- **Efficient Rendering**: Components only re-render when necessary
- **Memory Management**: Automatic cleanup of DOM elements and event listeners

## Testing

The collaborative components include comprehensive tests:

- Unit tests for individual components
- Integration tests for the complete editor
- Mock implementations for Socket.io
- Performance and memory leak tests

Run tests with:
```bash
npm test src/components/editor/__tests__/
```

## Browser Compatibility

The collaborative features work in all modern browsers that support:
- WebSockets (for Socket.io)
- ES6 Maps and Sets
- CSS animations and transforms
- Monaco Editor requirements

## Troubleshooting

### Common Issues

1. **Cursors not appearing**: Check that Socket.io is connected and users are in the same room
2. **Performance issues**: Ensure debouncing is working and check network traffic
3. **Memory leaks**: Verify that event listeners are properly cleaned up on unmount
4. **Color conflicts**: Check that user IDs are unique and consistent

### Debug Mode

Enable debug logging by setting:
```javascript
localStorage.setItem('collaborative-editor-debug', 'true');
```

This will log all collaborative events to the browser console.