// Common utility types

// Generic utility types
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;
export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>;

// Loading states
export interface LoadingState {
  isLoading: boolean;
  error?: string | null;
}

// Connection states
export enum ConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// Theme types
export type Theme = 'light' | 'dark' | 'system';

// Language types for code editor
export type SupportedLanguage = 
  | 'javascript'
  | 'typescript'
  | 'python'
  | 'java'
  | 'cpp'
  | 'c'
  | 'csharp'
  | 'go'
  | 'rust'
  | 'php'
  | 'ruby'
  | 'html'
  | 'css'
  | 'json'
  | 'xml'
  | 'markdown'
  | 'yaml'
  | 'sql'
  | 'shell'
  | 'plaintext';

// Event types for real-time communication
export interface SocketEvent<T = any> {
  type: string;
  payload: T;
  timestamp: Date;
  userId?: string;
  roomId?: string;
}

// Notification types
export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
  timestamp: Date;
}