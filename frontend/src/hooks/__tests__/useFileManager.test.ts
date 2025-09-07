import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useFileManager } from '../useFileManager';
import { fileService } from '../../services/fileService';
import { File } from '../../types/file';

// Mock the fileService
vi.mock('../../services/fileService', () => ({
  fileService: {
    getFileInfo: vi.fn(),
    getFileContent: vi.fn(),
    saveFileContent: vi.fn()
  }
}));

const mockFileService = fileService as any;

describe('useFileManager', () => {
  const roomId = 'test-room';
  
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should initialize with default values', () => {
    const { result } = renderHook(() => useFileManager(roomId));

    expect(result.current.selectedFile).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  describe('loadFile', () => {
    it('should load file successfully', async () => {
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

      const mockContent = 'console.log("test");';

      mockFileService.getFileInfo.mockResolvedValue(mockFile);
      mockFileService.getFileContent.mockResolvedValue(mockContent);

      const { result } = renderHook(() => useFileManager(roomId));

      let loadedFile: File;
      await act(async () => {
        loadedFile = await result.current.loadFile('1');
      });

      expect(mockFileService.getFileInfo).toHaveBeenCalledWith(roomId, '1');
      expect(mockFileService.getFileContent).toHaveBeenCalledWith(roomId, '1');
      expect(result.current.selectedFile).toEqual({
        ...mockFile,
        content: mockContent,
        size: mockContent.length
      });
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle load file error', async () => {
      const error = new Error('Failed to load file');
      mockFileService.getFileInfo.mockRejectedValue(error);

      const { result } = renderHook(() => useFileManager(roomId));

      await act(async () => {
        try {
          await result.current.loadFile('1');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.selectedFile).toBeNull();
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to load file');
    });
  });

  describe('saveFile', () => {
    it('should save file successfully', async () => {
      const mockFile: File = {
        id: '1',
        name: 'test.js',
        type: 'file',
        path: '/test.js',
        language: 'javascript',
        content: 'old content',
        size: 11,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { result } = renderHook(() => useFileManager(roomId));

      // Set initial selected file
      act(() => {
        result.current.selectFile(mockFile);
      });

      const newContent = 'new content';
      mockFileService.saveFileContent.mockResolvedValue(undefined);

      await act(async () => {
        await result.current.saveFile('1', newContent);
      });

      expect(mockFileService.saveFileContent).toHaveBeenCalledWith(roomId, '1', newContent);
      expect(result.current.selectedFile?.content).toBe(newContent);
      expect(result.current.selectedFile?.size).toBe(newContent.length);
      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBeNull();
    });

    it('should handle save file error', async () => {
      const error = new Error('Failed to save file');
      mockFileService.saveFileContent.mockRejectedValue(error);

      const { result } = renderHook(() => useFileManager(roomId));

      await act(async () => {
        try {
          await result.current.saveFile('1', 'content');
        } catch (e) {
          // Expected to throw
        }
      });

      expect(result.current.loading).toBe(false);
      expect(result.current.error).toBe('Failed to save file');
    });
  });

  describe('selectFile', () => {
    it('should select a file', () => {
      const mockFile: File = {
        id: '1',
        name: 'test.js',
        type: 'file',
        path: '/test.js',
        language: 'javascript',
        content: 'content',
        size: 7,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { result } = renderHook(() => useFileManager(roomId));

      act(() => {
        result.current.selectFile(mockFile);
      });

      expect(result.current.selectedFile).toEqual(mockFile);
      expect(result.current.error).toBeNull();
    });
  });

  describe('clearSelection', () => {
    it('should clear file selection', () => {
      const mockFile: File = {
        id: '1',
        name: 'test.js',
        type: 'file',
        path: '/test.js',
        language: 'javascript',
        content: 'content',
        size: 7,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const { result } = renderHook(() => useFileManager(roomId));

      // First select a file
      act(() => {
        result.current.selectFile(mockFile);
      });

      expect(result.current.selectedFile).toEqual(mockFile);

      // Then clear selection
      act(() => {
        result.current.clearSelection();
      });

      expect(result.current.selectedFile).toBeNull();
      expect(result.current.error).toBeNull();
    });
  });
});