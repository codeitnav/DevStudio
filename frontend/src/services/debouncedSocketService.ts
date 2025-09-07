import { socketService } from './socketService';
import type { CursorPosition } from '../types/editor';

interface DebouncedUpdate {
  type: 'cursor' | 'typing' | 'code' | 'language';
  data: any;
  roomId: string;
  timestamp: number;
}

class DebouncedSocketService {
  private updateQueue: Map<string, DebouncedUpdate> = new Map();
  private timeouts: Map<string, NodeJS.Timeout> = new Map();
  private readonly delays = {
    cursor: 50,      // 50ms for cursor updates
    typing: 200,     // 200ms for typing indicators
    code: 300,       // 300ms for code changes
    language: 0,     // Immediate for language changes
  };

  private scheduleUpdate(key: string, update: DebouncedUpdate) {
    // Clear existing timeout for this key
    const existingTimeout = this.timeouts.get(key);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    // Store the latest update
    this.updateQueue.set(key, update);

    const delay = this.delays[update.type];
    
    if (delay === 0) {
      // Send immediately
      this.executeUpdate(update);
      this.updateQueue.delete(key);
      this.timeouts.delete(key);
    } else {
      // Schedule debounced update
      const timeout = setTimeout(() => {
        const queuedUpdate = this.updateQueue.get(key);
        if (queuedUpdate) {
          this.executeUpdate(queuedUpdate);
          this.updateQueue.delete(key);
          this.timeouts.delete(key);
        }
      }, delay);

      this.timeouts.set(key, timeout);
    }
  }

  private executeUpdate(update: DebouncedUpdate) {
    switch (update.type) {
      case 'cursor':
        socketService.sendCursorUpdate(update.roomId, update.data);
        break;
      case 'typing':
        socketService.sendTypingStatus(update.roomId, update.data);
        break;
      case 'code':
        socketService.sendCodeChange(update.roomId, update.data.code, update.data.delta);
        break;
      case 'language':
        socketService.sendLanguageChange(update.roomId, update.data);
        break;
    }
  }

  sendCursorUpdate(roomId: string, position: CursorPosition) {
    const key = `cursor-${roomId}`;
    this.scheduleUpdate(key, {
      type: 'cursor',
      data: position,
      roomId,
      timestamp: Date.now(),
    });
  }

  sendTypingStatus(roomId: string, isTyping: boolean) {
    const key = `typing-${roomId}`;
    this.scheduleUpdate(key, {
      type: 'typing',
      data: isTyping,
      roomId,
      timestamp: Date.now(),
    });
  }

  sendCodeChange(roomId: string, code: string, delta: any) {
    const key = `code-${roomId}`;
    this.scheduleUpdate(key, {
      type: 'code',
      data: { code, delta },
      roomId,
      timestamp: Date.now(),
    });
  }

  sendLanguageChange(roomId: string, language: string) {
    const key = `language-${roomId}`;
    this.scheduleUpdate(key, {
      type: 'language',
      data: language,
      roomId,
      timestamp: Date.now(),
    });
  }

  // Flush all pending updates immediately
  flush() {
    this.updateQueue.forEach((update, key) => {
      const timeout = this.timeouts.get(key);
      if (timeout) {
        clearTimeout(timeout);
      }
      this.executeUpdate(update);
    });
    
    this.updateQueue.clear();
    this.timeouts.clear();
  }

  // Clean up resources
  destroy() {
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.updateQueue.clear();
    this.timeouts.clear();
  }
}

export const debouncedSocketService = new DebouncedSocketService();
export default debouncedSocketService;