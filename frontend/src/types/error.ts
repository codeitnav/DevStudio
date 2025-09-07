// Error handling type definitions

export enum ErrorType {
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  ROOM_ACCESS_ERROR = 'ROOM_ACCESS_ERROR',
  FILE_OPERATION_ERROR = 'FILE_OPERATION_ERROR',
  COLLABORATION_ERROR = 'COLLABORATION_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  SOCKET_ERROR = 'SOCKET_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export interface AppError {
  type: ErrorType;
  message: string;
  code?: string;
  details?: any;
  timestamp?: Date;
}

export interface ValidationError {
  field: string;
  message: string;
  code?: string;
}

export interface ApiErrorResponse {
  error: {
    type: ErrorType;
    message: string;
    code?: string;
    details?: any;
    validationErrors?: ValidationError[];
  };
  timestamp: string;
  path?: string;
}