import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// --- TYPE DEFINITIONS ---

// User model
export interface User {
  _id: string;
  username: string;
  email: string;
  isGuest: boolean;
  createdAt: string;
  updatedAt: string;
}

// Response from authentication endpoints
export interface AuthResponse extends User {
  token: string;
}

// Credentials for login
export interface UserCredentials {
  email: string;
  password: string;
}

// Data required for signup
export interface SignupData extends UserCredentials {
  username: string;
}

// Room model
export interface Room {
  _id: string;
  name: string;
  roomId: string;
  owner: string;
  members: string[];
}

// --- AI INTERFACE TYPES ---

export interface AIRequest {
  query: string;
  codeContext: string;
}

export interface AIResponse {
  message: string; // The text response from the AI
}

// --- AXIOS INSTANCE & INTERCEPTORS ---

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000, // 10s default timeout
});

// Attach auth token to request headers
api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('userToken');
    if (token) config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 errors and token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 && typeof window !== 'undefined') {
      localStorage.removeItem('userToken');
      window.location.href = '/?login=true';
    }
    return Promise.reject(error);
  }
);

// --- AUTH API FUNCTIONS ---

export const signupUser = (userData: SignupData): Promise<AxiosResponse<AuthResponse>> =>
  api.post('/auth/signup', userData);

export const loginUser = (credentials: UserCredentials): Promise<AxiosResponse<AuthResponse>> =>
  api.post('/auth/login', credentials);

export const guestLogin = (): Promise<AxiosResponse<AuthResponse>> =>
  api.post('/auth/guest');

export const getProfile = (): Promise<AxiosResponse<User>> =>
  api.get('/auth/me');

// --- ROOM API FUNCTIONS ---

export const getRooms = () => api.get<Room[]>('/rooms');

export const getRoom = (roomId: string) =>
  api.get<Room>(`/rooms/${roomId}`);

export const joinRoom = (roomId: string) =>
  api.post<Room>(`/rooms/${roomId}/join`);

export const createRoom = (name: string) =>
  api.post<Room>('/rooms', { name });

export const addMember = (roomId: string, userId: string) =>
  api.post<Room>(`/rooms/${roomId}/members`, { userId });

export const deleteRoom = (roomId: string) =>
  api.delete<{ message: string }>(`/rooms/${roomId}`);

export const saveProject = (roomId: string) =>
  api.post<{ message: string }>(`/rooms/${roomId}/save`);


// --- AI API FUNCTIONS ---

/**
 * Sends a query to the AI Pair Programmer.
 * Uses a long timeout (35s) as AI responses can be slow.
 */
export const askAI = (data: AIRequest) =>
  api.post<AIResponse>('/ai/ask', data, { timeout: 35000 });

// The getProjectSummary function has been removed.

export default api;