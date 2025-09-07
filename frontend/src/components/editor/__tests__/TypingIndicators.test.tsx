import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { TypingIndicators } from '../TypingIndicators';
import type { CollaborativeUser } from '../../../types/editor';

describe('TypingIndicators', () => {
  const createMockUser = (id: string, username: string, isTyping: boolean): CollaborativeUser => ({
    userId: id,
    username,
    cursor: { line: 1, column: 1 },
    selection: null,
    color: '#FF6B6B',
    isTyping,
  });

  it('renders nothing when no users are typing', () => {
    const collaborators = new Map([
      ['user1', createMockUser('user1', 'John Doe', false)],
      ['user2', createMockUser('user2', 'Jane Smith', false)],
    ]);

    const { container } = render(<TypingIndicators collaborators={collaborators} />);
    expect(container.firstChild).toBeNull();
  });

  it('displays single user typing message', () => {
    const collaborators = new Map([
      ['user1', createMockUser('user1', 'John Doe', true)],
      ['user2', createMockUser('user2', 'Jane Smith', false)],
    ]);

    render(<TypingIndicators collaborators={collaborators} />);
    expect(screen.getByText('John Doe is typing...')).toBeInTheDocument();
  });

  it('displays two users typing message', () => {
    const collaborators = new Map([
      ['user1', createMockUser('user1', 'John Doe', true)],
      ['user2', createMockUser('user2', 'Jane Smith', true)],
      ['user3', createMockUser('user3', 'Bob Wilson', false)],
    ]);

    render(<TypingIndicators collaborators={collaborators} />);
    expect(screen.getByText('John Doe and Jane Smith are typing...')).toBeInTheDocument();
  });

  it('displays three users typing message', () => {
    const collaborators = new Map([
      ['user1', createMockUser('user1', 'John Doe', true)],
      ['user2', createMockUser('user2', 'Jane Smith', true)],
      ['user3', createMockUser('user3', 'Bob Wilson', true)],
    ]);

    render(<TypingIndicators collaborators={collaborators} />);
    expect(screen.getByText('John Doe, Jane Smith, and Bob Wilson are typing...')).toBeInTheDocument();
  });

  it('displays multiple users typing message with count', () => {
    const collaborators = new Map([
      ['user1', createMockUser('user1', 'John Doe', true)],
      ['user2', createMockUser('user2', 'Jane Smith', true)],
      ['user3', createMockUser('user3', 'Bob Wilson', true)],
      ['user4', createMockUser('user4', 'Alice Brown', true)],
      ['user5', createMockUser('user5', 'Charlie Davis', true)],
    ]);

    render(<TypingIndicators collaborators={collaborators} />);
    expect(screen.getByText('John Doe, Jane Smith, and 3 others are typing...')).toBeInTheDocument();
  });

  it('displays typing dots animation', () => {
    const collaborators = new Map([
      ['user1', createMockUser('user1', 'John Doe', true)],
    ]);

    render(<TypingIndicators collaborators={collaborators} />);
    
    // Check for typing dots container
    const typingDots = document.querySelector('.typing-dots');
    expect(typingDots).toBeInTheDocument();
    
    // Check for individual dots
    const dots = document.querySelectorAll('.typing-dot');
    expect(dots).toHaveLength(3);
  });

  it('applies custom className', () => {
    const collaborators = new Map([
      ['user1', createMockUser('user1', 'John Doe', true)],
    ]);

    render(<TypingIndicators collaborators={collaborators} className="custom-class" />);
    
    const container = document.querySelector('.typing-indicators');
    expect(container).toHaveClass('custom-class');
  });

  it('has proper styling structure', () => {
    const collaborators = new Map([
      ['user1', createMockUser('user1', 'John Doe', true)],
    ]);

    render(<TypingIndicators collaborators={collaborators} />);
    
    // Check main container
    const container = document.querySelector('.typing-indicators');
    expect(container).toBeInTheDocument();
    
    // Check inner content structure
    const contentDiv = container?.querySelector('div');
    expect(contentDiv).toHaveClass('flex', 'items-center', 'space-x-2', 'px-3', 'py-2', 'bg-gray-50', 'border-t', 'border-gray-200');
  });

  it('includes CSS animations for typing dots', () => {
    const collaborators = new Map([
      ['user1', createMockUser('user1', 'John Doe', true)],
    ]);

    render(<TypingIndicators collaborators={collaborators} />);
    
    // Check that style tag is present (jsx styles)
    const styleElement = document.querySelector('style');
    expect(styleElement).toBeTruthy();
    
    // Check for animation keyframes
    const styleContent = styleElement?.textContent || '';
    expect(styleContent).toContain('@keyframes typing-bounce');
    expect(styleContent).toContain('animation: typing-bounce');
  });

  it('filters out non-typing users correctly', () => {
    const collaborators = new Map([
      ['user1', createMockUser('user1', 'John Doe', true)],
      ['user2', createMockUser('user2', 'Jane Smith', false)],
      ['user3', createMockUser('user3', 'Bob Wilson', false)],
      ['user4', createMockUser('user4', 'Alice Brown', true)],
    ]);

    render(<TypingIndicators collaborators={collaborators} />);
    expect(screen.getByText('John Doe and Alice Brown are typing...')).toBeInTheDocument();
  });
});