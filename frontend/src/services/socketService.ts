import { io, Socket } from 'socket.io-client';
import type {
  SocketService as ISocketService,
  ConnectionStatus,
  SocketError,
  SocketConnectionOptions,
  RoomJoinData,
  YjsUpdateData,
  CursorUpdateData,
  CodeChangeData,
  LanguageChangeData,
  TypingStatusData
} from '../types';
import type { CursorPosition } from '../types/editor';

class SocketService implements ISocketService {
  private socket: Socket | null = null;
  private connectionStatus: ConnectionStatus = 'disconnected';
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;
  private eventListeners = new Map<string, Function[]>();
  private currentRoomId: string | null = null;

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Connect to the Socket.io server
   */
  connect(token?: string): void {
    if (this.socket?.connected) {
      console.warn('Socket is already connected');
      return;
    }

    const serverUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3001';
    
    const options: SocketConnectionOptions = {
      autoConnect: true,
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: this.reconnectDelay,
      timeout: 10000,
    };

    // Add authentication token if provided
    if (token) {
      (options as any).auth = { token };
    }

    this.setConnectionStatus('connecting');
    this.socket = io(serverUrl, options);
    this.setupSocketEventHandlers();
  }

  /**
   * Disconnect from the Socket.io server
   */
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.currentRoomId = null;
      this.setConnectionStatus('disconnected');
    }
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  /**
   * Get current connection status
   */
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Join a room
   */
  joinRoom(roomId: string, password?: string): void {
    if (!this.socket?.connected) {
      this.emitError({
        type: 'connection',
        message: 'Socket not connected. Cannot join room.',
      });
      return;
    }

    const joinData: RoomJoinData = { roomId, password };
    this.socket.emit('room:join', joinData);
    this.currentRoomId = roomId;
  }

  /**
   * Leave a room
   */
  leaveRoom(roomId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('room:leave', { roomId });
    
    if (this.currentRoomId === roomId) {
      this.currentRoomId = null;
    }
  }

  /**
   * Send Yjs update for collaborative editing
   */
  sendYjsUpdate(roomId: string, update: Uint8Array): void {
    if (!this.socket?.connected) {
      return;
    }

    const updateData: YjsUpdateData = { roomId, update };
    this.socket.emit('yjs:update', updateData);
  }

  /**
   * Send cursor position update
   */
  sendCursorUpdate(roomId: string, position: CursorPosition): void {
    if (!this.socket?.connected) {
      return;
    }

    const cursorData: CursorUpdateData = { roomId, position };
    this.socket.emit('cursor:update', cursorData);
  }

  /**
   * Send code change
   */
  sendCodeChange(roomId: string, code: string, delta: any): void {
    if (!this.socket?.connected) {
      return;
    }

    const codeData: CodeChangeData = { roomId, code, delta };
    this.socket.emit('code:change', codeData);
  }

  /**
   * Send language change
   */
  sendLanguageChange(roomId: string, language: string): void {
    if (!this.socket?.connected) {
      return;
    }

    const languageData: LanguageChangeData = { roomId, language };
    this.socket.emit('language:change', languageData);
  }

  /**
   * Send typing status
   */
  sendTypingStatus(roomId: string, isTyping: boolean): void {
    if (!this.socket?.connected) {
      return;
    }

    const typingData: TypingStatusData = { roomId, isTyping };
    this.socket.emit('typing:status', typingData);
  }

  /**
   * Send selection update
   */
  sendSelectionUpdate(roomId: string, selection: any): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('selection:update', { roomId, selection });
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);

    // If socket is already connected, add the listener immediately
    if (this.socket) {
      this.socket.on(event, callback as any);
    }
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }

    // Remove from socket if connected
    if (this.socket) {
      this.socket.off(event, callback as any);
    }
  }

  /**
   * Emit custom event
   */
  emit(event: string, ...args: any[]): void {
    if (!this.socket?.connected) {
      console.warn(`Cannot emit event '${event}': Socket not connected`);
      return;
    }

    this.socket.emit(event, ...args);
  }

  /**
   * Setup socket event handlers for connection management
   */
  private setupSocketEventHandlers(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      console.log('Socket connected');
      this.setConnectionStatus('connected');
      this.reconnectAttempts = 0;
      this.emitConnectionEvent('connect');
    });

    this.socket.on('disconnect', (reason: string) => {
      console.log('Socket disconnected:', reason);
      this.setConnectionStatus('disconnected');
      this.emitConnectionEvent('disconnect', reason);
    });

    this.socket.on('connect_error', (error: Error) => {
      console.error('Socket connection error:', error);
      this.setConnectionStatus('error');
      this.emitError({
        type: 'connection',
        message: 'Failed to connect to server',
        details: error,
      });
    });

    // Reconnection events
    this.socket.on('reconnect', (attemptNumber: number) => {
      console.log(`Socket reconnected after ${attemptNumber} attempts`);
      this.setConnectionStatus('connected');
      this.reconnectAttempts = 0;
      this.emitConnectionEvent('reconnect', attemptNumber);
      
      // Rejoin room if we were in one
      if (this.currentRoomId) {
        this.joinRoom(this.currentRoomId);
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber: number) => {
      console.log(`Socket reconnection attempt ${attemptNumber}`);
      this.setConnectionStatus('reconnecting');
      this.reconnectAttempts = attemptNumber;
      this.emitConnectionEvent('reconnect_attempt', attemptNumber);
    });

    this.socket.on('reconnect_error', (error: Error) => {
      console.error('Socket reconnection error:', error);
      this.emitError({
        type: 'connection',
        message: 'Failed to reconnect to server',
        details: error,
      });
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed');
      this.setConnectionStatus('error');
      this.emitError({
        type: 'connection',
        message: 'Failed to reconnect to server after maximum attempts',
      });
    });

    // Room events
    this.socket.on('room:error', (data: { roomId: string; error: string }) => {
      this.emitError({
        type: 'room',
        message: data.error,
        details: { roomId: data.roomId },
      });
    });

    // Authentication errors
    this.socket.on('auth:error', (error: string) => {
      this.emitError({
        type: 'authentication',
        message: error,
      });
    });

    // Add all registered event listeners to the socket
    this.eventListeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket!.on(event, callback as any);
      });
    });
  }

  /**
   * Setup internal event listeners
   */
  private setupEventListeners(): void {
    // Connection status change listener
    this.on('connection:status', (status: ConnectionStatus) => {
      console.log(`Connection status changed to: ${status}`);
    });

    // Error listener
    this.on('socket:error', (error: SocketError) => {
      console.error('Socket error:', error);
    });
  }

  /**
   * Set connection status and emit event
   */
  private setConnectionStatus(status: ConnectionStatus): void {
    if (this.connectionStatus !== status) {
      this.connectionStatus = status;
      this.emitConnectionEvent('connection:status', status);
    }
  }

  /**
   * Emit connection-related events
   */
  private emitConnectionEvent(event: string, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(...args);
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error);
        }
      });
    }
  }

  /**
   * Emit error events
   */
  private emitError(error: SocketError): void {
    const listeners = this.eventListeners.get('socket:error');
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(error);
        } catch (err) {
          console.error('Error in error event listener:', err);
        }
      });
    }
  }

  /**
   * Get current room ID
   */
  getCurrentRoomId(): string | null {
    return this.currentRoomId;
  }

  /**
   * Get reconnection attempts count
   */
  getReconnectAttempts(): number {
    return this.reconnectAttempts;
  }

  /**
   * Set maximum reconnection attempts
   */
  setMaxReconnectAttempts(attempts: number): void {
    this.maxReconnectAttempts = attempts;
  }

  /**
   * Set reconnection delay
   */
  setReconnectDelay(delay: number): void {
    this.reconnectDelay = delay;
  }
}

// Create and export singleton instance
export const socketService = new SocketService();
export default socketService;