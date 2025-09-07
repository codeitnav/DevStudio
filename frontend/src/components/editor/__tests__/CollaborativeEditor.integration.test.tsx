import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { CodeEditor } from '../CodeEditor';

// Mock the collaborative components
vi.mock('../CollaborativeCursors', () => ({
  CollaborativeCursors: ({ collaborators }: any) => (
    <div data-testid="collaborative-cursors">
      Cursors: {collaborators.size}
    </div>
  ),
}));

vi.mock('../UserSelections', () => ({
  UserSelections: ({ collaborators }: any) => (
    <div data-testid="user-selections">
      Selections: {collaborators.size}
    </div>
  ),
}));

// Mock the collaborative editor hook
vi.mock('../../hooks/useCollaborativeEditor', () => ({
  useCollaborativeEditor: () => ({
    collaborators: new Map([
      ['user1', {
        userId: 'user1',
        username: 'Alice',
        cursor: { line: 1, column: 1 },
        color: '#FF6B6B',
        isTyping: false,
      }],
    ]),
    sendCursorUpdate: vi.fn(),
    sendSelectionUpdate: vi.fn(),
    sendTypingStatus: vi.fn(),
  }),
}));

describe('CodeEditor with Collaborative Features', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render collaborative components when collaboration is enabled', () => {
    render(
      <CodeEditor
        value="console.log('Hello, World!');"
        language="javascript"
        enableCollaboration={true}
        roomId="test-room"
        currentUserId="current-user"
        currentUsername="Current User"
      />
    );

    expect(screen.getByTestId('collaborative-cursors')).toBeInTheDocument();
    expect(screen.getByTestId('user-selections')).toBeInTheDocument();
  });

  it('should not render collaborative components when collaboration is disabled', () => {
    render(
      <CodeEditor
        value="console.log('Hello, World!');"
        language="javascript"
        enableCollaboration={false}
      />
    );

    expect(screen.queryByTestId('collaborative-cursors')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-selections')).not.toBeInTheDocument();
  });

  it('should not render collaborative components when roomId is missing', () => {
    render(
      <CodeEditor
        value="console.log('Hello, World!');"
        language="javascript"
        enableCollaboration={true}
        currentUserId="current-user"
        currentUsername="Current User"
      />
    );

    expect(screen.queryByTestId('collaborative-cursors')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-selections')).not.toBeInTheDocument();
  });

  it('should not render collaborative components when currentUserId is missing', () => {
    render(
      <CodeEditor
        value="console.log('Hello, World!');"
        language="javascript"
        enableCollaboration={true}
        roomId="test-room"
        currentUsername="Current User"
      />
    );

    expect(screen.queryByTestId('collaborative-cursors')).not.toBeInTheDocument();
    expect(screen.queryByTestId('user-selections')).not.toBeInTheDocument();
  });
});