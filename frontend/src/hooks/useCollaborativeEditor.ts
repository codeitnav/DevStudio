import { useState, useEffect, useCallback, useRef } from 'react';
import * as monaco from 'monaco-editor';
import { socketService } from '../services/socketService';
import { useUserPresence } from './useUserPresence';
import type { CollaborativeUser, CursorPosition, TextSelection } from '../types/editor';
import { generateUserColor } from '../components/editor/UserSelections';

export interface UseCollaborativeEditorOptions {
  roomId: string;
  currentUserId: string;
  currentUsername: string;
  editor: monaco.editor.IStandaloneCodeEditor | null;
  typingDebounceMs?: number;
}

export interface UseCollaborativeEditorReturn {
  collaborators: Map<string, CollaborativeUser>;
  typingUsers: string[];
  sendCursorUpdate: (position: CursorPosition) => void;
  sendSelectionUpdate: (selection: TextSelection | null) => void;
  sendTypingStatus: (isTyping: boolean) => void;
}

export function useCollaborativeEditor({
  roomId,
  currentUserId,
  currentUsername,
  editor,
  typingDebounceMs = 2000,
}: UseCollaborativeEditorOptions): UseCollaborativeEditorReturn {
  const [collaborators, setCollaborators] = useState<Map<string, CollaborativeUser>>(new Map());
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastCursorPositionRef = useRef<CursorPosition | null>(null);
  const lastSelectionRef = useRef<TextSelection | null>(null);
  const isTypingRef = useRef<boolean>(false);

  // Use user presence hook for enhanced awareness
  const {
    activities,
    typingUsers: presenceTypingUsers,
    sendTypingStatus: sendPresenceTypingStatus,
  } = useUserPresence({
    roomId,
    userId: currentUserId,
    username: currentUsername,
  });

  // Get typing user IDs
  const typingUsers = presenceTypingUsers.map(user => user.userId);

  // Send cursor position update
  const sendCursorUpdate = useCallback((position: CursorPosition) => {
    if (!roomId || !socketService.isConnected()) return;

    // Avoid sending duplicate cursor positions
    const lastPosition = lastCursorPositionRef.current;
    if (lastPosition && 
        lastPosition.line === position.line && 
        lastPosition.column === position.column) {
      return;
    }

    lastCursorPositionRef.current = position;
    socketService.sendCursorUpdate(roomId, position);
  }, [roomId]);

  // Send selection update
  const sendSelectionUpdate = useCallback((selection: TextSelection | null) => {
    if (!roomId || !socketService.isConnected()) return;

    // Avoid sending duplicate selections
    const lastSelection = lastSelectionRef.current;
    if (selection && lastSelection &&
        lastSelection.startLine === selection.startLine &&
        lastSelection.startColumn === selection.startColumn &&
        lastSelection.endLine === selection.endLine &&
        lastSelection.endColumn === selection.endColumn) {
      return;
    }

    lastSelectionRef.current = selection;
    
    // Send selection update via socket (we'll need to add this to socket service)
    socketService.emit('selection:update', { roomId, selection });
  }, [roomId]);

  // Send typing status with enhanced debouncing
  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (!roomId || !socketService.isConnected()) return;

    if (isTyping) {
      // Only send if not already typing to reduce network traffic
      if (!isTypingRef.current) {
        isTypingRef.current = true;
        socketService.sendTypingStatus(roomId, true);
        sendPresenceTypingStatus(true);
      }
      
      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      
      // Set timeout to stop typing status
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        socketService.sendTypingStatus(roomId, false);
        sendPresenceTypingStatus(false);
      }, typingDebounceMs);
    } else {
      // Clear timeout and send stop typing immediately
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      
      if (isTypingRef.current) {
        isTypingRef.current = false;
        socketService.sendTypingStatus(roomId, false);
        sendPresenceTypingStatus(false);
      }
    }
  }, [roomId, typingDebounceMs, sendPresenceTypingStatus]);

  // Handle cursor position updates from other users
  useEffect(() => {
    const handleCursorUpdate = (data: { 
      roomId: string; 
      userId: string; 
      username: string;
      position: CursorPosition;
    }) => {
      if (data.roomId !== roomId || data.userId === currentUserId) return;

      setCollaborators(prev => {
        const updated = new Map(prev);
        const existing = updated.get(data.userId);
        
        updated.set(data.userId, {
          userId: data.userId,
          username: data.username,
          cursor: data.position,
          selection: existing?.selection,
          color: existing?.color || generateUserColor(data.userId),
          isTyping: existing?.isTyping || false,
        });
        
        return updated;
      });
    };

    socketService.on('cursor:update', handleCursorUpdate);
    return () => socketService.off('cursor:update', handleCursorUpdate);
  }, [roomId, currentUserId]);

  // Handle selection updates from other users
  useEffect(() => {
    const handleSelectionUpdate = (data: {
      roomId: string;
      userId: string;
      username: string;
      selection: TextSelection | null;
    }) => {
      if (data.roomId !== roomId || data.userId === currentUserId) return;

      setCollaborators(prev => {
        const updated = new Map(prev);
        const existing = updated.get(data.userId);
        
        updated.set(data.userId, {
          userId: data.userId,
          username: data.username,
          cursor: existing?.cursor || { line: 1, column: 1 },
          selection: existing?.selection,
          color: existing?.color || generateUserColor(data.userId),
          isTyping: existing?.isTyping || false,
        });
        
        return updated;
      });
    };

    socketService.on('selection:update', handleSelectionUpdate);
    return () => socketService.off('selection:update', handleSelectionUpdate);
  }, [roomId, currentUserId]);

  // Sync collaborators with user presence activities
  useEffect(() => {
    setCollaborators(prev => {
      const updated = new Map(prev);
      
      // Update collaborators with presence data
      activities.forEach((activity, userId) => {
        if (userId === currentUserId) return;
        
        const existing = updated.get(userId);
        updated.set(userId, {
          userId: activity.userId,
          username: activity.username,
          cursor: existing?.cursor || { line: 1, column: 1 },
          selection: existing?.selection || undefined,
          color: existing?.color || generateUserColor(userId),
          isTyping: activity.isTyping,
        });
      });
      
      // Remove users who are no longer in activities
      Array.from(updated.keys()).forEach(userId => {
        if (userId !== currentUserId && !activities.has(userId)) {
          updated.delete(userId);
        }
      });
      
      return updated;
    });
  }, [activities, currentUserId]);

  // Handle typing status updates from socket (fallback)
  useEffect(() => {
    const handleTypingStatus = (data: {
      roomId: string;
      userId: string;
      username: string;
      isTyping: boolean;
    }) => {
      if (data.roomId !== roomId || data.userId === currentUserId) return;

      setCollaborators(prev => {
        const updated = new Map(prev);
        const existing = updated.get(data.userId);
        
        if (existing) {
          updated.set(data.userId, {
            ...existing,
            isTyping: data.isTyping,
          });
        } else {
          updated.set(data.userId, {
            userId: data.userId,
            username: data.username,
            cursor: { line: 1, column: 1 },
            selection: undefined,
            color: generateUserColor(data.userId),
            isTyping: data.isTyping,
          });
        }
        
        return updated;
      });
    };

    socketService.on('typing:status', handleTypingStatus);
    return () => socketService.off('typing:status', handleTypingStatus);
  }, [roomId, currentUserId]);

  // Handle user join/leave events
  useEffect(() => {
    const handleUserJoined = (data: { roomId: string; userId: string; username: string }) => {
      if (data.roomId !== roomId || data.userId === currentUserId) return;

      setCollaborators(prev => {
        const updated = new Map(prev);
        updated.set(data.userId, {
          userId: data.userId,
          username: data.username,
          cursor: { line: 1, column: 1 },
          selection: undefined,
          color: generateUserColor(data.userId),
          isTyping: false,
        });
        return updated;
      });
    };

    const handleUserLeft = (data: { roomId: string; userId: string }) => {
      if (data.roomId !== roomId) return;

      setCollaborators(prev => {
        const updated = new Map(prev);
        updated.delete(data.userId);
        return updated;
      });
    };

    socketService.on('room:user-joined', handleUserJoined);
    socketService.on('room:user-left', handleUserLeft);

    return () => {
      socketService.off('room:user-joined', handleUserJoined);
      socketService.off('room:user-left', handleUserLeft);
    };
  }, [roomId, currentUserId]);

  // Set up editor event listeners for cursor and selection changes
  useEffect(() => {
    if (!editor) return;

    // Handle cursor position changes
    const cursorDisposable = editor.onDidChangeCursorPosition((e) => {
      const position = e.position;
      sendCursorUpdate({
        line: position.lineNumber,
        column: position.column,
      });
    });

    // Handle selection changes
    const selectionDisposable = editor.onDidChangeCursorSelection((e) => {
      const selection = e.selection;
      
      if (selection.isEmpty()) {
        sendSelectionUpdate(null);
      } else {
        sendSelectionUpdate({
          startLine: selection.startLineNumber,
          startColumn: selection.startColumn,
          endLine: selection.endLineNumber,
          endColumn: selection.endColumn,
        });
      }
    });

    // Handle content changes for typing status
    const contentDisposable = editor.onDidChangeModelContent(() => {
      sendTypingStatus(true);
    });

    return () => {
      cursorDisposable.dispose();
      selectionDisposable.dispose();
      contentDisposable.dispose();
    };
  }, [editor, sendCursorUpdate, sendSelectionUpdate, sendTypingStatus]);

  // Cleanup typing timeout on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return {
    collaborators,
    typingUsers,
    sendCursorUpdate,
    sendSelectionUpdate,
    sendTypingStatus,
  };
}