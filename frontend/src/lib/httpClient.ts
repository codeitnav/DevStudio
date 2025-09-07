import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';
import { ApiResponse, ApiErrorResponse } from '../types/api';
import { ErrorType } from '../types/error';

// Token storage keys
const ACCESS_TOKEN_KEY = 'devstudio_access_token';
const REFRESH_TOKEN_KEY = 'devstudio_refresh_token';

class HttpClient {
  private client: AxiosInstance;
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
      timeout: 10000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // Request interceptor to add auth token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    // Response interceptor to handle token refresh
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        return response;
      },
      async (error) => {
        const originalRequest = error.config;

        if (error.response?.status === 401 && !originalRequest._retry) {
          if (this.isRefreshing) {
            // If already refreshing, queue the request
            return new Promise((resolve, reject) => {
              this.failedQueue.push({ resolve, reject });
            }).then((token) => {
              originalRequest.headers.Authorization = `Bearer ${token}`;
              return this.client(originalRequest);
            }).catch((err) => {
              return Promise.reject(err);
            });
          }

          originalRequest._retry = true;
          this.isRefreshing = true;

          try {
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
              throw new Error('No refresh token available');
            }

            const response = await this.client.post('/auth/refresh', {
              refreshToken,
            });

            const { token, refreshToken: newRefreshToken } = response.data.data;
            
            this.setTokens(token, newRefreshToken);
            
            // Process failed queue
            this.failedQueue.forEach(({ resolve }) => {
              resolve(token);
            });
            this.failedQueue = [];

            originalRequest.headers.Authorization = `Bearer ${token}`;
            return this.client(originalRequest);
          } catch (refreshError) {
            // Refresh failed, clear tokens and redirect to login
            this.clearTokens();
            this.failedQueue.forEach(({ reject }) => {
              reject(refreshError);
            });
            this.failedQueue = [];
            
            // Emit event for auth context to handle
            window.dispatchEvent(new CustomEvent('auth:logout'));
            
            return Promise.reject(refreshError);
          } finally {
            this.isRefreshing = false;
          }
        }

        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: any) {
    if (error.response) {
      // Server responded with error status
      const apiError: ApiErrorResponse = error.response.data;
      return {
        type: this.mapErrorType(apiError.error?.type || 'UNKNOWN_ERROR'),
        message: apiError.error?.message || 'An unexpected error occurred',
        code: apiError.error?.code,
        details: apiError.error?.details,
        status: error.response.status,
      };
    } else if (error.request) {
      // Network error
      return {
        type: ErrorType.NETWORK_ERROR,
        message: 'Network error. Please check your connection.',
        details: error.message,
      };
    } else {
      // Other error
      return {
        type: ErrorType.UNKNOWN_ERROR,
        message: error.message || 'An unexpected error occurred',
      };
    }
  }

  private mapErrorType(errorType: string): ErrorType {
    switch (errorType) {
      case 'AUTHENTICATION_ERROR':
        return ErrorType.AUTHENTICATION_ERROR;
      case 'VALIDATION_ERROR':
        return ErrorType.VALIDATION_ERROR;
      case 'ROOM_ACCESS_ERROR':
        return ErrorType.ROOM_ACCESS_ERROR;
      case 'FILE_OPERATION_ERROR':
        return ErrorType.FILE_OPERATION_ERROR;
      default:
        return ErrorType.UNKNOWN_ERROR;
    }
  }

  // Token management methods
  public setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }

  public getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }

  public getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }

  public clearTokens() {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }

  public hasValidToken(): boolean {
    const token = this.getAccessToken();
    if (!token) return false;

    try {
      // Basic JWT validation (check if it's not expired)
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Date.now() / 1000;
      return payload.exp > currentTime;
    } catch {
      return false;
    }
  }

  // HTTP methods
  public async get<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.get(url, config);
    return response.data;
  }

  public async post<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.post(url, data, config);
    return response.data;
  }

  public async put<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.put(url, data, config);
    return response.data;
  }

  public async patch<T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.patch(url, data, config);
    return response.data;
  }

  public async delete<T = any>(url: string, config?: AxiosRequestConfig): Promise<ApiResponse<T>> {
    const response = await this.client.delete(url, config);
    return response.data;
  }
}

// Export singleton instance
export const httpClient = new HttpClient();
export default httpClient;