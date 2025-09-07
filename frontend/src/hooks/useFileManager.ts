import { useState, useCallback } from 'react';
import { File } from '../types/file';
import { fileService } from '../services/fileService';

export const useFileManager = (roomId: string) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadFile = useCallback(async (fileId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const [fileInfo, content] = await Promise.all([
        fileService.getFileInfo(roomId, fileId),
        fileService.getFileContent(roomId, fileId)
      ]);

      const file: File = {
        ...fileInfo,
        content,
        size: content.length
      };

      setSelectedFile(file);
      return file;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to load file';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  const saveFile = useCallback(async (fileId: string, content: string) => {
    try {
      setLoading(true);
      setError(null);
      
      await fileService.saveFileContent(roomId, fileId, content);
      
      // Update the selected file if it's the one being saved
      if (selectedFile && selectedFile.id === fileId) {
        setSelectedFile({
          ...selectedFile,
          content,
          size: content.length,
          updatedAt: new Date()
        });
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || 'Failed to save file';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [roomId, selectedFile]);

  const selectFile = useCallback((file: File) => {
    setSelectedFile(file);
    setError(null);
  }, []);

  const clearSelection = useCallback(() => {
    setSelectedFile(null);
    setError(null);
  }, []);

  return {
    selectedFile,
    loading,
    error,
    loadFile,
    saveFile,
    selectFile,
    clearSelection
  };
};