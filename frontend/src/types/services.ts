// Service interface definitions

import type { 
  User, 
  LoginCredentials, 
  RegisterData, 
  ProfileData, 
  PasswordChangeData, 
  AuthResponse,
  AccountDeactivationData,
  DataExportRequest
} from './user';
import type { 
  Room, 
  RoomMember, 
  CreateRoomData, 
  RoomJoinResponse, 
  RoomSettings,
  RoomRole,
  MemberInvitation,
  RoomExportData
} from './room';
import type { 
  File as CustomFile, 
  Folder, 
  CreateFileData, 
  CreateFolderData 
} from './file';
import type { CursorPosition } from './editor';

// Authentication Service Interface
export interface AuthService {
  login(credentials: LoginCredentials): Promise<AuthResponse>;
  register(userData: RegisterData): Promise<AuthResponse>;
  logout(): Promise<void>;
  forgotPassword(email: string): Promise<void>;
  resetPassword(token: string, password: string): Promise<AuthResponse>;
  getCurrentUser(): Promise<User>;
  updateProfile(data: ProfileData): Promise<User>;
  changePassword(passwords: PasswordChangeData): Promise<void>;
  uploadAvatar(file: File): Promise<User>;
  deleteAvatar(): Promise<User>;
  deactivateAccount(data: AccountDeactivationData): Promise<void>;
  exportData(request: DataExportRequest): Promise<Blob>;
  refreshToken(): Promise<AuthResponse>;
  isAuthenticated(): boolean;
}

// Room Service Interface
export interface RoomService {
  createRoom(roomData: CreateRoomData): Promise<Room>;
  joinRoom(roomId: string, password?: string): Promise<RoomJoinResponse>;
  leaveRoom(roomId: string): Promise<void>;
  getRoomInfo(roomId: string): Promise<Room>;
  updateRoomSettings(roomId: string, settings: RoomSettings): Promise<Room>;
  getRoomMembers(roomId: string): Promise<RoomMember[]>;
  deleteRoom(roomId: string): Promise<void>;
  getUserRooms(): Promise<Room[]>;
  updateMemberRole(roomId: string, memberId: string, role: RoomRole): Promise<void>;
  removeMember(roomId: string, memberId: string): Promise<void>;
  inviteMember(roomId: string, invitation: MemberInvitation): Promise<void>;
  exportRoomData(roomId: string): Promise<RoomExportData>;
}

// Socket Service Interface
export interface SocketService {
  connect(token?: string): void;
  disconnect(): void;
  isConnected(): boolean;
  joinRoom(roomId: string, password?: string): void;
  leaveRoom(roomId: string): void;
  sendYjsUpdate(roomId: string, update: Uint8Array): void;
  sendCursorUpdate(roomId: string, position: CursorPosition): void;
  sendCodeChange(roomId: string, code: string, delta: any): void;
  sendLanguageChange(roomId: string, language: string): void;
  sendTypingStatus(roomId: string, isTyping: boolean): void;
  on(event: string, callback: Function): void;
  off(event: string, callback: Function): void;
  emit(event: string, ...args: any[]): void;
}

// File Service Interface
export interface FileService {
  createFile(roomId: string, fileData: CreateFileData): Promise<CustomFile>;
  createFolder(roomId: string, folderData: CreateFolderData): Promise<Folder>;
  renameItem(roomId: string, itemId: string, newName: string): Promise<void>;
  deleteItem(roomId: string, itemId: string): Promise<void>;
  getFileContent(roomId: string, fileId: string): Promise<string>;
  saveFileContent(roomId: string, fileId: string, content: string): Promise<void>;
  getFileTree(roomId: string): Promise<(CustomFile | Folder)[]>;
  moveItem(roomId: string, itemId: string, newParentId?: string): Promise<void>;
}

// Presence Service Interface
export interface PresenceService {
  updatePresence(roomId: string, isActive: boolean): void;
  getUserPresence(roomId: string): Promise<RoomMember[]>;
  subscribeToPresenceUpdates(roomId: string, callback: (members: RoomMember[]) => void): void;
  unsubscribeFromPresenceUpdates(roomId: string): void;
}