// User-related type definitions

export interface User {
  id: string;
  email: string;
  username: string;
  createdAt: Date;
  lastLogin?: Date;
  isActive: boolean;
  avatar?: string;
  preferences?: UserPreferences;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  editorSettings: EditorSettings;
  notifications: NotificationSettings;
}

export interface EditorSettings {
  fontSize: number;
  fontFamily: string;
  tabSize: number;
  wordWrap: boolean;
  minimap: boolean;
  lineNumbers: boolean;
  autoSave: boolean;
  autoSaveDelay: number;
}

export interface NotificationSettings {
  emailNotifications: boolean;
  pushNotifications: boolean;
  soundEnabled: boolean;
}

export interface GuestUser {
  id: string;
  username: string;
  userType: 'guest';
  sessionId: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  username: string;
  password: string;
  confirmPassword: string;
}

export interface ProfileData {
  username?: string;
  email?: string;
  avatar?: string;
  preferences?: Partial<UserPreferences>;
}

export interface AccountDeactivationData {
  password: string;
  reason?: string;
  feedback?: string;
}

export interface DataExportRequest {
  includeProfile: boolean;
  includeRooms: boolean;
  includeFiles: boolean;
  format: 'json' | 'csv';
}

export interface PasswordChangeData {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

export interface AuthResponse {
  user: User;
  token: string;
  refreshToken: string;
}

export type UserType = 'user' | 'guest';