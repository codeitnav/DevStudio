import { 
  AuthService as IAuthService,
} from '../types/services';
import {
  User,
  LoginCredentials,
  RegisterData,
  ProfileData,
  PasswordChangeData,
  AuthResponse,
  AccountDeactivationData,
  DataExportRequest,
} from '../types/user';
import { httpClient } from '../lib/httpClient';

class AuthService implements IAuthService {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/auth/login', credentials);
    
    if (response.success && response.data) {
      // Store tokens
      httpClient.setTokens(response.data.token, response.data.refreshToken);
      return response.data;
    }
    
    throw new Error('Login failed');
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/auth/signup', userData);
    
    if (response.success && response.data) {
      // Store tokens
      httpClient.setTokens(response.data.token, response.data.refreshToken);
      return response.data;
    }
    
    throw new Error('Registration failed');
  }

  async logout(): Promise<void> {
    try {
      // Call logout endpoint to invalidate tokens on server
      await httpClient.post('/auth/logout');
    } catch (error) {
      // Continue with logout even if server call fails
      console.warn('Logout API call failed:', error);
    } finally {
      // Always clear local tokens
      httpClient.clearTokens();
    }
  }

  async forgotPassword(email: string): Promise<void> {
    const response = await httpClient.post('/auth/forgot-password', { email });
    
    if (!response.success) {
      throw new Error('Failed to send password reset email');
    }
  }

  async resetPassword(token: string, password: string): Promise<AuthResponse> {
    const response = await httpClient.post<AuthResponse>('/auth/reset-password', {
      token,
      password,
    });
    
    if (response.success && response.data) {
      // Store new tokens
      httpClient.setTokens(response.data.token, response.data.refreshToken);
      return response.data;
    }
    
    throw new Error('Password reset failed');
  }

  async getCurrentUser(): Promise<User> {
    const response = await httpClient.get<User>('/auth/me');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to get current user');
  }

  async updateProfile(data: ProfileData): Promise<User> {
    const response = await httpClient.put<User>('/auth/profile', data);
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to update profile');
  }

  async changePassword(passwords: PasswordChangeData): Promise<void> {
    const response = await httpClient.put('/auth/change-password', passwords);
    
    if (!response.success) {
      throw new Error('Failed to change password');
    }
  }

  async refreshToken(): Promise<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    
    if (!refreshToken) {
      throw new Error('No refresh token available');
    }

    const response = await httpClient.post<AuthResponse>('/auth/refresh', {
      refreshToken,
    });
    
    if (response.success && response.data) {
      // Store new tokens
      httpClient.setTokens(response.data.token, response.data.refreshToken);
      return response.data;
    }
    
    throw new Error('Token refresh failed');
  }

  async uploadAvatar(file: File): Promise<User> {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await httpClient.post<User>('/auth/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to upload avatar');
  }

  async deleteAvatar(): Promise<User> {
    const response = await httpClient.delete<User>('/auth/avatar');
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to delete avatar');
  }

  async deactivateAccount(data: AccountDeactivationData): Promise<void> {
    const response = await httpClient.post('/auth/deactivate', data);
    
    if (!response.success) {
      throw new Error('Failed to deactivate account');
    }
    
    // Clear tokens after successful deactivation
    httpClient.clearTokens();
  }

  async exportData(request: DataExportRequest): Promise<Blob> {
    const response = await httpClient.post('/auth/export-data', request, {
      responseType: 'blob',
    });
    
    if (response.success && response.data) {
      return response.data;
    }
    
    throw new Error('Failed to export data');
  }

  // ADD THESE NEW METHODS:

  /**
   * Get the current authentication token
   */
  getToken(): string | null {
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  }

  /**
   * Get the current refresh token
   */
  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken') || sessionStorage.getItem('refreshToken');
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return httpClient.hasValidToken();
  }
}

// Export singleton instance
export const authService = new AuthService();
export default authService;
