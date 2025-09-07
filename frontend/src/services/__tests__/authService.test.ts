import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from '../authService';
import { httpClient } from '../../lib/httpClient';

// Mock the httpClient
vi.mock('../../lib/httpClient', () => ({
  httpClient: {
    post: vi.fn(),
    get: vi.fn(),
    put: vi.fn(),
    setTokens: vi.fn(),
    clearTokens: vi.fn(),
    getRefreshToken: vi.fn(),
    hasValidToken: vi.fn(),
  },
}));

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('login', () => {
    it('should login successfully and store tokens', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '1', email: 'test@example.com', username: 'testuser' },
          token: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      const credentials = { email: 'test@example.com', password: 'password' };
      const result = await authService.login(credentials);

      expect(httpClient.post).toHaveBeenCalledWith('/auth/login', credentials);
      expect(httpClient.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
      expect(result).toEqual(mockResponse.data);
    });

    it('should throw error when login fails', async () => {
      const mockResponse = {
        success: false,
        error: { message: 'Invalid credentials' },
      };

      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      const credentials = { email: 'test@example.com', password: 'wrong-password' };

      await expect(authService.login(credentials)).rejects.toThrow('Login failed');
    });
  });

  describe('register', () => {
    it('should register successfully and store tokens', async () => {
      const mockResponse = {
        success: true,
        data: {
          user: { id: '1', email: 'test@example.com', username: 'testuser' },
          token: 'access-token',
          refreshToken: 'refresh-token',
        },
      };

      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      const userData = {
        email: 'test@example.com',
        username: 'testuser',
        password: 'password',
        confirmPassword: 'password',
      };
      const result = await authService.register(userData);

      expect(httpClient.post).toHaveBeenCalledWith('/auth/register', userData);
      expect(httpClient.setTokens).toHaveBeenCalledWith('access-token', 'refresh-token');
      expect(result).toEqual(mockResponse.data);
    });
  });

  describe('logout', () => {
    it('should logout and clear tokens', async () => {
      const mockResponse = { success: true };
      vi.mocked(httpClient.post).mockResolvedValue(mockResponse);

      await authService.logout();

      expect(httpClient.post).toHaveBeenCalledWith('/auth/logout');
      expect(httpClient.clearTokens).toHaveBeenCalled();
    });

    it('should clear tokens even if logout API fails', async () => {
      vi.mocked(httpClient.post).mockRejectedValue(new Error('Network error'));

      await authService.logout();

      expect(httpClient.clearTokens).toHaveBeenCalled();
    });
  });

  describe('isAuthenticated', () => {
    it('should return true when token is valid', () => {
      vi.mocked(httpClient.hasValidToken).mockReturnValue(true);

      const result = authService.isAuthenticated();

      expect(result).toBe(true);
      expect(httpClient.hasValidToken).toHaveBeenCalled();
    });

    it('should return false when token is invalid', () => {
      vi.mocked(httpClient.hasValidToken).mockReturnValue(false);

      const result = authService.isAuthenticated();

      expect(result).toBe(false);
    });
  });
});