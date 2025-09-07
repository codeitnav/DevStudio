import { useEffect, useRef, useCallback } from 'react';
import { fileService } from '../services/fileService';

export interface UseAutoSaveProps {
  roomId: string;
  fileId: string;
  content: string;
  enabled?: boolean;
  delay?: number;
  onSave?: () => void;
  onError?: (error: Error) => void;
}

export const useAutoSave = ({
  roomId,
  fileId,
  content,
  enabled = true,
  delay = 2000,
  onSave,
  onError
}: UseAutoSaveProps) => {
  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastSavedContentRef = useRef<string>(content);
  const isSavingRef = useRef<boolean>(false);

  const save = useCallback(async (contentToSave: string) => {
    if (isSavingRef.current) return;
    
    try {
      isSavingRef.current = true;
      await fileService.saveFileContent(roomId, fileId, contentToSave);
      lastSavedContentRef.current = contentToSave;
      onSave?.();
    } catch (error) {
      onError?.(error as Error);
    } finally {
      isSavingRef.current = false;
    }
  }, [roomId, fileId, onSave, onError]);

  const scheduleAutoSave = useCallback((contentToSave: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      save(contentToSave);
    }, delay);
  }, [save, delay]);

  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    save(content);
  }, [save, content]);

  const cancelAutoSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  }, []);

  // Auto-save when content changes
  useEffect(() => {
    if (!enabled || content === lastSavedContentRef.current) {
      return;
    }

    scheduleAutoSave(content);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, enabled, scheduleAutoSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const hasUnsavedChanges = content !== lastSavedContentRef.current;
  const isSaving = isSavingRef.current;

  return {
    save: forceSave,
    cancel: cancelAutoSave,
    hasUnsavedChanges,
    isSaving
  };
};