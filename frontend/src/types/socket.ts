// Socket.io related type definitions

import type { CursorPosition } from './editor';
import type { RoomMember } from './room';

// Connection status
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'error';

// Socket event types
export interface SocketEvents {
  // Connection events
  connect: () => void;
  disconnect: (reason: string) => void;
  connect_error: (error: Error) => void;
  reconnect: (attemptNumber: number) => void;
  reconnect_attempt: (attemptNumber: number) => void;
  reconnect_error: (error: Error) => void;
  reconnect_failed: () => void;

  // Room events
  'room:joined': (data: { roomId: string; members: RoomMember[] }) => void;
  'room:left': (data: { roomId: string; userId: string }) => void;
  'room:user-joined': (data: { roomId: string; member: RoomMember }) => void;
  'room:user-left': (data: { roomId: string; userId: string }) => void;
  'room:error': (data: { roomId: string; error: string }) => void;

  // Collaborative editing events
  'yjs:update': (data: { roomId: string; update: Uint8Array }) => void;
  'cursor:update': (data: { roomId: string; userId: string; username: string; position: CursorPosition }) => void;
  'selection:update': (data: { roomId: string; userId: string; username: string; selection: any }) => void;
  'code:change': (data: { roomId: string; userId: string; code: string; delta: any }) => void;
  'language:change': (data: { roomId: string; language: string }) => void;
  'typing:status': (data: { roomId: string; userId: string; username: string; isTyping: boolean }) => void;

  // Presence events
  'presence:update': (data: { roomId: string; members: RoomMember[] }) => void;
}

// Socket error types
export interface SocketError {
  type: 'connection' | 'room' | 'authentication' | 'collaboration';
  message: string;
  code?: string;
  details?: any;
}

// Connection options
export interface SocketConnectionOptions {
  token?: string;
  autoConnect?: boolean;
  reconnection?: boolean;
  reconnectionAttempts?: number;
  reconnectionDelay?: number;
  timeout?: number;
}

// Room join data
export interface RoomJoinData {
  roomId: string;
  password?: string;
}

// Yjs update data
export interface YjsUpdateData {
  roomId: string;
  update: Uint8Array;
}

// Cursor update data
export interface CursorUpdateData {
  roomId: string;
  position: CursorPosition;
}

// Code change data
export interface CodeChangeData {
  roomId: string;
  code: string;
  delta: any;
}

// Language change data
export interface LanguageChangeData {
  roomId: string;
  language: string;
}

// Typing status data
export interface TypingStatusData {
  roomId: string;
  isTyping: boolean;
}