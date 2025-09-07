import React from 'react';
import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { CollaborativeCursors } from '../CollaborativeCursors';
import type { CollaborativeUser } from '../../../types/editor';

// Mock Monaco Editor
const mockEditor = {
  addContentWidget: vi.fn(),
  removeContentWidget: vi.fn(),
} as any;

describe('CollaborativeCursors', () => {
  const currentUserId = 'current-user';
  
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear any existing styles
    document.head.querySelectorAll('style[data-collaborative-cursors]').forEach(el => el.remove());
  });

  afterEach(() => {
    // Clean up styles after each test
    document.head.querySelectorAll('style[data-collaborative-cursors]').forEach(el => el.remove());
  });

  it('should render without crashing', () => {
    const collaborators = new Map<string, CollaborativeUser>();
    
    render(
      <CollaborativeCursors
        editor={mockEditor}
        collaborators={collaborators}
        currentUserId={currentUserId}
      />
    );
    
    expect(mockEditor.addContentWidget).not.toHaveBeenCalled();
  });

  it('should add cursor widgets for collaborators', () => {
    const collaborators = new Map<string, CollaborativeUser>([
      ['user1', {
        userId: 'user1',
        username: 'Alice',
        cursor: { line: 5, column: 10 },
        color: '#FF6B6B',
        isTyping: false,
      }],
      ['user2', {
        userId: 'user2',
        username: 'Bob',
        cursor: { line: 3, column: 15 },
        color: '#4ECDC4',
        isTyping: true,
      }],
    ]);
    
    render(
      <CollaborativeCursors
        editor={mockEditor}
        collaborators={collaborators}
        currentUserId={currentUserId}
      />
    );
    
    // Should add widgets for both collaborators
    expect(mockEditor.addContentWidget).toHaveBeenCalledTimes(2);
  });

  it('should not add cursor widget for current user', () => {
    const collaborators = new Map<string, CollaborativeUser>([
      [currentUserId, {
        userId: currentUserId,
        username: 'Current User',
        cursor: { line: 1, column: 1 },
        color: '#FF6B6B',
        isTyping: false,
      }],
      ['user1', {
        userId: 'user1',
        username: 'Alice',
        cursor: { line: 5, column: 10 },
        color: '#4ECDC4',
        isTyping: false,
      }],
    ]);
    
    render(
      <CollaborativeCursors
        editor={mockEditor}
        collaborators={collaborators}
        currentUserId={currentUserId}
      />
    );
    
    // Should only add widget for user1, not current user
    expect(mockEditor.addContentWidget).toHaveBeenCalledTimes(1);
  });

  it('should remove widgets when collaborators are removed', () => {
    const { rerender } = render(
      <CollaborativeCursors
        editor={mockEditor}
        collaborators={new Map([
          ['user1', {
            userId: 'user1',
            username: 'Alice',
            cursor: { line: 5, column: 10 },
            color: '#FF6B6B',
            isTyping: false,
          }],
        ])}
        currentUserId={currentUserId}
      />
    );
    
    expect(mockEditor.addContentWidget).toHaveBeenCalledTimes(1);
    
    // Remove all collaborators
    rerender(
      <CollaborativeCursors
        editor={mockEditor}
        collaborators={new Map()}
        currentUserId={currentUserId}
      />
    );
    
    expect(mockEditor.removeContentWidget).toHaveBeenCalledTimes(1);
  });

  it('should handle null editor gracefully', () => {
    const collaborators = new Map<string, CollaborativeUser>([
      ['user1', {
        userId: 'user1',
        username: 'Alice',
        cursor: { line: 5, column: 10 },
        color: '#FF6B6B',
        isTyping: false,
      }],
    ]);
    
    expect(() => {
      render(
        <CollaborativeCursors
          editor={null}
          collaborators={collaborators}
          currentUserId={currentUserId}
        />
      );
    }).not.toThrow();
  });

  it('should add CSS styles for animations', () => {
    render(
      <CollaborativeCursors
        editor={mockEditor}
        collaborators={new Map()}
        currentUserId={currentUserId}
      />
    );
    
    const styleElement = document.head.querySelector('style[data-collaborative-cursors]');
    expect(styleElement).toBeTruthy();
    expect(styleElement?.textContent).toContain('@keyframes cursor-blink');
    expect(styleElement?.textContent).toContain('@keyframes typing-pulse');
  });
});