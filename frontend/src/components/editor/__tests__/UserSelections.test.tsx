import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { UserSelections, generateUserColor } from '../UserSelections';
import type { CollaborativeUser } from '../../../types/editor';

// Mock Monaco Editor
const mockEditor = {
  deltaDecorations: vi.fn().mockReturnValue(['decoration-id-1']),
  removeDecorations: vi.fn(),
} as any;

// Mock Monaco Range
vi.mock('monaco-editor', () => ({
  Range: vi.fn().mockImplementation((startLine, startColumn, endLine, endColumn) => ({
    startLineNumber: startLine,
    startColumn,
    endLineNumber: endLine,
    endColumn,
  })),
  editor: {
    TrackedRangeStickiness: {
      NeverGrowsWhenTypingAtEdges: 0,
    },
  },
}));

describe('UserSelections', () => {
  const currentUserId = 'current-user';
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing styles
    document.head.querySelectorAll('style[data-user-selection]').forEach(el => el.remove());
  });

  afterEach(() => {
    // Clean up styles after each test
    document.head.querySelectorAll('style[data-user-selection]').forEach(el => el.remove());
  });

  it('should render without crashing', () => {
    const collaborators = new Map<string, CollaborativeUser>();
    
    render(
      <UserSelections
        editor={mockEditor}
        collaborators={collaborators}
        currentUserId={currentUserId}
      />
    );
    
    expect(mockEditor.deltaDecorations).not.toHaveBeenCalled();
  });

  it('should add selection decorations for collaborators with selections', () => {
    const collaborators = new Map<string, CollaborativeUser>([
      ['user1', {
        userId: 'user1',
        username: 'Alice',
        cursor: { line: 5, column: 10 },
        selection: {
          startLine: 5,
          startColumn: 10,
          endLine: 5,
          endColumn: 20,
        },
        color: '#FF6B6B',
        isTyping: false,
      }],
      ['user2', {
        userId: 'user2',
        username: 'Bob',
        cursor: { line: 3, column: 15 },
        selection: null, // No selection
        color: '#4ECDC4',
        isTyping: false,
      }],
    ]);
    
    render(
      <UserSelections
        editor={mockEditor}
        collaborators={collaborators}
        currentUserId={currentUserId}
      />
    );
    
    // Should only add decoration for user1 who has a selection
    expect(mockEditor.deltaDecorations).toHaveBeenCalledTimes(1);
  });

  it('should not add selection decorations for current user', () => {
    const collaborators = new Map<string, CollaborativeUser>([
      [currentUserId, {
        userId: currentUserId,
        username: 'Current User',
        cursor: { line: 1, column: 1 },
        selection: {
          startLine: 1,
          startColumn: 1,
          endLine: 1,
          endColumn: 10,
        },
        color: '#FF6B6B',
        isTyping: false,
      }],
      ['user1', {
        userId: 'user1',
        username: 'Alice',
        cursor: { line: 5, column: 10 },
        selection: {
          startLine: 5,
          startColumn: 10,
          endLine: 5,
          endColumn: 20,
        },
        color: '#4ECDC4',
        isTyping: false,
      }],
    ]);
    
    render(
      <UserSelections
        editor={mockEditor}
        collaborators={collaborators}
        currentUserId={currentUserId}
      />
    );
    
    // Should only add decoration for user1, not current user
    expect(mockEditor.deltaDecorations).toHaveBeenCalledTimes(1);
  });

  it('should remove decorations when collaborators are removed', () => {
    const { rerender } = render(
      <UserSelections
        editor={mockEditor}
        collaborators={new Map([
          ['user1', {
            userId: 'user1',
            username: 'Alice',
            cursor: { line: 5, column: 10 },
            selection: {
              startLine: 5,
              startColumn: 10,
              endLine: 5,
              endColumn: 20,
            },
            color: '#FF6B6B',
            isTyping: false,
          }],
        ])}
        currentUserId={currentUserId}
      />
    );
    
    expect(mockEditor.deltaDecorations).toHaveBeenCalledTimes(1);
    
    // Remove all collaborators
    rerender(
      <UserSelections
        editor={mockEditor}
        collaborators={new Map()}
        currentUserId={currentUserId}
      />
    );
    
    expect(mockEditor.removeDecorations).toHaveBeenCalledTimes(1);
  });

  it('should handle null editor gracefully', () => {
    const collaborators = new Map<string, CollaborativeUser>([
      ['user1', {
        userId: 'user1',
        username: 'Alice',
        cursor: { line: 5, column: 10 },
        selection: {
          startLine: 5,
          startColumn: 10,
          endLine: 5,
          endColumn: 20,
        },
        color: '#FF6B6B',
        isTyping: false,
      }],
    ]);
    
    expect(() => {
      render(
        <UserSelections
          editor={null}
          collaborators={collaborators}
          currentUserId={currentUserId}
        />
      );
    }).not.toThrow();
  });

  describe('generateUserColor', () => {
    it('should generate consistent colors for the same user ID', () => {
      const userId = 'test-user-123';
      const color1 = generateUserColor(userId);
      const color2 = generateUserColor(userId);
      
      expect(color1).toBe(color2);
    });

    it('should generate different colors for different user IDs', () => {
      const color1 = generateUserColor('user1');
      const color2 = generateUserColor('user2');
      
      expect(color1).not.toBe(color2);
    });

    it('should return valid hex color codes', () => {
      const color = generateUserColor('test-user');
      expect(color).toMatch(/^#[0-9A-F]{6}$/i);
    });
  });
});