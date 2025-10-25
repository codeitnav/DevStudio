import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// --- TYPE DEFINITIONS ---

// Represents the User model.
export interface User {
  _id: string;
  username: string;
  email: string;
  isGuest: boolean;
  createdAt: string;
  updatedAt: string;
}

// Represents the response from a successful authentication request.
export interface AuthResponse extends User {
  token: string;
}

// Represents the credentials needed for logging in.
export interface UserCredentials {
  email: string;
  password: string;
}

// Represents the data needed for user registration.
export interface SignupData extends UserCredentials {
  username: string;
}

// Represents the Room model.
export interface Room {
    _id: string;
    name: string;
    roomId: string;
    owner: string;
    members: string[];
}

// --- DEPRECATED TYPES ---
// These types are no longer used by the Yjs-based file system
// but are kept for reference or other potential uses.

// Represents the Folder model.
export interface Folder {
  _id: string;
  name: string;
  room: string; // Room ID
  parent: string | null; // Parent Folder ID
  createdAt: string;
  updatedAt: string;
}

// Represents the File model.
export interface File {
  _id: string;
  name: string;
  content: string;
  mimetype: string;
  size: number;
  room: string; // Room ID
  folder: string | null; // Parent Folder ID
  createdAt: string;
  updatedAt: string;
}

// Response structure for file system contents
export interface FileSystemContents {
  folders: Folder[];
  files: File[];
}

// --- AXIOS INSTANCE & INTERCEPTOR ---

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

api.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  // Safely get token, only if window is defined
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('userToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      if (typeof window !== 'undefined') {
        localStorage.removeItem('userToken');
        // Optionally redirect to login
        window.location.href = '/?login=true';
      }
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

export const getRooms = (): Promise<AxiosResponse<Room[]>> =>
  api.get('/rooms');

export const createRoom = (name: string): Promise<AxiosResponse<Room>> =>
  api.post('/rooms', { name });

// Add a new member to a room
export const addMember = (roomId: string, userId: string): Promise<AxiosResponse<Room>> =>
  api.post(`/rooms/${roomId}/members`, { userId });

// Delete a room
export const deleteRoom = (roomId: string): Promise<AxiosResponse<{ message: string }>> =>
    api.delete(`/rooms/${roomId}`);


// --- FILE SYSTEM API FUNCTIONS (DEPRECATED) ---
// All file system operations are now handled by Yjs and y-websocket.
// These REST endpoints are no longer used for the file explorer.

// Get the URL to download a file (This might still be a valid REST endpoint)
export const downloadFile = (fileId: string): string =>
  `${API_URL}/fs/files/${fileId}/download`;

export default api;
