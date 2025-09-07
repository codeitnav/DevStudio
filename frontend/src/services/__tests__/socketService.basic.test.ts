import { describe, it, expect } from 'vitest';
import { socketService } from '../socketService';

describe('SocketService Basic Tests', () => {
  it('should be defined', () => {
    expect(socketService).toBeDefined();
  });

  it('should have required methods', () => {
    expect(typeof socketService.connect).toBe('function');
    expect(typeof socketService.disconnect).toBe('function');
    expect(typeof socketService.isConnected).toBe('function');
    expect(typeof socketService.joinRoom).toBe('function');
    expect(typeof socketService.leaveRoom).toBe('function');
    expect(typeof socketService.sendYjsUpdate).toBe('function');
    expect(typeof socketService.sendCursorUpdate).toBe('function');
    expect(typeof socketService.sendCodeChange).toBe('function');
    expect(typeof socketService.sendLanguageChange).toBe('function');
    expect(typeof socketService.sendTypingStatus).toBe('function');
    expect(typeof socketService.on).toBe('function');
    expect(typeof socketService.off).toBe('function');
    expect(typeof socketService.emit).toBe('function');
  });

  it('should start disconnected', () => {
    expect(socketService.isConnected()).toBe(false);
  });

  it('should have utility methods', () => {
    expect(typeof socketService.getCurrentRoomId).toBe('function');
    expect(typeof socketService.getReconnectAttempts).toBe('function');
    expect(typeof socketService.setMaxReconnectAttempts).toBe('function');
    expect(typeof socketService.setReconnectDelay).toBe('function');
  });
});