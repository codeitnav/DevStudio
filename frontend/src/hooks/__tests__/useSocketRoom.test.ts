import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocketRoom } from '../useSocketRoom';
import { socketService } from '../../services/socketService';
import type { CursorPosition } from '../../types';

// Mock the socket service
vi.mock('../../services/socketService', () => ({
  socketService: {
    isConnected: vi.fn(),
    joinRoom: vi.fn(),
    leaveRoom: vi.fn(),
    sendCursorUpdate: vi.fn(),
    sendCodeChange: vi.fn(),
    sendLanguageChange: vi.fn(),
    sendTypingStatus: vi.fn(),
    sendYjsUpdate: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

const mockSocketService = vi.mocked(socketService);

describe('useSocketRoom', () => {
  const roomId = 'test-room';
  const password = 'test-password';

  beforeEach(() => {
    vi.clearAllMocks();
    mockSocketService.isConnected.mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize without auto-joining', () => {
    renderHook(() => useSocketRoom({ roomId, autoJoin: false }));

    expect(mockSocketService.joinRoom).not.toHaveBeenCalled();
  });

  it('should auto-join room when autoJoin is true and socket is connected', () => {
    renderHook(() => useSocketRoom({ roomId, password, autoJoin: true }));

    expect(mockSocketService.joinRoom).toHaveBeenCalledWith(roomId, password);
  });

  it('should not auto-join when socket is not connected', () => {
    mockSocketService.isConnected.mockReturnValue(false);
    
    renderHook(() => useSocketRoom({ roomId, autoJoin: true }));

    expect(mockSocketService.joinRoom).not.toHaveBeenCalled();
  });

  it('should join room manually', () => {
    const { result } = renderHook(() => useSocketRoom({ roomId }));

    act(() => {
      result.current.joinRoom(password);
    });

    expect(mockSocketService.joinRoom).toHaveBeenCalledWith(roomId, password);
  });

  it('should join room with options password when no parameter provided', () => {
    const { result } = renderHook(() => useSocketRoom({ roomId, password }));

    act(() => {
      result.current.joinRoom();
    });

    expect(mockSocketService.joinRoom).toHaveBeenCalledWith(roomId, password);
  });

  it('should not join room when socket is not connected', () => {
    mockSocketService.isConnected.mockReturnValue(false);
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    
    const { result } = renderHook(() => useSocketRoom({ roomId }));

    act(() => {
      result.current.joinRoom();
    });

    expect(mockSocketService.joinRoom).not.toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalledWith('Cannot join room: Socket not connected');
    
    consoleSpy.mockRestore();
  });

  it('should leave room', () => {
    const { result } = renderHook(() => useSocketRoom({ roomId, autoJoin: true }));

    act(() => {
      result.current.leaveRoom();
    });

    expect(mockSocketService.leaveRoom).toHaveBeenCalledWith(roomId);
  });

  it('should send cursor update', () => {
    const { result } = renderHook(() => useSocketRoom({ roomId, autoJoin: true }));
    const position: CursorPosition = { line: 1, column: 5 };

    act(() => {
      result.current.sendCursorUpdate(position);
    });

    expect(mockSocketService.sendCursorUpdate).toHaveBeenCalledWith(roomId, position);
  });

  it('should send code change', () => {
    const { result } = renderHook(() => useSocketRoom({ roomId, autoJoin: true }));
    const code = 'console.log("hello");';
    const delta = { ops: [{ insert: 'hello' }] };

    act(() => {
      result.current.sendCodeChange(code, delta);
    });

    expect(mockSocketService.sendCodeChange).toHaveBeenCalledWith(roomId, code, delta);
  });

  it('should send language change', () => {
    const { result } = renderHook(() => useSocketRoom({ roomId, autoJoin: true }));
    const language = 'typescript';

    act(() => {
      result.current.sendLanguageChange(language);
    });

    expect(mockSocketService.sendLanguageChange).toHaveBeenCalledWith(roomId, language);
  });

  it('should send typing status', () => {
    const { result } = renderHook(() => useSocketRoom({ roomId, autoJoin: true }));
    const isTyping = true;

    act(() => {
      result.current.sendTypingStatus(isTyping);
    });

    expect(mockSocketService.sendTypingStatus).toHaveBeenCalledWith(roomId, isTyping);
  });

  it('should send Yjs update', () => {
    const { result } = renderHook(() => useSocketRoom({ roomId, autoJoin: true }));
    const update = new Uint8Array([1, 2, 3]);

    act(() => {
      result.current.sendYjsUpdate(update);
    });

    expect(mockSocketService.sendYjsUpdate).toHaveBeenCalledWith(roomId, update);
  });

  it('should not send updates when not in room', () => {
    const { result } = renderHook(() => useSocketRoom({ roomId, autoJoin: false }));
    
    act(() => {
      result.current.sendCursorUpdate({ line: 1, column: 1 });
      result.current.sendCodeChange('code', {});
      result.current.sendLanguageChange('js');
      result.current.sendTypingStatus(true);
      result.current.sendYjsUpdate(new Uint8Array());
    });

    expect(mockSocketService.sendCursorUpdate).not.toHaveBeenCalled();
    expect(mockSocketService.sendCodeChange).not.toHaveBeenCalled();
    expect(mockSocketService.sendLanguageChange).not.toHaveBeenCalled();
    expect(mockSocketService.sendTypingStatus).not.toHaveBeenCalled();
    expect(mockSocketService.sendYjsUpdate).not.toHaveBeenCalled();
  });

  it('should join room when socket connects and autoJoin is true', () => {
    let connectCallback: (() => void) | undefined;
    
    mockSocketService.on.mockImplementation((event, callback) => {
      if (event === 'connect') {
        connectCallback = callback as () => void;
      }
    });

    mockSocketService.isConnected.mockReturnValue(false);
    
    renderHook(() => useSocketRoom({ roomId, password, autoJoin: true }));

    // Initially should not join because socket is not connected
    expect(mockSocketService.joinRoom).not.toHaveBeenCalled();

    // Simulate socket connection
    mockSocketService.isConnected.mockReturnValue(true);
    act(() => {
      connectCallback?.();
    });

    expect(mockSocketService.joinRoom).toHaveBeenCalledWith(roomId, password);
  });

  it('should leave room on unmount', () => {
    const { unmount } = renderHook(() => useSocketRoom({ roomId, autoJoin: true }));

    unmount();

    expect(mockSocketService.leaveRoom).toHaveBeenCalledWith(roomId);
  });

  it('should leave previous room when roomId changes', () => {
    const { rerender } = renderHook(
      ({ roomId: currentRoomId }) => useSocketRoom({ roomId: currentRoomId, autoJoin: true }),
      { initialProps: { roomId: 'room1' } }
    );

    // Change room ID
    rerender({ roomId: 'room2' });

    expect(mockSocketService.leaveRoom).toHaveBeenCalledWith('room1');
    expect(mockSocketService.joinRoom).toHaveBeenCalledWith('room2', undefined);
  });

  it('should track room membership status', () => {
    const { result } = renderHook(() => useSocketRoom({ roomId, autoJoin: true }));

    expect(result.current.isInRoom).toBe(true);

    act(() => {
      result.current.leaveRoom();
    });

    expect(result.current.isInRoom).toBe(false);
  });

  it('should clean up connect event listener on unmount', () => {
    const { unmount } = renderHook(() => useSocketRoom({ roomId, autoJoin: true }));

    unmount();

    expect(mockSocketService.off).toHaveBeenCalledWith('connect', expect.any(Function));
  });
});