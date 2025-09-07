import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSocket } from '../useSocket';
import { socketService } from '../../services/socketService';
import type { ConnectionStatus, SocketError } from '../../types';

// Mock the socket service
vi.mock('../../services/socketService', () => ({
  socketService: {
    connect: vi.fn(),
    disconnect: vi.fn(),
    isConnected: vi.fn(),
    getConnectionStatus: vi.fn(),
    getReconnectAttempts: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

const mockSocketService = vi.mocked(socketService);

describe('useSocket', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSocketService.isConnected.mockReturnValue(false);
    mockSocketService.getConnectionStatus.mockReturnValue('disconnected');
    mockSocketService.getReconnectAttempts.mockReturnValue(0);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useSocket());

    expect(result.current.isConnected).toBe(false);
    expect(result.current.connectionStatus).toBe('disconnected');
    expect(result.current.error).toBeNull();
    expect(result.current.reconnectAttempts).toBe(0);
  });

  it('should auto-connect when autoConnect is true', () => {
    const token = 'test-token';
    
    renderHook(() => useSocket({ autoConnect: true, token }));

    expect(mockSocketService.connect).toHaveBeenCalledWith(token);
  });

  it('should not auto-connect when autoConnect is false', () => {
    renderHook(() => useSocket({ autoConnect: false }));

    expect(mockSocketService.connect).not.toHaveBeenCalled();
  });

  it('should connect manually', () => {
    const { result } = renderHook(() => useSocket());
    const token = 'test-token';

    act(() => {
      result.current.connect(token);
    });

    expect(mockSocketService.connect).toHaveBeenCalledWith(token);
  });

  it('should disconnect manually', () => {
    const { result } = renderHook(() => useSocket());

    act(() => {
      result.current.disconnect();
    });

    expect(mockSocketService.disconnect).toHaveBeenCalled();
  });

  it('should update connection status when socket connects', () => {
    let statusCallback: ((status: ConnectionStatus) => void) | undefined;
    
    mockSocketService.on.mockImplementation((event, callback) => {
      if (event === 'connection:status') {
        statusCallback = callback as (status: ConnectionStatus) => void;
      }
    });

    const { result } = renderHook(() => useSocket());

    // Simulate connection status change
    act(() => {
      statusCallback?.('connected');
    });

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionStatus).toBe('connected');
    expect(result.current.error).toBeNull();
  });

  it('should handle socket errors', () => {
    let errorCallback: ((error: SocketError) => void) | undefined;
    
    mockSocketService.on.mockImplementation((event, callback) => {
      if (event === 'socket:error') {
        errorCallback = callback as (error: SocketError) => void;
      }
    });

    const { result } = renderHook(() => useSocket());

    const testError: SocketError = {
      type: 'connection',
      message: 'Connection failed',
    };

    // Simulate error
    act(() => {
      errorCallback?.(testError);
    });

    expect(result.current.error).toEqual(testError);
  });

  it('should update reconnect attempts', () => {
    let reconnectCallback: ((attemptNumber: number) => void) | undefined;
    
    mockSocketService.on.mockImplementation((event, callback) => {
      if (event === 'reconnect_attempt') {
        reconnectCallback = callback as (attemptNumber: number) => void;
      }
    });

    const { result } = renderHook(() => useSocket());

    // Simulate reconnect attempt
    act(() => {
      reconnectCallback?.(3);
    });

    expect(result.current.reconnectAttempts).toBe(3);
  });

  it('should clear error when successfully connected', () => {
    let statusCallback: ((status: ConnectionStatus) => void) | undefined;
    let errorCallback: ((error: SocketError) => void) | undefined;
    
    mockSocketService.on.mockImplementation((event, callback) => {
      if (event === 'connection:status') {
        statusCallback = callback as (status: ConnectionStatus) => void;
      } else if (event === 'socket:error') {
        errorCallback = callback as (error: SocketError) => void;
      }
    });

    const { result } = renderHook(() => useSocket());

    // First, simulate an error
    const testError: SocketError = {
      type: 'connection',
      message: 'Connection failed',
    };

    act(() => {
      errorCallback?.(testError);
    });

    expect(result.current.error).toEqual(testError);

    // Then simulate successful connection
    act(() => {
      statusCallback?.('connected');
    });

    expect(result.current.error).toBeNull();
    expect(result.current.isConnected).toBe(true);
  });

  it('should clean up event listeners on unmount', () => {
    const { unmount } = renderHook(() => useSocket());

    unmount();

    expect(mockSocketService.off).toHaveBeenCalledWith('connection:status', expect.any(Function));
    expect(mockSocketService.off).toHaveBeenCalledWith('socket:error', expect.any(Function));
    expect(mockSocketService.off).toHaveBeenCalledWith('reconnect_attempt', expect.any(Function));
  });

  it('should use token from options when connecting', () => {
    const token = 'test-token';
    const { result } = renderHook(() => useSocket({ token }));

    act(() => {
      result.current.connect();
    });

    expect(mockSocketService.connect).toHaveBeenCalledWith(token);
  });

  it('should override token when connecting with parameter', () => {
    const optionsToken = 'options-token';
    const connectToken = 'connect-token';
    
    const { result } = renderHook(() => useSocket({ token: optionsToken }));

    act(() => {
      result.current.connect(connectToken);
    });

    expect(mockSocketService.connect).toHaveBeenCalledWith(connectToken);
  });

  it('should get initial state from socket service', () => {
    mockSocketService.isConnected.mockReturnValue(true);
    mockSocketService.getConnectionStatus.mockReturnValue('connected');
    mockSocketService.getReconnectAttempts.mockReturnValue(2);

    const { result } = renderHook(() => useSocket());

    expect(result.current.isConnected).toBe(true);
    expect(result.current.connectionStatus).toBe('connected');
    expect(result.current.reconnectAttempts).toBe(2);
  });
});