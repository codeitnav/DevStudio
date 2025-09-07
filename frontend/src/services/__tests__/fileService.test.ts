import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fileService } from '../fileService';
import { httpClient } from '../../lib/httpClient';
import { File, Folder, CreateFileData, CreateFolderData } from '../../types/file';

// Mock the httpClient
vi.mock('../../lib/httpClient', () => ({
  httpClient: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn()
  }
}));

const mockHttpClient = httpClient as any;

describe('FileService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getFileStructure', () => {
    it('should fetch file structure for a room', async () => {
      const mockStructure = [
        {
          id: '1',
          name: 'src',
          type: 'folder',
          path: '/src',
          createdAt: new Date(),
          updatedAt: new Date(),
          children: []
        }
      ];

      mockHttpClient.get.mockResolvedValue({
        data: { data: mockStructure }
      });

      const result = await fileService.getFileStructure('room-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/rooms/room-1/files');
      expect(result).toEqual(mockStructure);
    });

    it('should return empty array if no data', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: { data: null }
      });

      const result = await fileService.getFileStructure('room-1');

      expect(result).toEqual([]);
    });
  });

  describe('createFile', () => {
    it('should create a new file', async () => {
      const fileData: CreateFileData = {
        name: 'test.js',
        language: 'javascript',
        content: 'console.log("hello");'
      };

      const mockFile: File = {
        id: '1',
        name: 'test.js',
        type: 'file',
        path: '/test.js',
        language: 'javascript',
        content: 'console.log("hello");',
        size: 20,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockHttpClient.post.mockResolvedValue({
        data: { data: mockFile }
      });

      const result = await fileService.createFile('room-1', fileData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/rooms/room-1/files', fileData);
      expect(result).toEqual(mockFile);
    });
  });

  describe('createFolder', () => {
    it('should create a new folder', async () => {
      const folderData: CreateFolderData = {
        name: 'components',
        parentId: 'src-folder'
      };

      const mockFolder: Folder = {
        id: '2',
        name: 'components',
        type: 'folder',
        path: '/src/components',
        parentId: 'src-folder',
        children: [],
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockHttpClient.post.mockResolvedValue({
        data: { data: mockFolder }
      });

      const result = await fileService.createFolder('room-1', folderData);

      expect(mockHttpClient.post).toHaveBeenCalledWith('/rooms/room-1/folders', folderData);
      expect(result).toEqual(mockFolder);
    });
  });

  describe('renameItem', () => {
    it('should rename a file or folder', async () => {
      await fileService.renameItem('room-1', 'file-1', 'newname.js');

      expect(mockHttpClient.patch).toHaveBeenCalledWith('/rooms/room-1/files/file-1', {
        name: 'newname.js'
      });
    });
  });

  describe('deleteItem', () => {
    it('should delete a file or folder', async () => {
      await fileService.deleteItem('room-1', 'file-1');

      expect(mockHttpClient.delete).toHaveBeenCalledWith('/rooms/room-1/files/file-1');
    });
  });

  describe('getFileContent', () => {
    it('should fetch file content', async () => {
      const mockContent = 'console.log("test");';

      mockHttpClient.get.mockResolvedValue({
        data: { data: { content: mockContent } }
      });

      const result = await fileService.getFileContent('room-1', 'file-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/rooms/room-1/files/file-1/content');
      expect(result).toBe(mockContent);
    });

    it('should return empty string if no content', async () => {
      mockHttpClient.get.mockResolvedValue({
        data: { data: null }
      });

      const result = await fileService.getFileContent('room-1', 'file-1');

      expect(result).toBe('');
    });
  });

  describe('saveFileContent', () => {
    it('should save file content', async () => {
      const content = 'console.log("updated");';

      await fileService.saveFileContent('room-1', 'file-1', content);

      expect(mockHttpClient.put).toHaveBeenCalledWith('/rooms/room-1/files/file-1/content', {
        content
      });
    });
  });

  describe('getFileInfo', () => {
    it('should fetch file information', async () => {
      const mockFile: File = {
        id: '1',
        name: 'test.js',
        type: 'file',
        path: '/test.js',
        language: 'javascript',
        content: '',
        size: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockHttpClient.get.mockResolvedValue({
        data: { data: mockFile }
      });

      const result = await fileService.getFileInfo('room-1', 'file-1');

      expect(mockHttpClient.get).toHaveBeenCalledWith('/rooms/room-1/files/file-1');
      expect(result).toEqual(mockFile);
    });
  });
});