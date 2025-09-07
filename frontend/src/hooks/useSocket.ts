import { useEffect, useState, useCallback, useRef } from 'react';
import { socketService } from '../services/socketService';
import type { ConnectionStatus, SocketError } from '../types';

interface UseSocketOptions {
  autoConnect?: boolean;
  token?: string;
}

interface UseSocketReturn {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  error: SocketError | null;
  connect: (token?: string) => void;
  disconnect: () => void;
  reconnectAttempts: number;
}

/**
 * Hook for managing Socket.io connection
 */
export function useSocket(options: UseSocketOptions = {}): UseSocketReturn {
  const { autoConnect = false, token } = options;
  
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [error, setError] = useState<SocketError | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  
  const hasConnectedRef = useRef(false);

  // Connection status handler
  const handleConnectionStatus = useCallback((status: ConnectionStatus) => {
    setConnectionStatus(status);
    setIsConnected(status === 'connected');
    
    // Clear error when successfully connected
    if (status === 'connected') {
      setError(null);
    }
  }, []);

  // Error handler
  const handleError = useCallback((socketError: SocketError) => {
    setError(socketError);
  }, []);

  // Reconnect attempt handler
  const handleReconnectAttempt = useCallback((attemptNumber: number) => {
    setReconnectAttempts(attemptNumber);
  }, []);

  // Connect function
  const connect = useCallback((connectToken?: string) => {
    const authToken = connectToken || token;
    socketService.connect(authToken);
    hasConnectedRef.current = true;
  }, [token]);

  // Disconnect function
  const disconnect = useCallback(() => {
    socketService.disconnect();
    hasConnectedRef.current = false;
  }, []);

  // Setup event listeners
  useEffect(() => {
    // Add event listeners
    socketService.on('connection:status', handleConnectionStatus);
    socketService.on('socket:error', handleError);
    socketService.on('reconnect_attempt', handleReconnectAttempt);

    // Auto-connect if enabled
    if (autoConnect && !hasConnectedRef.current) {
      connect();
    }

    // Cleanup function
    return () => {
      socketService.off('connection:status', handleConnectionStatus);
      socketService.off('socket:error', handleError);
      socketService.off('reconnect_attempt', handleReconnectAttempt);
    };
  }, [autoConnect, connect, handleConnectionStatus, handleError, handleReconnectAttempt]);

  // Update connection status on mount
  useEffect(() => {
    setIsConnected(socketService.isConnected());
    setConnectionStatus(socketService.getConnectionStatus());
    setReconnectAttempts(socketService.getReconnectAttempts());
  }, []);

  return {
    isConnected,
    connectionStatus,
    error,
    connect,
    disconnect,
    reconnectAttempts,
  };
}

export default useSocket;