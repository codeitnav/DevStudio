import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debouncedSocketService } from '../debouncedSocketService';
import { socketService } from '../socketService';

// Mock the socket service
vi.mock('../socketService', () => ({
  socketService: {
    sendCursorUpdate: vi.fn(),
    sendTypingStatus: vi.fn(),
    sendCodeChange: vi.fn(),
    sendLanguageChange: vi.fn(),
  },
}));

const mockSocketService = vi.mocked(socketService);

describe('DebouncedSocketService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    debouncedSocketService.destroy();
  });

  describe('sendCursorUpdate', () => {
    it('should debounce cursor updates', () => {
      const roomId = 'room-1';
      const position1 = { line: 1, column: 1 };
      const position2 = { line: 1, column: 2 };
      const position3 = { line: 1, column: 3 };

      // Send multiple cursor updates rapidly
      debouncedSocketService.sendCursorUpdate(roomId, position1);
      debouncedSocketService.sendCursorUpdate(roomId, position2);
      debouncedSocketService.sendCursorUpdate(roomId, position3);

      // Should not have called the socket service yet
      expect(mockSocketService.sendCursorUpdate).not.toHaveBeenCalled();

      // Fast-forward time by 50ms (cursor delay)
      vi.advanceTimersByTime(50);

      // Should have called with the latest position only
      expect(mockSocketService.sendCursorUpdate).toHaveBeenCalledTimes(1);
      expect(mockSocketService.sendCursorUpdate).toHaveBeenCalledWith(roomId, position3);
    });

    it('should handle cursor updates for different rooms separately', () => {
      const room1 = 'room-1';
      const room2 = 'room-2';
      const position1 = { line: 1, column: 1 };
      const position2 = { line: 2, column: 2 };

      debouncedSocketService.sendCursorUpdate(room1, position1);
      debouncedSocketService.sendCursorUpdate(room2, position2);

      vi.advanceTimersByTime(50);

      expect(mockSocketService.sendCursorUpdate).toHaveBeenCalledTimes(2);
      expect(mockSocketService.sendCursorUpdate).toHaveBeenCalledWith(room1, position1);
      expect(mockSocketService.sendCursorUpdate).toHaveBeenCalledWith(room2, position2);
    });
  });

  describe('sendTypingStatus', () => {
    it('should debounce typing status updates', () => {
      const roomId = 'room-1';

      debouncedSocketService.sendTypingStatus(roomId, true);
      debouncedSocketService.sendTypingStatus(roomId, false);
      debouncedSocketService.sendTypingStatus(roomId, true);

      expect(mockSocketService.sendTypingStatus).not.toHaveBeenCalled();

      vi.advanceTimersByTime(200);

      expect(mockSocketService.sendTypingStatus).toHaveBeenCalledTimes(1);
      expect(mockSocketService.sendTypingStatus).toHaveBeenCalledWith(roomId, true);
    });
  });

  describe('sendCodeChange', () => {
    it('should debounce code changes', () => {
      const roomId = 'room-1';
      const code1 = 'console.log("hello");';
      const code2 = 'console.log("hello world");';
      const delta1 = { ops: [{ retain: 13, insert: ' world' }] };
      const delta2 = { ops: [{ retain: 19, insert: '!' }] };

      debouncedSocketService.sendCodeChange(roomId, code1, delta1);
      debouncedSocketService.sendCodeChange(roomId, code2, delta2);

      expect(mockSocketService.sendCodeChange).not.toHaveBeenCalled();

      vi.advanceTimersByTime(300);

      expect(mockSocketService.sendCodeChange).toHaveBeenCalledTimes(1);
      expect(mockSocketService.sendCodeChange).toHaveBeenCalledWith(roomId, code2, delta2);
    });
  });

  describe('sendLanguageChange', () => {
    it('should send language changes immediately', () => {
      const roomId = 'room-1';
      const language = 'typescript';

      debouncedSocketService.sendLanguageChange(roomId, language);

      // Should be called immediately without waiting
      expect(mockSocketService.sendLanguageChange).toHaveBeenCalledTimes(1);
      expect(mockSocketService.sendLanguageChange).toHaveBeenCalledWith(roomId, language);
    });

    it('should not debounce language changes', () => {
      const roomId = 'room-1';

      debouncedSocketService.sendLanguageChange(roomId, 'javascript');
      debouncedSocketService.sendLanguageChange(roomId, 'typescript');
      debouncedSocketService.sendLanguageChange(roomId, 'python');

      expect(mockSocketService.sendLanguageChange).toHaveBeenCalledTimes(3);
    });
  });

  describe('flush', () => {
    it('should immediately send all pending updates', () => {
      const roomId = 'room-1';
      const position = { line: 1, column: 1 };
      const code = 'console.log("test");';
      const delta = { ops: [{ insert: 'test' }] };

      debouncedSocketService.sendCursorUpdate(roomId, position);
      debouncedSocketService.sendTypingStatus(roomId, true);
      debouncedSocketService.sendCodeChange(roomId, code, delta);

      // Nothing should be sent yet
      expect(mockSocketService.sendCursorUpdate).not.toHaveBeenCalled();
      expect(mockSocketService.sendTypingStatus).not.toHaveBeenCalled();
      expect(mockSocketService.sendCodeChange).not.toHaveBeenCalled();

      // Flush all updates
      debouncedSocketService.flush();

      // All updates should be sent immediately
      expect(mockSocketService.sendCursorUpdate).toHaveBeenCalledWith(roomId, position);
      expect(mockSocketService.sendTypingStatus).toHaveBeenCalledWith(roomId, true);
      expect(mockSocketService.sendCodeChange).toHaveBeenCalledWith(roomId, code, delta);
    });

    it('should clear all pending timeouts after flush', () => {
      const roomId = 'room-1';
      const position = { line: 1, column: 1 };

      debouncedSocketService.sendCursorUpdate(roomId, position);
      debouncedSocketService.flush();

      // Advancing time should not trigger any more calls
      vi.advanceTimersByTime(1000);
      expect(mockSocketService.sendCursorUpdate).toHaveBeenCalledTimes(1);
    });
  });

  describe('destroy', () => {
    it('should clear all timeouts and queues', () => {
      const roomId = 'room-1';
      const position = { line: 1, column: 1 };

      debouncedSocketService.sendCursorUpdate(roomId, position);
      debouncedSocketService.destroy();

      // Advancing time should not trigger any calls
      vi.advanceTimersByTime(1000);
      expect(mockSocketService.sendCursorUpdate).not.toHaveBeenCalled();
    });
  });

  describe('multiple rapid updates', () => {
    it('should only send the latest update for each type', () => {
      const roomId = 'room-1';

      // Send multiple rapid updates of different types
      for (let i = 0; i < 10; i++) {
        debouncedSocketService.sendCursorUpdate(roomId, { line: i, column: i });
        debouncedSocketService.sendTypingStatus(roomId, i % 2 === 0);
        debouncedSocketService.sendCodeChange(roomId, `code-${i}`, { ops: [{ insert: i.toString() }] });
      }

      // Fast-forward past all delays
      vi.advanceTimersByTime(500);

      // Should only have called each method once with the latest values
      expect(mockSocketService.sendCursorUpdate).toHaveBeenCalledTimes(1);
      expect(mockSocketService.sendCursorUpdate).toHaveBeenCalledWith(roomId, { line: 9, column: 9 });

      expect(mockSocketService.sendTypingStatus).toHaveBeenCalledTimes(1);
      expect(mockSocketService.sendTypingStatus).toHaveBeenCalledWith(roomId, false); // 9 % 2 === 1, so false

      expect(mockSocketService.sendCodeChange).toHaveBeenCalledTimes(1);
      expect(mockSocketService.sendCodeChange).toHaveBeenCalledWith(roomId, 'code-9', { ops: [{ insert: '9' }] });
    });
  });
});