import { useState, useCallback } from 'react';
import { FileSystemItem } from '../types/file';

export interface DragItem {
  id: string;
  type: 'file' | 'folder';
  name: string;
}

export interface UseDragAndDropProps {
  onMove: (itemId: string, newParentId?: string) => Promise<void>;
}

export const useDragAndDrop = ({ onMove }: UseDragAndDropProps) => {
  const [draggedItem, setDraggedItem] = useState<DragItem | null>(null);
  const [dragOverItem, setDragOverItem] = useState<string | null>(null);

  const handleDragStart = useCallback((item: FileSystemItem) => {
    setDraggedItem({
      id: item.id,
      type: item.type,
      name: item.name
    });
  }, []);

  const handleDragEnd = useCallback(() => {
    setDraggedItem(null);
    setDragOverItem(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, targetItem?: FileSystemItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only allow dropping on folders or root
    if (!targetItem || targetItem.type === 'folder') {
      setDragOverItem(targetItem?.id || 'root');
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only clear if we're leaving the actual target, not a child
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setDragOverItem(null);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent, targetItem?: FileSystemItem) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!draggedItem) return;
    
    const targetId = targetItem?.id;
    
    // Don't allow dropping on self or files
    if (draggedItem.id === targetId || (targetItem && targetItem.type === 'file')) {
      return;
    }
    
    // Don't allow dropping a folder into its own child
    if (draggedItem.type === 'folder' && targetItem?.path?.startsWith(`${draggedItem.name}/`)) {
      return;
    }
    
    try {
      await onMove(draggedItem.id, targetId);
    } catch (error) {
      console.error('Failed to move item:', error);
    } finally {
      setDraggedItem(null);
      setDragOverItem(null);
    }
  }, [draggedItem, onMove]);

  const isDragging = draggedItem !== null;
  const isDraggedItem = useCallback((itemId: string) => draggedItem?.id === itemId, [draggedItem]);
  const isDragOver = useCallback((itemId: string) => dragOverItem === itemId, [dragOverItem]);

  return {
    draggedItem,
    isDragging,
    isDraggedItem,
    isDragOver,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  };
};