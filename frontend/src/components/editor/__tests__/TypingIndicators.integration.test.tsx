import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TypingIndicators } from '../TypingIndicators';
import { useCollaborativeEditor } from '../../../hooks/useCollaborativeEditor';
import type { CollaborativeUser } from '../../../types/editor';

// Mock the collaborative editor hook
vi.mock('../../../hooks/useCollaborativeEditor');

describe('TypingIndicators Integration', () => {
  it('integrates with collaborative editor hook', () => {
    const mockCollaborators = new Map<string, CollaborativeUser>([
      ['user1', {
        userId: 'user1',
        username: 'John Doe',
        cursor: { line: 1, column: 1 },
        selection: null,
        color: '#FF6B6B',
        isTyping: true,
      }],
    ]);

    // Mock the hook return value
    vi.mocked(useCollaborativeEditor).mockReturnValue({
      collaborators: mockCollaborators,
      typingUsers: ['user1'],
      sendCursorUpdate: vi.fn(),
      sendSelectionUpdate: vi.fn(),
      sendTypingStatus: vi.fn(),
    });

    render(<TypingIndicators collaborators={mockCollaborators} />);
    
    expect(screen.getByText('John Doe is typing...')).toBeInTheDocument();
  });
});