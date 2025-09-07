import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useCollaborativeEditor } from '../useCollaborativeEditor';
import { socketService } from '../../services/socketService';

// Mock socket service
vi.mock('../../services/socketService', () => ({
  socketService: {
    isConnected: vi.fn(),
    sendCursorUpdate: vi.fn(),
    sendTypingStatus: vi.fn(),
    emit: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
  },
}));

// Mock Monaco Editor
const mockEditor = {
  onDidChangeCursorPosition: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  onDidChangeCursorSelection: vi.fn().mockReturnValue({ dispose: vi.fn() }),
  onDidChangeModelContent: vi.fn().mockReturnValue({ dispose: vi.fn() }),
} as any;

describe('useCollaborativeEditor', () => {
  const defaultOptions = {
    roomId: 'test-room',
    currentUserId: 'current-user',
    currentUsername: 'Current User',
    editor: mockEditor,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (socketService.isConnected as any).mockReturnValue(true);
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('should initialize with empty collaborators', () => {
    const { result } = renderHook(() => useCollaborativeEditor(defaultOptions));
    
    expect(result.current.collaborators.size).toBe(0);
  });

  it('should provide cursor update function', () => {
    const { result } = renderHook(() => useCollaborativeEditor(defaultOptions));
    
    act(() => {
      result.current.sendCursorUpdate({ line: 5, column: 10 });
    });
    
    expect(socketService.sendCursorUpdate).toHaveBeenCalledWith('test-room', { line: 5, column: 10 });
  });

  it('should provide selection update function', () => {
    const { result } = renderHook(() => useCollaborativeEditor(defaultOptions));
    
    const selection = {
      startLine: 1,
      startColumn: 1,
      endLine: 1,
      endColumn: 10,
    };
    
    act(() => {
      result.current.sendSelectionUpdate(selection);
    });
    
    expect(socketService.emit).toHaveBeenCalledWith('selection:update', {
      roomId: 'test-room',
      selection,
    });
  });

  it('should provide typing status function with debouncing', () => {
    vi.useFakeTimers();
    
    const { result } = renderHook(() => useCollaborativeEditor(defaultOptions));
    
    act(() => {
      result.current.sendTypingStatus(true);
    });
    
    expect(socketService.sendTypingStatus).toHaveBeenCalledWith('test-room', true);
    
    // Fast forward time to trigger debounced stop typing
    act(() => {
      vi.advanceTimersByTime(2000);
    });
    
    expect(socketService.sendTypingStatus).toHaveBeenCalledWith('test-room', false);
    
    vi.useRealTimers();
  });

  it('should not send updates when socket is disconnected', () => {
    (socketService.isConnected as any).mockReturnValue(false);
    
    const { result } = renderHook(() => useCollaborativeEditor(defaultOptions));
    
    act(() => {
      result.current.sendCursorUpdate({ line: 5, column: 10 });
      result.current.sendSelectionUpdate(null);
      result.current.sendTypingStatus(true);
    });
    
    expect(socketService.sendCursorUpdate).not.toHaveBeenCalled();
    expect(socketService.emit).not.toHaveBeenCalled();
    expect(socketService.sendTypingStatus).not.toHaveBeenCalled();
  });

  it('should not send updates when roomId is empty', () => {
    const { result } = renderHook(() => 
      useCollaborativeEditor({ ...defaultOptions, roomId: '' })
    );
    
    act(() => {
      result.current.sendCursorUpdate({ line: 5, column: 10 });
    });
    
    expect(socketService.sendCursorUpdate).not.toHaveBeenCalled();
  });

  it('should set up editor event listeners when editor is provided', () => {
    renderHook(() => useCollaborativeEditor(defaultOptions));
    
    expect(mockEditor.onDidChangeCursorPosition).toHaveBeenCalled();
    expect(mockEditor.onDidChangeCursorSelection).toHaveBeenCalled();
    expect(mockEditor.onDidChangeModelContent).toHaveBeenCalled();
  });

  it('should not set up editor event listeners when editor is null', () => {
    const { result } = renderHook(() => 
      useCollaborativeEditor({ ...defaultOptions, editor: null })
    );
    
    expect(result.current.collaborators.size).toBe(0);
    // Editor listeners should not be called when editor is null
  });

  it('should register socket event listeners', () => {
    renderHook(() => useCollaborativeEditor(defaultOptions));
    
    expect(socketService.on).toHaveBeenCalledWith('cursor:update', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('selection:update', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('typing:status', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('room:user-joined', expect.any(Function));
    expect(socketService.on).toHaveBeenCalledWith('room:user-left', expect.any(Function));
  });

  it('should clean up socket event listeners on unmount', () => {
    const { unmount } = renderHook(() => useCollaborativeEditor(defaultOptions));
    
    unmount();
    
    expect(socketService.off).toHaveBeenCalledWith('cursor:update', expect.any(Function));
    expect(socketService.off).toHaveBeenCalledWith('selection:update', expect.any(Function));
    expect(socketService.off).toHaveBeenCalledWith('typing:status', expect.any(Function));
    expect(socketService.off).toHaveBeenCalledWith('room:user-joined', expect.any(Function));
    expect(socketService.off).toHaveBeenCalledWith('room:user-left', expect.any(Function));
  });

  it('should avoid sending duplicate cursor positions', () => {
    const { result } = renderHook(() => useCollaborativeEditor(defaultOptions));
    
    const position = { line: 5, column: 10 };
    
    act(() => {
      result.current.sendCursorUpdate(position);
      result.current.sendCursorUpdate(position); // Same position
    });
    
    // Should only be called once due to duplicate prevention
    expect(socketService.sendCursorUpdate).toHaveBeenCalledTimes(1);
  });

  it('should avoid sending duplicate selections', () => {
    const { result } = renderHook(() => useCollaborativeEditor(defaultOptions));
    
    const selection = {
      startLine: 1,
      startColumn: 1,
      endLine: 1,
      endColumn: 10,
    };
    
    act(() => {
      result.current.sendSelectionUpdate(selection);
      result.current.sendSelectionUpdate(selection); // Same selection
    });
    
    // Should only be called once due to duplicate prevention
    expect(socketService.emit).toHaveBeenCalledTimes(1);
  });
});