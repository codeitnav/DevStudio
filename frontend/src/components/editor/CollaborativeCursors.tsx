import React, { useEffect, useState, useRef, useMemo } from 'react';
import * as monaco from 'monaco-editor';
import type { CollaborativeUser } from '../../types/editor';

export interface CollaborativeCursorsProps {
  editor: monaco.editor.IStandaloneCodeEditor | null;
  collaborators: Map<string, CollaborativeUser>;
  currentUserId: string;
}

interface CursorWidget {
  id: string;
  domNode: HTMLElement;
  position: monaco.IPosition;
  userId: string;
}

export const CollaborativeCursors: React.FC<CollaborativeCursorsProps> = React.memo(({
  editor,
  collaborators,
  currentUserId,
}) => {
  const [_cursorWidgets, setCursorWidgets] = useState<Map<string, CursorWidget>>(new Map());
  const widgetIdsRef = useRef<string[]>([]);

  // Clean up widgets when component unmounts
  useEffect(() => {
    return () => {
      if (editor) {
        widgetIdsRef.current.forEach(widgetId => {
          editor.removeContentWidget({ getId: () => widgetId } as any);
        });
      }
    };
  }, [editor]);

  // Memoize filtered collaborators to avoid unnecessary re-renders
  const filteredCollaborators = useMemo(() => {
    const filtered = new Map<string, CollaborativeUser>();
    collaborators.forEach((collaborator, userId) => {
      if (userId !== currentUserId) {
        filtered.set(userId, collaborator);
      }
    });
    return filtered;
  }, [collaborators, currentUserId]);

  // Update cursor widgets when collaborators change
  useEffect(() => {
    if (!editor) return;

    // Remove existing widgets
    widgetIdsRef.current.forEach(widgetId => {
      editor.removeContentWidget({ getId: () => widgetId } as any);
    });
    widgetIdsRef.current = [];

    const newWidgets = new Map<string, CursorWidget>();

    // Create widgets for each collaborator (excluding current user)
    filteredCollaborators.forEach((collaborator, userId) => {
      const widgetId = `cursor-${userId}`;
      const position: monaco.IPosition = {
        lineNumber: collaborator.cursor.line,
        column: collaborator.cursor.column,
      };

      // Create cursor DOM element
      const cursorElement = createCursorElement(collaborator);
      
      // Create Monaco content widget
      const widget: monaco.editor.IContentWidget = {
        getId: () => widgetId,
        getDomNode: () => cursorElement,
        getPosition: () => ({
          position,
          preference: [monaco.editor.ContentWidgetPositionPreference.EXACT],
        }),
      };

      editor.addContentWidget(widget);
      widgetIdsRef.current.push(widgetId);

      newWidgets.set(userId, {
        id: widgetId,
        domNode: cursorElement,
        position,
        userId,
      });
    });

    setCursorWidgets(newWidgets);
  }, [editor, filteredCollaborators]);

  return null; // This component doesn't render anything directly
});

function createCursorElement(collaborator: CollaborativeUser): HTMLElement {
  const container = document.createElement('div');
  container.className = 'collaborative-cursor';
  container.style.cssText = `
    position: relative;
    pointer-events: none;
    z-index: 1000;
  `;

  // Create cursor line
  const cursorLine = document.createElement('div');
  cursorLine.className = 'cursor-line';
  cursorLine.style.cssText = `
    position: absolute;
    width: 2px;
    height: 18px;
    background-color: ${collaborator.color};
    border-radius: 1px;
    animation: cursor-blink 1s infinite;
    box-shadow: 0 0 3px rgba(0, 0, 0, 0.3);
  `;

  // Create user label
  const userLabel = document.createElement('div');
  userLabel.className = 'cursor-label';
  userLabel.textContent = collaborator.username;
  userLabel.style.cssText = `
    position: absolute;
    top: -24px;
    left: 0;
    background-color: ${collaborator.color};
    color: white;
    padding: 2px 6px;
    border-radius: 3px;
    font-size: 11px;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    white-space: nowrap;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    opacity: 0;
    transform: translateY(-2px);
    transition: opacity 0.2s ease, transform 0.2s ease;
    pointer-events: auto;
    cursor: default;
  `;

  // Show label on hover
  container.addEventListener('mouseenter', () => {
    userLabel.style.opacity = '1';
    userLabel.style.transform = 'translateY(0)';
  });

  container.addEventListener('mouseleave', () => {
    userLabel.style.opacity = '0';
    userLabel.style.transform = 'translateY(-2px)';
  });

  // Add typing indicator if user is typing
  if (collaborator.isTyping) {
    const typingIndicator = document.createElement('div');
    typingIndicator.className = 'typing-indicator';
    typingIndicator.style.cssText = `
      position: absolute;
      top: -6px;
      left: 4px;
      width: 8px;
      height: 8px;
      background-color: ${collaborator.color};
      border-radius: 50%;
      animation: typing-pulse 1.5s infinite;
    `;
    container.appendChild(typingIndicator);
  }

  container.appendChild(cursorLine);
  container.appendChild(userLabel);

  return container;
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
  @keyframes cursor-blink {
    0%, 50% { opacity: 1; }
    51%, 100% { opacity: 0.3; }
  }

  @keyframes typing-pulse {
    0%, 100% { 
      transform: scale(1);
      opacity: 0.7;
    }
    50% { 
      transform: scale(1.2);
      opacity: 1;
    }
  }

  .collaborative-cursor:hover .cursor-label {
    opacity: 1 !important;
    transform: translateY(0) !important;
  }
`;

if (!document.head.querySelector('style[data-collaborative-cursors]')) {
  style.setAttribute('data-collaborative-cursors', 'true');
  document.head.appendChild(style);
}