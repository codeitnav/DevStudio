import { vi } from 'vitest';

export interface MockSocket {
  connect: ReturnType<typeof vi.fn>;
  disconnect: ReturnType<typeof vi.fn>;
  emit: ReturnType<typeof vi.fn>;
  on: ReturnType<typeof vi.fn>;
  off: ReturnType<typeof vi.fn>;
  connected: boolean;
  id: string;
  eventHandlers: Map<string, Function[]>;
  
  // Add the helper methods to the interface
  emitEvent: (event: string, ...args: any[]) => void;
  setConnectionStatus: (connected: boolean) => void;
  emitError: (error: any) => void;
  reset: () => void;
}

export class SocketMock implements MockSocket {
  connect = vi.fn();
  disconnect = vi.fn();
  emit = vi.fn();
  on = vi.fn();
  off = vi.fn();
  connected = false;
  id = 'mock-socket-id';
  eventHandlers = new Map<string, Function[]>();

  constructor() {
    this.on.mockImplementation((event: string, handler: Function) => {
      if (!this.eventHandlers.has(event)) {
        this.eventHandlers.set(event, []);
      }
      this.eventHandlers.get(event)!.push(handler);
    });

    this.off.mockImplementation((event: string, handler?: Function) => {
      if (!handler) {
        this.eventHandlers.delete(event);
      } else {
        const handlers = this.eventHandlers.get(event);
        if (handlers) {
          const index = handlers.indexOf(handler);
          if (index > -1) {
            handlers.splice(index, 1);
          }
        }
      }
    });

    this.connect.mockImplementation(() => {
      this.connected = true;
      this.emitEvent('connect');
    });

    this.disconnect.mockImplementation(() => {
      this.connected = false;
      this.emitEvent('disconnect');
    });
  }

  // Helper method to emit events to registered handlers
  emitEvent(event: string, ...args: any[]) {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach(handler => handler(...args));
    }
  }

  // Helper method to simulate connection status changes
  setConnectionStatus(connected: boolean) {
    this.connected = connected;
    this.emitEvent(connected ? 'connect' : 'disconnect');
  }

  // Helper method to simulate errors
  emitError(error: any) {
    this.emitEvent('error', error);
  }

  // Reset all mocks
  reset() {
    this.connect.mockClear();
    this.disconnect.mockClear();
    this.emit.mockClear();
    this.on.mockClear();
    this.off.mockClear();
    this.eventHandlers.clear();
    this.connected = false;
  }
}

// Factory function to create a new socket mock
export const createSocketMock = (): MockSocket => new SocketMock();

// Mock the socket.io-client module
export const mockSocketIO = () => {
  const socketMock = createSocketMock();
  
  vi.mock('socket.io-client', () => ({
    io: vi.fn(() => socketMock),
  }));

  return socketMock;
};

// Helper to simulate real-time collaboration events
export const simulateCollaborationEvents = (socket: MockSocket) => {
  return {
    userJoined: (user: any) => socket.emitEvent('user:joined', user),
    userLeft: (userId: string) => socket.emitEvent('user:left', { userId }),
    codeChange: (change: any) => socket.emitEvent('code:change', change),
    cursorMove: (cursor: any) => socket.emitEvent('cursor:move', cursor),
    typing: (typing: any) => socket.emitEvent('typing', typing),
    fileCreated: (file: any) => socket.emitEvent('file:created', file),
    fileDeleted: (fileId: string) => socket.emitEvent('file:deleted', { fileId }),
    fileRenamed: (file: any) => socket.emitEvent('file:renamed', file),
    roomJoined: (room: any) => socket.emitEvent('room:joined', room),
    roomLeft: (roomId: string) => socket.emitEvent('room:left', { roomId }),
  };
};

// Helper to simulate connection issues
export const simulateConnectionIssues = (socket: MockSocket) => {
  return {
    disconnect: () => {
      socket.setConnectionStatus(false);
      socket.emitEvent('disconnect', 'transport close');
    },
    reconnect: () => {
      socket.setConnectionStatus(true);
      socket.emitEvent('reconnect', 1);
    },
    reconnectAttempt: (attemptNumber: number) => {
      socket.emitEvent('reconnect_attempt', attemptNumber);
    },
    reconnectError: (error: any) => {
      socket.emitEvent('reconnect_error', error);
    },
    error: (error: any) => {
      socket.emitError(error);
    },
  };
};
