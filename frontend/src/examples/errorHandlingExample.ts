import { handleAsyncOperation, createErrorHandler } from '../utils/errorHandler';
import { useApiCall, useFileOperation, useMultipleLoadingStates } from '../hooks/useLoadingState';
import { useToast } from '../contexts/ToastContext';
import { authService } from '../services/authService';
import { roomService } from '../services/roomService';
import { fileService } from '../services/fileService';

// Example 1: Using error handler with existing services
export const loginWithErrorHandling = async (email: string, password: string) => {
  return handleAsyncOperation(
    () => authService.login({ email, password }),
    {
      context: 'User Login',
      fallbackMessage: 'Login failed. Please check your credentials.',
      retryConfig: 'api',
    }
  );
};

// Example 2: Using loading state hook with API calls
export const useLoginForm = () => {
  const { execute, isLoading, error } = useApiCall();
  const { showSuccess } = useToast();

  const login = async (email: string, password: string) => {
    const result = await execute(() => authService.login({ email, password }));
    if (result) {
      showSuccess('Login successful', 'Welcome back!');
    }
    return result;
  };

  return { login, isLoading, error };
};

// Example 3: Context-specific error handler
export const roomErrorHandler = createErrorHandler('Room Management', {
  showToast: true,
});

export const createRoomWithErrorHandling = async (roomData: any) => {
  return roomErrorHandler.handleAsyncOperation(
    () => roomService.createRoom(roomData),
    {
      fallbackMessage: 'Failed to create room. Please try again.',
    }
  );
};

// Example 4: Multiple operations with loading states
export const useRoomOperations = () => {
  const { executeWithKey, loadingStates, errors } = useMultipleLoadingStates();

  const createRoom = (roomData: any) =>
    executeWithKey('createRoom', () => roomService.createRoom(roomData));

  const joinRoom = (roomId: string, password?: string) =>
    executeWithKey('joinRoom', () => roomService.joinRoom(roomId, password));

  const leaveRoom = (roomId: string) =>
    executeWithKey('leaveRoom', () => roomService.leaveRoom(roomId));

  return {
    createRoom,
    joinRoom,
    leaveRoom,
    isCreatingRoom: loadingStates.createRoom || false,
    isJoiningRoom: loadingStates.joinRoom || false,
    isLeavingRoom: loadingStates.leaveRoom || false,
    createRoomError: errors.createRoom,
    joinRoomError: errors.joinRoom,
    leaveRoomError: errors.leaveRoom,
  };
};

// Example 5: File operations with specific error handling
export const useFileOperationsWithErrorHandling = () => {
  const { execute, isLoading, error } = useFileOperation();
  const { showSuccess, showError } = useToast();

  const createFile = async (roomId: string, fileData: any) => {
    try {
      const result = await execute(() => fileService.createFile(roomId, fileData));
      if (result) {
        showSuccess('File created', `${fileData.name} has been created successfully.`);
      }
      return result;
    } catch (err) {
      showError('File creation failed', 'Unable to create the file. Please try again.');
      throw err;
    }
  };

  return { createFile, isLoading, error };
};