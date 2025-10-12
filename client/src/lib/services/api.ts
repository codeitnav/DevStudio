import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from 'axios';

// --- TYPE DEFINITIONS (Updated per Schemas) ---

/**
 * Represents the User model.
 */
export interface User {
  _id: string;
  username: string;
  email: string;
  isGuest: boolean;
  createdAt: string; // ISO Date String
  updatedAt: string; // ISO Date String
}

/**
 * Represents the response from a successful authentication request.
 */
export interface AuthResponse extends User {
  token: string;
}

/**
 * Represents the credentials needed for logging in.
 */
export interface UserCredentials {
  email: string;
  password: string;
}

/**
 * Represents the data needed for user registration.
 */
export interface SignupData extends UserCredentials {
  username: string;
}

/**
 * Represents the Folder model.
 */
export interface Folder {
  _id: string;
  name: string;
  owner: string; // User ID
  parent: string | null; // Parent Folder ID
  createdAt: string;
  updatedAt: string;
}

/**
 * Represents the File model.
 */
export interface File {
  _id: string;
  name: string;
  content: string;
  mimetype: string;
  size: number;
  owner: string; // User ID
  folder: string | null; // Parent Folder ID
  createdAt: string;
  updatedAt: string;
}

/**
 * Response structure for file system contents
 */
export interface FileSystemContents {
  folders: Folder[];
  files: File[];
}

/**
 * A discriminated union to represent either a File or a Folder.
 */
export type FileSystemItem = (File & { type: 'file' }) | (Folder & { type: 'folder' });

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
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Add response interceptor for better error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('userToken');
      // Optionally redirect to login
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// --- API FUNCTIONS (with updated types) ---

export const signupUser = (userData: SignupData): Promise<AxiosResponse<AuthResponse>> =>
  api.post('/auth/signup', userData);

export const loginUser = (credentials: UserCredentials): Promise<AxiosResponse<AuthResponse>> =>
  api.post('/auth/login', credentials);

export const logoutUser = (): void => {
  localStorage.removeItem('userToken');
};

export const getProfile = (): Promise<AxiosResponse<User>> =>
  api.get('/auth/me');

/**
 * Get file system contents (folders and files)
 * Returns an object with { folders: [], files: [] }
 */
export const getFileSystem = (folderId?: string): Promise<AxiosResponse<FileSystemContents>> => {
  const params = folderId ? { folderId } : {};
  return api.get('/fs/contents', { params });
};

/**
 * Get a single file's content and metadata
 */
export const getFileContent = (fileId: string): Promise<AxiosResponse<File>> =>
  api.get(`/fs/files/${fileId}`);

/**
 * Update a file's content
 */
export const updateFileContent = (fileId: string, content: string): Promise<AxiosResponse<File>> =>
  api.put(`/fs/files/${fileId}`, { content });

/**
 * Create an empty file
 */
export const createEmptyFile = (name: string, folderId?: string): Promise<AxiosResponse<File>> =>
  api.post('/fs/files', { name, folderId });

/**
 * Upload a file
 */
export const uploadFile = (file: FormData): Promise<AxiosResponse<File>> =>
  api.post('/fs/files/upload', file, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

/**
 * Create a folder
 */
export const createFolder = (name: string, parentId?: string): Promise<AxiosResponse<Folder>> =>
  api.post('/fs/folders', { name, parentId });

/**
 * Delete a file
 */
export const deleteFile = (fileId: string): Promise<AxiosResponse<{ message: string }>> =>
  api.delete(`/fs/files/${fileId}`);

/**
 * Delete a folder and its contents
 */
export const deleteFolder = (folderId: string): Promise<AxiosResponse<{ message: string }>> =>
  api.delete(`/fs/folders/${folderId}`);

/**
 * Rename a file or folder
 */
export const renameItem = (
  type: 'file' | 'folder',
  itemId: string,
  newName: string
): Promise<AxiosResponse<File | Folder>> =>
  api.put(`/fs/rename/${type}/${itemId}`, { name: newName });

/**
 * Download a file
 */
export const downloadFile = (fileId: string): string =>
  `${API_URL}/fs/files/${fileId}/download`;

export default api;