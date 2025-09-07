import { useEffect, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';
import type { CursorPosition } from '../types';

interface UseSocketRoomOptions {
  roomId: string;
  password?: string;
  autoJoin?: boolean;
}

interface UseSocketRoomReturn {
  joinRoom: (password?: string) => void;
  leaveRoom: () => void;
  sendCursorUpdate: (position: CursorPosition) => void;
  sendCodeChange: (code: string, delta: any) => void;
  sendLanguageChange: (language: string) => void;
  sendTypingStatus: (isTyping: boolean) => void;
  sendYjsUpdate: (update: Uint8Array) => void;
  isInRoom: boolean;
}

/**
 * Hook for managing room-specific socket operations
 */
export function useSocketRoom(options: UseSocketRoomOptions): UseSocketRoomReturn {
  const { roomId, password, autoJoin = false } = options;
  const hasJoinedRef = useRef(false);
  const currentRoomIdRef = useRef<string | null>(null);

  // Join room function
  const joinRoom = useCallback((joinPassword?: string) => {
    if (!socketService.isConnected()) {
      console.warn('Cannot join room: Socket not connected');
      return;
    }

    const roomPassword = joinPassword || password;
    socketService.joinRoom(roomId, roomPassword);
    hasJoinedRef.current = true;
    currentRoomIdRef.current = roomId;
  }, [roomId, password]);

  // Leave room function
  const leaveRoom = useCallback(() => {
    if (currentRoomIdRef.current) {
      socketService.leaveRoom(currentRoomIdRef.current);
      hasJoinedRef.current = false;
      currentRoomIdRef.current = null;
    }
  }, []);

  // Send cursor update
  const sendCursorUpdate = useCallback((position: CursorPosition) => {
    if (currentRoomIdRef.current) {
      socketService.sendCursorUpdate(currentRoomIdRef.current, position);
    }
  }, []);

  // Send code change
  const sendCodeChange = useCallback((code: string, delta: any) => {
    if (currentRoomIdRef.current) {
      socketService.sendCodeChange(currentRoomIdRef.current, code, delta);
    }
  }, []);

  // Send language change
  const sendLanguageChange = useCallback((language: string) => {
    if (currentRoomIdRef.current) {
      socketService.sendLanguageChange(currentRoomIdRef.current, language);
    }
  }, []);

  // Send typing status
  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (currentRoomIdRef.current) {
      socketService.sendTypingStatus(currentRoomIdRef.current, isTyping);
    }
  }, []);

  // Send Yjs update
  const sendYjsUpdate = useCallback((update: Uint8Array) => {
    if (currentRoomIdRef.current) {
      socketService.sendYjsUpdate(currentRoomIdRef.current, update);
    }
  }, []);

  // Auto-join room when socket connects
  useEffect(() => {
    const handleConnect = () => {
      if (autoJoin && !hasJoinedRef.current) {
        joinRoom();
      }
    };

    socketService.on('connect', handleConnect);

    // Join immediately if already connected
    if (autoJoin && socketService.isConnected() && !hasJoinedRef.current) {
      joinRoom();
    }

    return () => {
      socketService.off('connect', handleConnect);
    };
  }, [autoJoin, joinRoom]);

  // Leave room on unmount or room change
  useEffect(() => {
    return () => {
      if (hasJoinedRef.current) {
        leaveRoom();
      }
    };
  }, [leaveRoom]);

  // Update current room when roomId changes
  useEffect(() => {
    // Leave previous room if we were in one
    if (hasJoinedRef.current && currentRoomIdRef.current !== roomId) {
      leaveRoom();
    }

    // Join new room if auto-join is enabled and socket is connected
    if (autoJoin && socketService.isConnected() && roomId) {
      joinRoom();
    }
  }, [roomId, autoJoin, joinRoom, leaveRoom]);

  return {
    joinRoom,
    leaveRoom,
    sendCursorUpdate,
    sendCodeChange,
    sendLanguageChange,
    sendTypingStatus,
    sendYjsUpdate,
    isInRoom: hasJoinedRef.current && currentRoomIdRef.current === roomId,
  };
}

export default useSocketRoom;