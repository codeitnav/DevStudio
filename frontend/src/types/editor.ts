// Collaborative editing related type definitions

export interface CursorPosition {
  line: number;
  column: number;
}

export interface TextSelection {
  startLine: number;
  startColumn: number;
  endLine: number;
  endColumn: number;
}

export interface CollaborativeUser {
  userId: string;
  username: string;
  cursor: CursorPosition;
  selection?: TextSelection;
  color: string;
  isTyping: boolean;
}

export interface EditorChange {
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
  text: string;
}

export interface EditorState {
  content: string;
  language: string;
  cursors: Map<string, CursorPosition>;
  selections: Map<string, TextSelection>;
  typingUsers: Set<string>;
}

export interface TypingIndicator {
  userId: string;
  username: string;
  isTyping: boolean;
  timestamp: Date;
}