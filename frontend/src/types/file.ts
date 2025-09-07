// File system related type definitions

export interface FileSystemItem {
  id: string;
  name: string;
  path: string;
  type: 'file' | 'folder';
  parentId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface File extends FileSystemItem {
  type: 'file';
  language: string;
  content: string;
  size: number;
}

export interface Folder extends FileSystemItem {
  type: 'folder';
  children: FileSystemItem[];
}

export interface CreateFileData {
  name: string;
  parentId?: string;
  language: string;
  content?: string;
}

export interface CreateFolderData {
  name: string;
  parentId?: string;
}

export type FileSystemItemType = 'file' | 'folder';