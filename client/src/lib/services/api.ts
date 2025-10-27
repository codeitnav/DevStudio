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

// --- DEPRECATED TYPES ---
// Kept for reference or potential use

// Folder model
export interface Folder {
  _id: string;
  name: string;
  room: string; // Room ID
  parent: string | null; // Parent folder ID
  createdAt: string;
  updatedAt: string;
}

// File model
export interface File {
  _id: string;
  name: string;
  content: string;
  mimetype: string;
  size: number;
  room: string; // Room ID
  folder: string | null; // Parent folder ID
  createdAt: string;
  updatedAt: string;
}

// File system response structure
export interface FileSystemContents {
  folders: Folder[];
  files: File[];
}

// --- AXIOS INSTANCE & INTERCEPTORS ---

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 10000, // 10s timeout
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

/** Fetches all rooms the current user is a member of. */
export const getRooms = () => api.get<Room[]>('/rooms');

/** Fetches a single room by its human-readable roomId. */
export const getRoom = (roomId: string) =>
  api.get<Room>(`/rooms/${roomId}`);

/** Creates a new room with the given name. */
export const createRoom = (name: string) =>
  api.post<Room>('/rooms', { name });

/** Adds a member to a room using their user _id. */
export const addMember = (roomId: string, userId: string) =>
  api.post<Room>(`/rooms/${roomId}/members`, { userId });

/** Deletes a room using its human-readable roomId. */
export const deleteRoom = (roomId: string) =>
  api.delete<{ message: string }>(`/rooms/${roomId}`);

export default api;
