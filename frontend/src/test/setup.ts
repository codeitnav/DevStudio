import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock localStorage
Object.defineProperty(window, 'localStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock sessionStorage
Object.defineProperty(window, 'sessionStorage', {
  value: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
  },
  writable: true,
});

// Mock environment variables
Object.defineProperty(import.meta, 'env', {
  value: {
    VITE_API_URL: 'http://localhost:5000/api',
    VITE_SOCKET_URL: 'http://localhost:5000',
    VITE_APP_NAME: 'DevStudio',
  },
  writable: true,
});

// Mock ResizeObserver
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock URL.createObjectURL
global.URL.createObjectURL = vi.fn(() => 'mocked-url');
global.URL.revokeObjectURL = vi.fn();

// Mock fetch
global.fetch = vi.fn();

// Mock WebSocket
const MockWebSocket = vi.fn().mockImplementation((url: string, protocols?: string | string[]) => ({
  url,
  protocols,
  close: vi.fn(),
  send: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  dispatchEvent: vi.fn(),
  readyState: 0, // CONNECTING
  onopen: null,
  onclose: null,
  onmessage: null,
  onerror: null,
  bufferedAmount: 0,
  extensions: '',
  protocol: '',
  binaryType: 'blob' as BinaryType,
}));

(MockWebSocket as any).CONNECTING = 0;
(MockWebSocket as any).OPEN = 1;
(MockWebSocket as any).CLOSING = 2;
(MockWebSocket as any).CLOSED = 3;

global.WebSocket = MockWebSocket as any;

// Mock Monaco Editor
vi.mock('@monaco-editor/react', () => ({
  default: vi.fn(({ onMount }) => {
    // Simulate editor mount
    if (onMount) {
      const mockEditor = {
        getValue: vi.fn(() => ''),
        setValue: vi.fn(),
        getModel: vi.fn(() => ({
          onDidChangeContent: vi.fn(),
          dispose: vi.fn(),
        })),
        dispose: vi.fn(),
        focus: vi.fn(),
        setPosition: vi.fn(),
        getPosition: vi.fn(() => ({ lineNumber: 1, column: 1 })),
        setSelection: vi.fn(),
        getSelection: vi.fn(),
        onDidChangeCursorPosition: vi.fn(),
        onDidChangeModelContent: vi.fn(),
      };
      onMount(mockEditor, {});
    }
    return null;
  }),
}));

// Mock Yjs
vi.mock('yjs', () => ({
  Doc: vi.fn().mockImplementation(() => ({
    getText: vi.fn(() => ({
      toString: vi.fn(() => ''),
      observe: vi.fn(),
      unobserve: vi.fn(),
      insert: vi.fn(),
      delete: vi.fn(),
    })),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

// Mock y-websocket
vi.mock('y-websocket', () => ({
  WebsocketProvider: vi.fn().mockImplementation(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    destroy: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  })),
}));

// Mock Socket.io client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    connect: vi.fn(),
    disconnect: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    connected: false,
    id: 'mock-socket-id',
  })),
}));