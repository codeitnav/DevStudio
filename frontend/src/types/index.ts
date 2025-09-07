// Main types export file

// User types
export type {
  User,
  GuestUser,
  LoginCredentials,
  RegisterData,
  ProfileData,
  PasswordChangeData,
  AuthResponse,
  UserType
} from './user';

// Room types
export type {
  Room,
  RoomMember,
  CreateRoomData,
  RoomJoinResponse,
  RoomSettings,
  RoomRole
} from './room';

// File system types
export type {
  FileSystemItem,
  File,
  Folder,
  CreateFileData,
  CreateFolderData,
  FileSystemItemType
} from './file';

// Editor and collaboration types
export type {
  CursorPosition,
  TextSelection,
  CollaborativeUser,
  EditorChange,
  EditorState,
  TypingIndicator
} from './editor';

// Error types
export {
  ErrorType
} from './error';

export type {
  AppError,
  ValidationError,
  ApiErrorResponse
} from './error';

// API types
export type {
  ApiResponse,
  PaginatedResponse,
  ApiSuccessResponse,
  ApiErrorResponse as ApiError,
  HttpMethod,
  RequestConfig
} from './api';

// Socket types
export type {
  ConnectionStatus,
  SocketEvents,
  SocketError,
  SocketConnectionOptions,
  RoomJoinData,
  YjsUpdateData,
  CursorUpdateData,
  CodeChangeData,
  LanguageChangeData,
  TypingStatusData
} from './socket';

// Service interfaces
export type {
  AuthService,
  RoomService,
  SocketService,
  FileService,
  PresenceService
} from './services';

// Common utility types
export type {
  Optional,
  RequiredFields,
  LoadingState,
  Theme,
  SupportedLanguage,
  SocketEvent,
  Notification
} from './common';

export {
  ConnectionStatus as CommonConnectionStatus
} from './common';