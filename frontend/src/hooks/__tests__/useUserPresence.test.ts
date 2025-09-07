import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useUserPresence } from '../useUserPresence';
import { userPresenceService } from '../../services/userPresenceService';

// Mock the user presence service
vi.mock('../../services/userPresenceService', () => ({
  userPresenceService: {
    initialize: vi.fn(),
    cleanup: vi.fn(),
    getActivities: vi.fn(() => new Map()),
    getTypingUsers: vi.fn(() => []),
    getActiveUsers: vi.fn(() => []),
    updateTypingStatus: vi.fn(),
    sendPresenceUpdate: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

describe('useUserPresence', () => {
  const mockOptions = {
    roomId: 'test-room',
    userId: 'test-user',
    username: 'Test User',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('initializes presence service on mount', () => {
    renderHook(() => useUserPresence(mockOptions));

    expect(userPresenceService.initialize).toHaveBeenCalledWith(
      mockOptions.roomId,
      mockOptions.userId,
      mockOptions.username
    );
  });

  it('cleans up presence service on unmount', () => {
    const { unmount } = renderHook(() => useUserPresence(mockOptions));

    unmount();

    expect(userPresenceService.cleanup).toHaveBeenCalled();
  });

  it('does not initialize when disabled', () => {
    renderHook(() => useUserPresence({ ...mockOptions, enabled: false }));

    expect(userPresenceService.initialize).not.toHaveBeenCalled();
  });

  it('sets up event listeners', () => {
    renderHook(() => useUserPresence(mockOptions));

    expect(userPresenceService.on).toHaveBeenCalledWith('typing:changed', expect.any(Function));
    expect(userPresenceService.on).toHaveBeenCalledWith('activity:changed', expect.any(Function));
    expect(userPresenceService.on).toHaveBeenCalledWith('focus:changed', expect.any(Function));
    expect(userPresenceService.on).toHaveBeenCalledWith('presence:updated', expect.any(Function));
    expect(userPresenceService.on).toHaveBeenCalledWith('user:joined', expect.any(Function));
    expect(userPresenceService.on).toHaveBeenCalledWith('user:left', expect.any(Function));
  });

  it('removes event listeners on unmount', () => {
    const { unmount } = renderHook(() => useUserPresence(mockOptions));

    unmount();

    expect(userPresenceService.off).toHaveBeenCalledWith('typing:changed', expect.any(Function));
    expect(userPresenceService.off).toHaveBeenCalledWith('activity:changed', expect.any(Function));
    expect(userPresenceService.off).toHaveBeenCalledWith('focus:changed', expect.any(Function));
    expect(userPresenceService.off).toHaveBeenCalledWith('presence:updated', expect.any(Function));
    expect(userPresenceService.off).toHaveBeenCalledWith('user:joined', expect.any(Function));
    expect(userPresenceService.off).toHaveBeenCalledWith('user:left', expect.any(Function));
  });

  it('returns initial state from service', () => {
    const mockActivities = new Map([
      ['user1', {
        userId: 'user1',
        username: 'User 1',
        lastActivity: new Date(),
        isActive: true,
        isTyping: false,
        isFocused: true,
      }],
    ]);

    const mockTypingUsers = [
      {
        userId: 'user2',
        username: 'User 2',
        lastActivity: new Date(),
        isActive: true,
        isTyping: true,
        isFocused: true,
      },
    ];

    const mockActiveUsers = [
      {
        userId: 'user1',
        username: 'User 1',
        lastActivity: new Date(),
        isActive: true,
        isTyping: false,
        isFocused: true,
      },
    ];

    vi.mocked(userPresenceService.getActivities).mockReturnValue(mockActivities);
    vi.mocked(userPresenceService.getTypingUsers).mockReturnValue(mockTypingUsers);
    vi.mocked(userPresenceService.getActiveUsers).mockReturnValue(mockActiveUsers);

    const { result } = renderHook(() => useUserPresence(mockOptions));

    expect(result.current.activities).toEqual(mockActivities);
    expect(result.current.typingUsers).toEqual(mockTypingUsers);
    expect(result.current.activeUsers).toEqual(mockActiveUsers);
  });

  it('provides helper functions', () => {
    const { result } = renderHook(() => useUserPresence(mockOptions));

    expect(typeof result.current.isUserTyping).toBe('function');
    expect(typeof result.current.isUserActive).toBe('function');
    expect(typeof result.current.isUserFocused).toBe('function');
    expect(typeof result.current.sendTypingStatus).toBe('function');
    expect(typeof result.current.sendPresenceUpdate).toBe('function');
  });

  it('isUserTyping returns correct value', () => {
    const mockActivities = new Map([
      ['user1', {
        userId: 'user1',
        username: 'User 1',
        lastActivity: new Date(),
        isActive: true,
        isTyping: true,
        isFocused: true,
      }],
      ['user2', {
        userId: 'user2',
        username: 'User 2',
        lastActivity: new Date(),
        isActive: true,
        isTyping: false,
        isFocused: true,
      }],
    ]);

    vi.mocked(userPresenceService.getActivities).mockReturnValue(mockActivities);

    const { result } = renderHook(() => useUserPresence(mockOptions));

    expect(result.current.isUserTyping('user1')).toBe(true);
    expect(result.current.isUserTyping('user2')).toBe(false);
    expect(result.current.isUserTyping('nonexistent')).toBe(false);
  });

  it('isUserActive returns correct value', () => {
    const mockActivities = new Map([
      ['user1', {
        userId: 'user1',
        username: 'User 1',
        lastActivity: new Date(),
        isActive: true,
        isTyping: false,
        isFocused: true,
      }],
      ['user2', {
        userId: 'user2',
        username: 'User 2',
        lastActivity: new Date(),
        isActive: false,
        isTyping: false,
        isFocused: true,
      }],
    ]);

    vi.mocked(userPresenceService.getActivities).mockReturnValue(mockActivities);

    const { result } = renderHook(() => useUserPresence(mockOptions));

    expect(result.current.isUserActive('user1')).toBe(true);
    expect(result.current.isUserActive('user2')).toBe(false);
    expect(result.current.isUserActive('nonexistent')).toBe(false);
  });

  it('isUserFocused returns correct value', () => {
    const mockActivities = new Map([
      ['user1', {
        userId: 'user1',
        username: 'User 1',
        lastActivity: new Date(),
        isActive: true,
        isTyping: false,
        isFocused: true,
      }],
      ['user2', {
        userId: 'user2',
        username: 'User 2',
        lastActivity: new Date(),
        isActive: true,
        isTyping: false,
        isFocused: false,
      }],
    ]);

    vi.mocked(userPresenceService.getActivities).mockReturnValue(mockActivities);

    const { result } = renderHook(() => useUserPresence(mockOptions));

    expect(result.current.isUserFocused('user1')).toBe(true);
    expect(result.current.isUserFocused('user2')).toBe(false);
    expect(result.current.isUserFocused('nonexistent')).toBe(false);
  });

  it('sendTypingStatus calls service method when enabled', () => {
    const { result } = renderHook(() => useUserPresence(mockOptions));

    act(() => {
      result.current.sendTypingStatus(true);
    });

    expect(userPresenceService.updateTypingStatus).toHaveBeenCalledWith(
      mockOptions.userId,
      mockOptions.username,
      true
    );
  });

  it('sendTypingStatus does not call service when disabled', () => {
    const { result } = renderHook(() => useUserPresence({ ...mockOptions, enabled: false }));

    act(() => {
      result.current.sendTypingStatus(true);
    });

    expect(userPresenceService.updateTypingStatus).not.toHaveBeenCalled();
  });

  it('sendPresenceUpdate calls service method when enabled', () => {
    const { result } = renderHook(() => useUserPresence(mockOptions));

    act(() => {
      result.current.sendPresenceUpdate();
    });

    expect(userPresenceService.sendPresenceUpdate).toHaveBeenCalled();
  });

  it('sendPresenceUpdate does not call service when disabled', () => {
    const { result } = renderHook(() => useUserPresence({ ...mockOptions, enabled: false }));

    act(() => {
      result.current.sendPresenceUpdate();
    });

    expect(userPresenceService.sendPresenceUpdate).not.toHaveBeenCalled();
  });

  it('updates state when service events are triggered', () => {
    const mockActivities = new Map();
    const mockTypingUsers: any[] = [];
    const mockActiveUsers: any[] = [];

    vi.mocked(userPresenceService.getActivities).mockReturnValue(mockActivities);
    vi.mocked(userPresenceService.getTypingUsers).mockReturnValue(mockTypingUsers);
    vi.mocked(userPresenceService.getActiveUsers).mockReturnValue(mockActiveUsers);

    let eventCallback: Function | undefined;
    vi.mocked(userPresenceService.on).mockImplementation((event, callback) => {
      if (event === 'typing:changed') {
        eventCallback = callback;
      }
    });

    const { result } = renderHook(() => useUserPresence(mockOptions));

    // Simulate event trigger
    if (eventCallback) {
      act(() => {
        eventCallback();
      });
    }

    expect(userPresenceService.getActivities).toHaveBeenCalled();
    expect(userPresenceService.getTypingUsers).toHaveBeenCalled();
    expect(userPresenceService.getActiveUsers).toHaveBeenCalled();
  });
});