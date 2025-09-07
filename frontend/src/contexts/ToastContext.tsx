import React, { createContext, useContext, useState, ReactNode } from 'react';
import { ToastData } from '../components/ui/Toast';
import { ToastContainer } from '../components/ui/ToastContainer';
import { AppError, ErrorType } from '../types/error';

interface ToastContextType {
  showToast: (toast: Omit<ToastData, 'id'>) => void;
  showSuccess: (title: string, message?: string, duration?: number) => void;
  showError: (title: string, message?: string, duration?: number) => void;
  showWarning: (title: string, message?: string, duration?: number) => void;
  showInfo: (title: string, message?: string, duration?: number) => void;
  showErrorFromAppError: (error: AppError, duration?: number) => void;
  removeToast: (id: string) => void;
  clearAllToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

interface ToastProviderProps {
  children: ReactNode;
}

export const ToastProvider: React.FC<ToastProviderProps> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const generateId = () => {
    return `toast-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  };

  const showToast = (toast: Omit<ToastData, 'id'>) => {
    const newToast: ToastData = {
      ...toast,
      id: generateId(),
      duration: toast.duration ?? 5000, // Default 5 seconds
    };

    setToasts(prev => [...prev, newToast]);
  };

  const showSuccess = (title: string, message?: string, duration?: number) => {
    showToast({
      type: 'success',
      title,
      message,
      duration,
    });
  };

  const showError = (title: string, message?: string, duration?: number) => {
    showToast({
      type: 'error',
      title,
      message,
      duration: duration ?? 8000, // Errors stay longer by default
    });
  };

  const showWarning = (title: string, message?: string, duration?: number) => {
    showToast({
      type: 'warning',
      title,
      message,
      duration,
    });
  };

  const showInfo = (title: string, message?: string, duration?: number) => {
    showToast({
      type: 'info',
      title,
      message,
      duration,
    });
  };

  const showErrorFromAppError = (error: AppError, duration?: number) => {
    const getErrorTitle = (errorType: ErrorType): string => {
      switch (errorType) {
        case ErrorType.AUTHENTICATION_ERROR:
          return 'Authentication Error';
        case ErrorType.NETWORK_ERROR:
          return 'Network Error';
        case ErrorType.ROOM_ACCESS_ERROR:
          return 'Room Access Error';
        case ErrorType.FILE_OPERATION_ERROR:
          return 'File Operation Error';
        case ErrorType.COLLABORATION_ERROR:
          return 'Collaboration Error';
        case ErrorType.VALIDATION_ERROR:
          return 'Validation Error';
        case ErrorType.SOCKET_ERROR:
          return 'Connection Error';
        default:
          return 'Error';
      }
    };

    showError(
      getErrorTitle(error.type),
      error.message,
      duration
    );
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const clearAllToasts = () => {
    setToasts([]);
  };

  const contextValue: ToastContextType = {
    showToast,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showErrorFromAppError,
    removeToast,
    clearAllToasts,
  };

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </ToastContext.Provider>
  );
};

export const useToast = (): ToastContextType => {
  const context = useContext(ToastContext);
  if (context === undefined) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
};