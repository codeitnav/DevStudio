import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { useDragAndDrop } from '../useDragAndDrop';
import { FileSystemItem } from '../../types/file';

const mockFile: FileSystemItem = {
  id: 'file-1',
  name: 'test.js',
  path: '/test.js',
  type: 'file',
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockFolder: FileSystemItem = {
  id: 'folder-1',
  name: 'src',
  path: '/src',
  type: 'folder',
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('useDragAndDrop', () => {
  const mockOnMove = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useDragAndDrop({ onMove: mockOnMove }));

    expect(result.current.draggedItem).toBeNull();
    expect(result.current.isDragging).toBe(false);
    expect(result.current.isDraggedItem('any-id')).toBe(false);
    expect(result.current.isDragOver('any-id')).toBe(false);
  });

  it('handles drag start correctly', () => {
    const { result } = renderHook(() => useDragAndDrop({ onMove: mockOnMove }));

    act(() => {
      result.current.handleDragStart(mockFile);
    });

    expect(result.current.draggedItem).toEqual({
      id: 'file-1',
      type: 'file',
      name: 'test.js'
    });
    expect(result.current.isDragging).toBe(true);
    expect(result.current.isDraggedItem('file-1')).toBe(true);
    expect(result.current.isDraggedItem('other-id')).toBe(false);
  });

  it('handles drag end correctly', () => {
    const { result } = renderHook(() => useDragAndDrop({ onMove: mockOnMove }));

    act(() => {
      result.current.handleDragStart(mockFile);
    });

    expect(result.current.isDragging).toBe(true);

    act(() => {
      result.current.handleDragEnd();
    });

    expect(result.current.draggedItem).toBeNull();
    expect(result.current.isDragging).toBe(false);
  });

  it('handles drag over correctly', () => {
    const { result } = renderHook(() => useDragAndDrop({ onMove: mockOnMove }));
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as React.DragEvent;

    act(() => {
      result.current.handleDragOver(mockEvent, mockFolder);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(result.current.isDragOver('folder-1')).toBe(true);
  });

  it('allows dropping on folders but not files', () => {
    const { result } = renderHook(() => useDragAndDrop({ onMove: mockOnMove }));
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as React.DragEvent;

    // Should allow dropping on folder
    act(() => {
      result.current.handleDragOver(mockEvent, mockFolder);
    });
    expect(result.current.isDragOver('folder-1')).toBe(true);

    // Should not set drag over for files
    act(() => {
      result.current.handleDragOver(mockEvent, mockFile);
    });
    expect(result.current.isDragOver('file-1')).toBe(false);
  });

  it('handles drop correctly', async () => {
    const { result } = renderHook(() => useDragAndDrop({ onMove: mockOnMove }));
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as React.DragEvent;

    // Start dragging a file
    act(() => {
      result.current.handleDragStart(mockFile);
    });

    // Drop on folder
    await act(async () => {
      await result.current.handleDrop(mockEvent, mockFolder);
    });

    expect(mockEvent.preventDefault).toHaveBeenCalled();
    expect(mockEvent.stopPropagation).toHaveBeenCalled();
    expect(mockOnMove).toHaveBeenCalledWith('file-1', 'folder-1');
    expect(result.current.draggedItem).toBeNull();
  });

  it('prevents dropping on self', async () => {
    const { result } = renderHook(() => useDragAndDrop({ onMove: mockOnMove }));
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as React.DragEvent;

    // Start dragging a file
    act(() => {
      result.current.handleDragStart(mockFile);
    });

    // Try to drop on self
    await act(async () => {
      await result.current.handleDrop(mockEvent, mockFile);
    });

    expect(mockOnMove).not.toHaveBeenCalled();
  });

  it('prevents dropping on files', async () => {
    const { result } = renderHook(() => useDragAndDrop({ onMove: mockOnMove }));
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as React.DragEvent;

    const anotherFile: FileSystemItem = {
      ...mockFile,
      id: 'file-2',
      name: 'other.js'
    };

    // Start dragging a file
    act(() => {
      result.current.handleDragStart(mockFile);
    });

    // Try to drop on another file
    await act(async () => {
      await result.current.handleDrop(mockEvent, anotherFile);
    });

    expect(mockOnMove).not.toHaveBeenCalled();
  });

  it('handles drop on root (no target)', async () => {
    const { result } = renderHook(() => useDragAndDrop({ onMove: mockOnMove }));
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as React.DragEvent;

    // Start dragging a file
    act(() => {
      result.current.handleDragStart(mockFile);
    });

    // Drop on root (no target)
    await act(async () => {
      await result.current.handleDrop(mockEvent);
    });

    expect(mockOnMove).toHaveBeenCalledWith('file-1', undefined);
  });

  it('handles move errors gracefully', async () => {
    const mockOnMoveWithError = vi.fn().mockRejectedValue(new Error('Move failed'));
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    
    const { result } = renderHook(() => useDragAndDrop({ onMove: mockOnMoveWithError }));
    const mockEvent = {
      preventDefault: vi.fn(),
      stopPropagation: vi.fn()
    } as unknown as React.DragEvent;

    // Start dragging a file
    act(() => {
      result.current.handleDragStart(mockFile);
    });

    // Drop on folder (should fail)
    await act(async () => {
      await result.current.handleDrop(mockEvent, mockFolder);
    });

    expect(consoleSpy).toHaveBeenCalledWith('Failed to move item:', expect.any(Error));
    expect(result.current.draggedItem).toBeNull(); // Should still clean up

    consoleSpy.mockRestore();
  });
});