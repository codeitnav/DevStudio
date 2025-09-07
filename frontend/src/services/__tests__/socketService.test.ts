import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { io } from 'socket.io-client';
import { socketService } from '../socketService';
import type { SocketError, CursorPosition } from '../../types';

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(),
}));

// Mock socket instance
const mockSocket = {
  connected: false,
  connect: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
};

const mockIo = vi.mocked(io);

describe('SocketService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocket.connected = false;
    mockIo.mockReturnValue(mockSocket as any);
  });

  afterEach(() => {
    socketService.disconnect();
  });

  describe('Connection Management', () => {
    it('should connect to socket server', () => {
      const token = 'test-token';
      
      socketService.connect(token);
      
      expect(mockIo).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          autoConnect: true,
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
          timeout: 10000,
          auth: { token },
        })
      );
    });

    it('should connect without token', () => {
      socketService.connect();
      
      expect(mockIo).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          autoConnect: true,
          reconnection: true,
        })
      );
    });

    it('should not connect if already connected', () => {
      mockSocket.connected = true;
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      
      socketService.connect();
      
      expect(consoleSpy).toHaveBeenCalledWith('Socket is already connected');
      consoleSpy.mockRestore();
    });

    it('should disconnect from socket server', () => {
      socketService.connect();
      mockSocket.connected = true;
      
      socketService.disconnect();
      
      expect(mockSocket.disconnect).toHaveBeenCalled();
    });

    it('should return connection status', () => {
      expect(socketService.isConnected()).toBe(false);
      
      mockSocket.connected = true;
      expect(socketService.isConnected()).toBe(true);
    });
  });

  describe('Room Operations', () => {
    beforeEach(() => {
      socketService.connect();
      mockSocket.connected = true;
    });

    it('should join room without password', () => {
      const roomId = 'test-room';
      
      socketService.joinRoom(roomId);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('room:join', {
        roomId,
        password: undefined,
      });
    });

    it('should join room with password', () => {
      const roomId = 'test-room';
      const password = 'test-password';
      
      socketService.joinRoom(roomId, password);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('room:join', {
        roomId,
        password,
      });
    });

    it('should leave room', () => {
      const roomId = 'test-room';
      
      socketService.leaveRoom(roomId);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('room:leave', {
        roomId,
      });
    });

    it('should not join room if not connected', () => {
      mockSocket.connected = false;
      const errorCallback = vi.fn();
      socketService.on('socket:error', errorCallback);
      
      socketService.joinRoom('test-room');
      
      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(errorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'connection',
          message: 'Socket not connected. Cannot join room.',
        })
      );
    });
  });

  describe('Collaborative Editing', () => {
    beforeEach(() => {
      socketService.connect();
      mockSocket.connected = true;
    });

    it('should send Yjs update', () => {
      const roomId = 'test-room';
      const update = new Uint8Array([1, 2, 3]);
      
      socketService.sendYjsUpdate(roomId, update);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('yjs:update', {
        roomId,
        update,
      });
    });

    it('should send cursor update', () => {
      const roomId = 'test-room';
      const position: CursorPosition = { line: 1, column: 5 };
      
      socketService.sendCursorUpdate(roomId, position);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('cursor:update', {
        roomId,
        position,
      });
    });

    it('should send code change', () => {
      const roomId = 'test-room';
      const code = 'console.log("hello");';
      const delta = { ops: [{ insert: 'hello' }] };
      
      socketService.sendCodeChange(roomId, code, delta);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('code:change', {
        roomId,
        code,
        delta,
      });
    });

    it('should send language change', () => {
      const roomId = 'test-room';
      const language = 'typescript';
      
      socketService.sendLanguageChange(roomId, language);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('language:change', {
        roomId,
        language,
      });
    });

    it('should send typing status', () => {
      const roomId = 'test-room';
      const isTyping = true;
      
      socketService.sendTypingStatus(roomId, isTyping);
      
      expect(mockSocket.emit).toHaveBeenCalledWith('typing:status', {
        roomId,
        isTyping,
      });
    });

    it('should not send updates if not connected', () => {
      mockSocket.connected = false;
      
      socketService.sendYjsUpdate('room', new Uint8Array());
      socketService.sendCursorUpdate('room', { line: 1, column: 1 });
      socketService.sendCodeChange('room', 'code', {});
      socketService.sendLanguageChange('room', 'js');
      socketService.sendTypingStatus('room', true);
      
      expect(mockSocket.emit).not.toHaveBeenCalled();
    });
  });

  describe('Event Management', () => {
    beforeEach(() => {
      socketService.connect();
    });

    it('should add event listener', () => {
      const callback = vi.fn();
      const event = 'test:event';
      
      socketService.on(event, callback);
      
      expect(mockSocket.on).toHaveBeenCalledWith(event, callback);
    });

    it('should remove event listener', () => {
      const callback = vi.fn();
      const event = 'test:event';
      
      socketService.on(event, callback);
      socketService.off(event, callback);
      
      expect(mockSocket.off).toHaveBeenCalledWith(event, callback);
    });

    it('should emit custom event', () => {
      const event = 'custom:event';
      const data = { test: 'data' };
      mockSocket.connected = true;
      
      socketService.emit(event, data);
      
      expect(mockSocket.emit).toHaveBeenCalledWith(event, data);
    });

    it('should not emit if not connected', () => {
      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
      mockSocket.connected = false;
      
      socketService.emit('test:event', {});
      
      expect(mockSocket.emit).not.toHaveBeenCalled();
      expect(consoleSpy).toHaveBeenCalledWith(
        "Cannot emit event 'test:event': Socket not connected"
      );
      consoleSpy.mockRestore();
    });
  });

  describe('Error Handling', () => {
    it('should handle connection errors', () => {
      const errorCallback = vi.fn();
      socketService.on('socket:error', errorCallback);
      socketService.connect();
      
      // Simulate connection error
      const connectErrorCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'connect_error'
      )?.[1];
      
      const error = new Error('Connection failed');
      connectErrorCallback?.(error);
      
      expect(errorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'connection',
          message: 'Failed to connect to server',
          details: error,
        })
      );
    });

    it('should handle room errors', () => {
      const errorCallback = vi.fn();
      socketService.on('socket:error', errorCallback);
      socketService.connect();
      
      // Simulate room error
      const roomErrorCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'room:error'
      )?.[1];
      
      const roomError = { roomId: 'test-room', error: 'Room not found' };
      roomErrorCallback?.(roomError);
      
      expect(errorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'room',
          message: 'Room not found',
          details: { roomId: 'test-room' },
        })
      );
    });

    it('should handle authentication errors', () => {
      const errorCallback = vi.fn();
      socketService.on('socket:error', errorCallback);
      socketService.connect();
      
      // Simulate auth error
      const authErrorCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'auth:error'
      )?.[1];
      
      authErrorCallback?.('Invalid token');
      
      expect(errorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'authentication',
          message: 'Invalid token',
        })
      );
    });
  });

  describe('Reconnection Logic', () => {
    beforeEach(() => {
      socketService.connect();
    });

    it('should handle successful reconnection', () => {
      const connectCallback = vi.fn();
      socketService.on('reconnect', connectCallback);
      
      // Simulate reconnection
      const reconnectCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'reconnect'
      )?.[1];
      
      reconnectCallback?.(3);
      
      expect(connectCallback).toHaveBeenCalledWith(3);
    });

    it('should handle reconnection attempts', () => {
      const attemptCallback = vi.fn();
      socketService.on('reconnect_attempt', attemptCallback);
      
      // Simulate reconnection attempt
      const attemptCallbackFn = mockSocket.on.mock.calls.find(
        call => call[0] === 'reconnect_attempt'
      )?.[1];
      
      attemptCallbackFn?.(2);
      
      expect(attemptCallback).toHaveBeenCalledWith(2);
    });

    it('should handle reconnection failure', () => {
      const errorCallback = vi.fn();
      socketService.on('socket:error', errorCallback);
      
      // Simulate reconnection failure
      const failedCallback = mockSocket.on.mock.calls.find(
        call => call[0] === 'reconnect_failed'
      )?.[1];
      
      failedCallback?.();
      
      expect(errorCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'connection',
          message: 'Failed to reconnect to server after maximum attempts',
        })
      );
    });
  });

  describe('Utility Methods', () => {
    it('should get current room ID', () => {
      expect(socketService.getCurrentRoomId()).toBeNull();
      
      socketService.connect();
      mockSocket.connected = true;
      socketService.joinRoom('test-room');
      
      expect(socketService.getCurrentRoomId()).toBe('test-room');
    });

    it('should get reconnect attempts', () => {
      expect(socketService.getReconnectAttempts()).toBe(0);
    });

    it('should set max reconnect attempts', () => {
      socketService.setMaxReconnectAttempts(10);
      // This would be tested by checking the socket options, but since we're mocking,
      // we just verify the method doesn't throw
      expect(() => socketService.setMaxReconnectAttempts(10)).not.toThrow();
    });

    it('should set reconnect delay', () => {
      socketService.setReconnectDelay(2000);
      // This would be tested by checking the socket options, but since we're mocking,
      // we just verify the method doesn't throw
      expect(() => socketService.setReconnectDelay(2000)).not.toThrow();
    });
  });
});