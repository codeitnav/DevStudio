import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, LoginCredentials, RegisterData, PasswordChangeData, AccountDeactivationData, DataExportRequest } from '../types/user';
import { authService } from '../services/authService';
import { ErrorType } from '../types/error';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  forgotPassword: (email: string) => Promise<void>;
  resetPassword: (token: string, password: string) => Promise<void>;
  updateProfile: (data: { username?: string; email?: string; avatar?: string; preferences?: any }) => Promise<void>;
  changePassword: (passwords: PasswordChangeData) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  deleteAvatar: () => Promise<void>;
  deactivateAccount: (data: AccountDeactivationData) => Promise<void>;
  exportData: (request: DataExportRequest) => Promise<Blob>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [token, setToken] = useState<string | null>(null);

  const isAuthenticated = !!user && authService.isAuthenticated();

  // Initialize auth state on mount
  useEffect(() => {
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          const currentUser = await authService.getCurrentUser();
          const currentToken = authService.getToken();
          setToken(currentToken);
          setUser(currentUser);
        }
      } catch (error) {
        console.error('Failed to initialize auth:', error);
        // Clear invalid tokens
        authService.logout();
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  // Listen for logout events (from token refresh failures)
  useEffect(() => {
    const handleLogout = () => {
      setUser(null);
    };

    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    try {
      setIsLoading(true);
      const authResponse = await authService.login(credentials);
      setUser(authResponse.user);
      setToken(authResponse.token || authService.getToken());
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (userData: RegisterData): Promise<void> => {
    try {
      setIsLoading(true);
      const authResponse = await authService.register(userData);
      setUser(authResponse.user);
      setToken(authResponse.token || authService.getToken());
    } catch (error: any) {
      throw new Error(error.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.logout();
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Logout error:', error);
      // Always clear user state even if logout fails
      setUser(null);
      setToken(null);
    } finally {
      setIsLoading(false);
    }
  };

  const forgotPassword = async (email: string): Promise<void> => {
    try {
      await authService.forgotPassword(email);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to send password reset email');
    }
  };

  const resetPassword = async (token: string, password: string): Promise<void> => {
    try {
      setIsLoading(true);
      const authResponse = await authService.resetPassword(token, password);
      setUser(authResponse.user);
    } catch (error: any) {
      throw new Error(error.message || 'Password reset failed');
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (data: { username?: string; email?: string; avatar?: string; preferences?: any }): Promise<void> => {
    try {
      const updatedUser = await authService.updateProfile(data);
      setUser(updatedUser);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update profile');
    }
  };

  const changePassword = async (passwords: PasswordChangeData): Promise<void> => {
    try {
      await authService.changePassword(passwords);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to change password');
    }
  };

  const uploadAvatar = async (file: File): Promise<void> => {
    try {
      const updatedUser = await authService.uploadAvatar(file);
      setUser(updatedUser);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload avatar');
    }
  };

  const deleteAvatar = async (): Promise<void> => {
    try {
      const updatedUser = await authService.deleteAvatar();
      setUser(updatedUser);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete avatar');
    }
  };

  const deactivateAccount = async (data: AccountDeactivationData): Promise<void> => {
    try {
      setIsLoading(true);
      await authService.deactivateAccount(data);
      setUser(null);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to deactivate account');
    } finally {
      setIsLoading(false);
    }
  };

  const exportData = async (request: DataExportRequest): Promise<Blob> => {
    try {
      return await authService.exportData(request);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to export data');
    }
  };

  const refreshUser = async (): Promise<void> => {
    try {
      if (authService.isAuthenticated()) {
        const currentUser = await authService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error: any) {
      console.error('Failed to refresh user:', error);
      // If refresh fails, user might need to re-authenticate
      if (error.type === ErrorType.AUTHENTICATION_ERROR) {
        setUser(null);
      }
    }
  };

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    changePassword,
    uploadAvatar,
    deleteAvatar,
    deactivateAccount,
    exportData,
    refreshUser,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};