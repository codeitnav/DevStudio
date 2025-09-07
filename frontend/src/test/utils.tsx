import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from '../contexts/AuthContext';
import { ToastProvider } from '../contexts/ToastContext';
import { vi } from 'vitest';
import type { User } from '../types';

// Mock user data for testing
export const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  username: 'testuser',
  createdAt: new Date('2024-01-01'),
  lastLogin: new Date('2024-01-02'),
  isActive: true,
};

export const mockGuestUser = {
  id: 'guest-1',
  username: 'Guest User',
  userType: 'guest' as const,
  sessionId: 'session-123',
};

// Mock room data
export const mockRoom = {
  id: 'room-1',
  name: 'Test Room',
  description: 'A test room for development',
  ownerId: '1',
  isPublic: true,
  hasPassword: false,
  maxMembers: 10,
  currentMembers: 2,
  language: 'javascript',
  createdAt: new Date('2024-01-01'),
  lastActivity: new Date('2024-01-02'),
};

// Mock file system data
export const mockFile = {
  id: 'file-1',
  name: 'test.js',
  path: '/test.js',
  type: 'file' as const,
  language: 'javascript',
  content: 'console.log("Hello, World!");',
  size: 28,
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

export const mockFolder = {
  id: 'folder-1',
  name: 'src',
  path: '/src',
  type: 'folder' as const,
  children: [mockFile],
  createdAt: new Date('2024-01-01'),
  updatedAt: new Date('2024-01-02'),
};

// Test wrapper component
interface AllTheProvidersProps {
  children: React.ReactNode;
  queryClient?: QueryClient;
}

const AllTheProviders: React.FC<AllTheProvidersProps> = ({ 
  children, 
  queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  }),
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <ToastProvider>
            {children}
          </ToastProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

// Custom render function
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  queryClient?: QueryClient;
}

const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  const { queryClient, ...renderOptions } = options;
  
  return render(ui, {
    wrapper: ({ children }) => (
      <AllTheProviders queryClient={queryClient}>
        {children}
      </AllTheProviders>
    ),
    ...renderOptions,
  });
};

// Mock API responses
export const mockApiResponse = {
  success: <T extends unknown>(data: T) => ({
    success: true,
    data,
  }),
  error: (message: string, code?: string) => ({
    success: false,
    error: {
      message,
      code,
    },
  }),
};

// Mock Socket.io events
export const mockSocketEvents = {
  connect: 'connect',
  disconnect: 'disconnect',
  error: 'error',
  roomJoined: 'room:joined',
  roomLeft: 'room:left',
  userJoined: 'user:joined',
  userLeft: 'user:left',
  codeChange: 'code:change',
  cursorMove: 'cursor:move',
  typing: 'typing',
  fileCreated: 'file:created',
  fileDeleted: 'file:deleted',
  fileRenamed: 'file:renamed',
};

// Helper to create mock socket
export const createMockSocket = () => ({
  connect: vi.fn(),
  disconnect: vi.fn(),
  emit: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  connected: false,
  id: 'mock-socket-id',
});

// Helper to create mock editor
export const createMockEditor = () => ({
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
});

// Helper to wait for async operations
export const waitForAsync = () => new Promise(resolve => setTimeout(resolve, 0));

// Helper to simulate user typing
export const simulateTyping = async (element: HTMLElement, text: string) => {
  const { fireEvent } = await import('@testing-library/react');
  
  for (let i = 0; i < text.length; i++) {
    fireEvent.change(element, {
      target: { value: text.slice(0, i + 1) },
    });
    await waitForAsync();
  }
};

// Helper to create mock HTTP responses
export const createMockHttpResponse = <T extends unknown>(data: T, status = 200) => ({
  ok: status >= 200 && status < 300,
  status,
  json: () => Promise.resolve(data),
  text: () => Promise.resolve(JSON.stringify(data)),
});

// Re-export everything from testing library
export * from '@testing-library/react';
export { customRender as render };