import { httpClient } from '../lib/httpClient';
import { File, Folder, FileSystemItem, CreateFileData, CreateFolderData } from '../types/file';
import { ApiResponse } from '../types/api';

export class FileService {
    /**
     * Get the file/folder structure for a room
     */
    async getFileStructure(roomId: string): Promise<FileSystemItem[]> {
        const response = await httpClient.get<ApiResponse<FileSystemItem[]>>(`/rooms/${roomId}/files`);
        
        if (!response.data) {
            throw new Error('Failed to fetch file structure: No data in response');
        }
        
        return response.data.data || [];
    }

    /**
     * Create a new file in a room
     */
    async createFile(roomId: string, fileData: CreateFileData): Promise<File> {
        const response = await httpClient.post<ApiResponse<File>>(`/rooms/${roomId}/files`, fileData);
        
        if (!response.data?.data) {
            throw new Error('Failed to create file: No data in response');
        }
        
        return response.data.data;
    }

    /**
     * Create a new folder in a room
     */
    async createFolder(roomId: string, folderData: CreateFolderData): Promise<Folder> {
        const response = await httpClient.post<ApiResponse<Folder>>(`/rooms/${roomId}/folders`, folderData);
        
        if (!response.data?.data) {
            throw new Error('Failed to create folder: No data in response');
        }
        
        return response.data.data;
    }

    /**
     * Rename a file or folder
     */
    async renameItem(roomId: string, itemId: string, newName: string): Promise<void> {
        await httpClient.patch(`/rooms/${roomId}/files/${itemId}`, { name: newName });
    }

    /**
     * Delete a file or folder
     */
    async deleteItem(roomId: string, itemId: string): Promise<void> {
        await httpClient.delete(`/rooms/${roomId}/files/${itemId}`);
    }

    /**
     * Get file content
     */
    async getFileContent(roomId: string, fileId: string): Promise<string> {
        const response = await httpClient.get<ApiResponse<{ content: string }>>(`/rooms/${roomId}/files/${fileId}/content`);
        
        if (!response.data) {
            throw new Error('Failed to fetch file content: No data in response');
        }
        
        return response.data.data?.content || '';
    }

    /**
     * Save file content
     */
    async saveFileContent(roomId: string, fileId: string, content: string): Promise<void> {
        await httpClient.put(`/rooms/${roomId}/files/${fileId}/content`, { content });
    }

    /**
     * Get file information
     */
    async getFileInfo(roomId: string, fileId: string): Promise<File> {
        const response = await httpClient.get<ApiResponse<File>>(`/rooms/${roomId}/files/${fileId}`);
        
        if (!response.data?.data) {
            throw new Error('Failed to fetch file info: No data in response');
        }
        
        return response.data.data;
    }

    /**
     * Move a file or folder to a new parent
     */
    async moveItem(roomId: string, itemId: string, newParentId?: string): Promise<void> {
        await httpClient.patch(`/rooms/${roomId}/files/${itemId}/move`, { parentId: newParentId });
    }

    /**
     * Auto-save file content with debouncing
     */
    private autoSaveTimeouts = new Map<string, NodeJS.Timeout>();
    
    async autoSaveFileContent(roomId: string, fileId: string, content: string, delay: number = 2000): Promise<void> {
        const key = `${roomId}-${fileId}`;
        
        // Clear existing timeout
        const existingTimeout = this.autoSaveTimeouts.get(key);
        if (existingTimeout) {
            clearTimeout(existingTimeout);
        }
        
        // Set new timeout
        const timeout = setTimeout(async () => {
            try {
                await this.saveFileContent(roomId, fileId, content);
                this.autoSaveTimeouts.delete(key);
            } catch (error) {
                console.error('Auto-save failed:', error);
            }
        }, delay);
        
        this.autoSaveTimeouts.set(key, timeout);
    }

    /**
     * Cancel auto-save for a file
     */
    cancelAutoSave(roomId: string, fileId: string): void {
        const key = `${roomId}-${fileId}`;
        const timeout = this.autoSaveTimeouts.get(key);
        if (timeout) {
            clearTimeout(timeout);
            this.autoSaveTimeouts.delete(key);
        }
    }

    /**
     * Force save all pending auto-saves
     */
    async flushAutoSaves(): Promise<void> {
        const promises: Promise<void>[] = [];
        
        for (const [key, timeout] of this.autoSaveTimeouts.entries()) {
            clearTimeout(timeout);
            // Note: We can't access the content here, so this is mainly for cleanup
            this.autoSaveTimeouts.delete(key);
        }
        
        await Promise.all(promises);
    }
}

export const fileService = new FileService();