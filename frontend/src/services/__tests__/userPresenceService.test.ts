import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { userPresenceService } from '../userPresenceService';
import { socketService } from '../socketService';

// Mock socket service
vi.mock('../socketService', () => ({
  socketService: {
    isConnected: vi.fn(() => true),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

// Mock DOM methods
Object.defineProperty(document, 'addEventListener', {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(document, 'removeEventListener', {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(window, 'addEventListener', {
  value: vi.fn(),
  writable: true,
});

Object.defineProperty(window, 'removeEventListener', {
  value: vi.fn(),
  writable: true,
});

describe('UserPresenceService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    userPresenceService.cleanup();
  });

  afterEach(() => {
    vi.useRealTimers();
    userPresenceService.cleanup();
  });

  describe('initialization', () => {
    it('initializes with room and user data', () => {
      userPresenceService.initialize('room1', 'user1', 'Test User');

      expect(socketService.emit).toHaveBeenCalledWith('presence:update', {
        roomId: 'room1',
        userId: 'user1',
        username: 'Test User',
        isActive: true,
        isFocused: true,
        lastActivity: expect.any(Date),
      });
    });

    it('sets up activity tracking event listeners', () => {
      userPresenceService.initialize('room1', 'user1', 'Test User');

      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      activityEvents.forEach(event => {
        expect(document.addEventListener).toHaveBeenCalledWith(
          event,
          expect.any(Function),
          { passive: true }
        );
      });

      expect(window.addEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(window.addEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
    });

    it('starts activity monitoring interval', () => {
      userPresenceService.initialize('room1', 'user1', 'Test User');

      // Fast-forward time to trigger interval
      vi.advanceTimersByTime(30000);

      expect(socketService.emit).toHaveBeenCalledWith('presence:update', expect.any(Object));
    });
  });

  describe('cleanup', () => {
    it('removes event listeners and clears data', () => {
      userPresenceService.initialize('room1', 'user1', 'Test User');
      userPresenceService.cleanup();

      const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
      activityEvents.forEach(event => {
        expect(document.removeEventListener).toHaveBeenCalledWith(
          event,
          expect.any(Function)
        );
      });

      expect(window.removeEventListener).toHaveBeenCalledWith('focus', expect.any(Function));
      expect(window.removeEventListener).toHaveBeenCalledWith('blur', expect.any(Function));
    });
  });

  describe('typing status management', () => {
    beforeEach(() => {
      userPresenceService.initialize('room1', 'user1', 'Test User');
    });

    it('updates typing status for user', () => {
      userPresenceService.updateTypingStatus('user2', 'User 2', true);

      const activities = userPresenceService.getActivities();
      const user2Activity = activities.get('user2');

      expect(user2Activity).toBeDefined();
      expect(user2Activity?.isTyping).toBe(true);
      expect(user2Activity?.username).toBe('User 2');
    });

    it('automatically clears typing status after timeout', () => {
      userPresenceService.updateTypingStatus('user2', 'User 2', true);

      // Fast-forward past typing timeout
      vi.advanceTimersByTime(3500);

      const activities = userPresenceService.getActivities();
      const user2Activity = activities.get('user2');

      expect(user2Activity?.isTyping).toBe(false);
    });

    it('clears typing timeout when explicitly set to false', () => {
      userPresenceService.updateTypingStatus('user2', 'User 2', true);
      userPresenceService.updateTypingStatus('user2', 'User 2', false);

      const activities = userPresenceService.getActivities();
      const user2Activity = activities.get('user2');

      expect(user2Activity?.isTyping).toBe(false);
    });

    it('returns typing users correctly', () => {
      userPresenceService.updateTypingStatus('user2', 'User 2', true);
      userPresenceService.updateTypingStatus('user3', 'User 3', false);

      const typingUsers = userPresenceService.getTypingUsers();

      expect(typingUsers).toHaveLength(1);
      expect(typingUsers[0].userId).toBe('user2');
      expect(typingUsers[0].isTyping).toBe(true);
    });
  });

  describe('focus status management', () => {
    beforeEach(() => {
      userPresenceService.initialize('room1', 'user1', 'Test User');
    });

    it('updates focus status for user', () => {
      userPresenceService.updateFocusStatus('user2', 'User 2', false);

      const activities = userPresenceService.getActivities();
      const user2Activity = activities.get('user2');

      expect(user2Activity?.isFocused).toBe(false);
    });
  });

  describe('activity tracking', () => {
    beforeEach(() => {
      userPresenceService.initialize('room1', 'user1', 'Test User');
    });

    it('updates user activity', () => {
      const initialTime = Date.now();
      vi.setSystemTime(initialTime);

      userPresenceService.updateActivity('user2', 'User 2');

      const activities = userPresenceService.getActivities();
      const user2Activity = activities.get('user2');

      expect(user2Activity?.isActive).toBe(true);
      expect(user2Activity?.lastActivity.getTime()).toBe(initialTime);
    });

    it('marks users as idle after timeout', () => {
      userPresenceService.updateActivity('user2', 'User 2');

      // Fast-forward past idle timeout (5 minutes)
      vi.advanceTimersByTime(6 * 60 * 1000);

      const isIdle = userPresenceService.isUserIdle('user2');
      expect(isIdle).toBe(true);
    });

    it('returns active users correctly', () => {
      userPresenceService.updateActivity('user2', 'User 2');
      userPresenceService.updateActivity('user3', 'User 3');

      // Make user3 idle
      vi.advanceTimersByTime(6 * 60 * 1000);
      userPresenceService.updateActivity('user2', 'User 2'); // Keep user2 active

      const activeUsers = userPresenceService.getActiveUsers();

      expect(activeUsers).toHaveLength(1);
      expect(activeUsers[0].userId).toBe('user2');
    });
  });

  describe('presence updates', () => {
    beforeEach(() => {
      userPresenceService.initialize('room1', 'user1', 'Test User');
    });

    it('sends presence update when connected', () => {
      vi.mocked(socketService.isConnected).mockReturnValue(true);

      userPresenceService.sendPresenceUpdate();

      expect(socketService.emit).toHaveBeenCalledWith('presence:update', {
        roomId: 'room1',
        userId: 'user1',
        username: 'Test User',
        isActive: true,
        isFocused: true,
        lastActivity: expect.any(Date),
      });
    });

    it('does not send presence update when disconnected', () => {
      vi.mocked(socketService.isConnected).mockReturnValue(false);
      vi.clearAllMocks();

      userPresenceService.sendPresenceUpdate();

      expect(socketService.emit).not.toHaveBeenCalled();
    });
  });

  describe('event handling', () => {
    it('sets up socket event listeners', () => {
      userPresenceService.initialize('room1', 'user1', 'Test User');

      expect(socketService.on).toHaveBeenCalledWith('typing:status', expect.any(Function));
      expect(socketService.on).toHaveBeenCalledWith('presence:update', expect.any(Function));
      expect(socketService.on).toHaveBeenCalledWith('room:user-joined', expect.any(Function));
      expect(socketService.on).toHaveBeenCalledWith('room:user-left', expect.any(Function));
    });

    it('emits custom events to listeners', () => {
      const mockCallback = vi.fn();
      userPresenceService.on('typing:changed', mockCallback);

      userPresenceService.updateTypingStatus('user2', 'User 2', true);

      expect(mockCallback).toHaveBeenCalledWith({
        userId: 'user2',
        username: 'User 2',
        isTyping: true,
      });
    });

    it('removes event listeners', () => {
      const mockCallback = vi.fn();
      userPresenceService.on('typing:changed', mockCallback);
      userPresenceService.off('typing:changed', mockCallback);

      userPresenceService.updateTypingStatus('user2', 'User 2', true);

      expect(mockCallback).not.toHaveBeenCalled();
    });
  });

  describe('configuration', () => {
    it('accepts custom configuration options', () => {
      const customService = new (userPresenceService.constructor as any)({
        idleTimeout: 10000,
        typingTimeout: 1000,
        activityCheckInterval: 5000,
      });

      expect(customService).toBeDefined();
    });
  });
});