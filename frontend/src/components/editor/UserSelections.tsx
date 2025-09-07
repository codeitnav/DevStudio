import React, { useEffect, useRef } from 'react';
import * as monaco from 'monaco-editor';
import type { CollaborativeUser, TextSelection } from '../../types/editor';

export interface UserSelectionsProps {
  editor: monaco.editor.IStandaloneCodeEditor | null;
  collaborators: Map<string, CollaborativeUser>;
  currentUserId: string;
}

interface SelectionDecoration {
  id: string;
  decorationIds: string[];
  userId: string;
}

export const UserSelections: React.FC<UserSelectionsProps> = ({
  editor,
  collaborators,
  currentUserId,
}) => {
  const decorationsRef = useRef<Map<string, SelectionDecoration>>(new Map());

  // Clean up decorations when component unmounts
  useEffect(() => {
    return () => {
      if (editor) {
        decorationsRef.current.forEach(decoration => {
          editor.removeDecorations(decoration.decorationIds);
        });
      }
    };
  }, [editor]);

  // Update selection decorations when collaborators change
  useEffect(() => {
    if (!editor) return;

    // Remove existing decorations
    decorationsRef.current.forEach(decoration => {
      editor.removeDecorations(decoration.decorationIds);
    });
    decorationsRef.current.clear();

    // Create decorations for each collaborator with selections (excluding current user)
    collaborators.forEach((collaborator, userId) => {
      if (userId === currentUserId || !collaborator.selection) return;

      const selection = collaborator.selection;
      const decorationIds = createSelectionDecorations(editor, selection, collaborator);

      decorationsRef.current.set(userId, {
        id: `selection-${userId}`,
        decorationIds,
        userId,
      });
    });
  }, [editor, collaborators, currentUserId]);

  return null; // This component doesn't render anything directly
};

function createSelectionDecorations(
  editor: monaco.editor.IStandaloneCodeEditor,
  selection: TextSelection,
  collaborator: CollaborativeUser
): string[] {
  const { startLine, startColumn, endLine, endColumn } = selection;
  
  // Create range for the selection
  const range = new monaco.Range(startLine, startColumn, endLine, endColumn);
  
  // Generate colors with transparency
  const backgroundColor = hexToRgba(collaborator.color, 0.2);
  const borderColor = hexToRgba(collaborator.color, 0.6);
  
  // Create decoration options
  const decorationOptions: monaco.editor.IModelDecorationOptions = {
    className: `user-selection-${collaborator.userId}`,
    inlineClassName: 'user-selection-inline',
    stickiness: monaco.editor.TrackedRangeStickiness.NeverGrowsWhenTypingAtEdges,
  };

  // Add CSS for this specific user's selection
  addSelectionStyles(collaborator.userId, backgroundColor, borderColor);

  // Apply decoration to the editor
  const decorationIds = editor.deltaDecorations([], [
    {
      range,
      options: decorationOptions,
    },
  ]);

  return decorationIds;
}

function addSelectionStyles(userId: string, backgroundColor: string, borderColor: string): void {
  
  // Remove existing styles for this user
  const existingStyle = document.head.querySelector(`style[data-user-selection="${userId}"]`);
  if (existingStyle) {
    existingStyle.remove();
  }

  // Create new styles
  const style = document.createElement('style');
  style.setAttribute('data-user-selection', userId);
  style.textContent = `
    .user-selection-${userId} {
      background-color: ${backgroundColor} !important;
      border: 1px solid ${borderColor} !important;
      border-radius: 2px !important;
      position: relative !important;
    }

    .user-selection-${userId}::before {
      content: '';
      position: absolute;
      top: -1px;
      left: -1px;
      right: -1px;
      bottom: -1px;
      background: linear-gradient(90deg, ${borderColor} 0%, transparent 100%);
      border-radius: 2px;
      opacity: 0.3;
      pointer-events: none;
      animation: selection-highlight 2s ease-out;
    }

    @keyframes selection-highlight {
      0% {
        opacity: 0.6;
        transform: scale(1.02);
      }
      100% {
        opacity: 0.3;
        transform: scale(1);
      }
    }

    .user-selection-inline {
      position: relative;
    }
  `;

  document.head.appendChild(style);
}

function hexToRgba(hex: string, alpha: number): string {
  // Remove # if present
  hex = hex.replace('#', '');
  
  // Parse hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Utility function to generate user colors
export function generateUserColor(userId: string): string {
  const colors = [
    '#FF6B6B', // Red
    '#4ECDC4', // Teal
    '#45B7D1', // Blue
    '#96CEB4', // Green
    '#FFEAA7', // Yellow
    '#DDA0DD', // Plum
    '#98D8C8', // Mint
    '#F7DC6F', // Light Yellow
    '#BB8FCE', // Light Purple
    '#85C1E9', // Light Blue
    '#F8C471', // Orange
    '#82E0AA', // Light Green
  ];
  
  // Generate a consistent color based on user ID
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  const index = Math.abs(hash) % colors.length;
  return colors[index];
}