// Example usage of the authentication service
import { authService } from '../services/authService';
import { httpClient } from '../lib/httpClient';

// Example: How to use the authentication service
export const authExamples = {
  // Login example
  async loginExample() {
    try {
      const authResponse = await authService.login({
        email: 'user@example.com',
        password: 'password123'
      });
      
      console.log('Login successful:', authResponse.user);
      return authResponse;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  },

  // Register example
  async registerExample() {
    try {
      const authResponse = await authService.register({
        email: 'newuser@example.com',
        username: 'newuser',
        password: 'password123',
        confirmPassword: 'password123'
      });
      
      console.log('Registration successful:', authResponse.user);
      return authResponse;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  },

  // Check authentication status
  checkAuthStatus() {
    const isAuthenticated = authService.isAuthenticated();
    const hasToken = httpClient.hasValidToken();
    
    console.log('Authentication status:', {
      isAuthenticated,
      hasToken,
      accessToken: httpClient.getAccessToken() ? 'Present' : 'Missing',
      refreshToken: httpClient.getRefreshToken() ? 'Present' : 'Missing'
    });
    
    return { isAuthenticated, hasToken };
  },

  // Logout example
  async logoutExample() {
    try {
      await authService.logout();
      console.log('Logout successful');
    } catch (error) {
      console.error('Logout failed:', error);
      throw error;
    }
  }
};

// Example: How to use the HTTP client directly
export const httpClientExamples = {
  // Making authenticated requests
  async makeAuthenticatedRequest() {
    try {
      const response = await httpClient.get('/user/profile');
      console.log('Profile data:', response.data);
      return response;
    } catch (error) {
      console.error('Request failed:', error);
      throw error;
    }
  },

  // Token management
  manageTokens() {
    // Set tokens (usually done by auth service)
    httpClient.setTokens('sample-access-token', 'sample-refresh-token');
    
    // Get tokens
    const accessToken = httpClient.getAccessToken();
    const refreshToken = httpClient.getRefreshToken();
    
    console.log('Tokens:', { accessToken, refreshToken });
    
    // Clear tokens
    httpClient.clearTokens();
    
    return { accessToken, refreshToken };
  }
};