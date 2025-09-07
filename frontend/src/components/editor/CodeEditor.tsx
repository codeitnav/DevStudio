import React, { useRef, useState, useCallback } from 'react';
import Editor, { OnMount, OnChange } from '@monaco-editor/react';
import * as monaco from 'monaco-editor';
import { EditorToolbar } from './EditorToolbar';
import { CollaborativeCursors } from './CollaborativeCursors';
import { UserSelections } from './UserSelections';
import { useTheme } from '../../hooks/useTheme';
import { useCollaborativeEditor } from '../../hooks/useCollaborativeEditor';
import { useResponsive } from '../../hooks/useResponsive';

export interface CodeEditorProps {
  value?: string;
  language?: string;
  onChange?: (value: string | undefined) => void;
  onLanguageChange?: (language: string) => void;
  readOnly?: boolean;
  height?: string | number;
  className?: string;
  // Collaborative editing props
  roomId?: string;
  currentUserId?: string;
  currentUsername?: string;
  enableCollaboration?: boolean;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  value = '',
  language = 'javascript',
  onChange,
  onLanguageChange,
  readOnly = false,
  height = '100%',
  className = '',
  roomId,
  currentUserId,
  currentUsername,
  enableCollaboration = false,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const { theme } = useTheme();
  const { isMobile, isTablet } = useResponsive();
  const [currentLanguage, setCurrentLanguage] = useState(language);

  // Initialize collaborative editing if enabled
  const collaborativeEditor = useCollaborativeEditor({
    roomId: roomId || '',
    currentUserId: currentUserId || '',
    currentUsername: currentUsername || '',
    editor: editorRef.current,
  });

  const handleEditorDidMount: OnMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    
    // Configure editor options based on device type
    const baseOptions = {
      fontSize: isMobile ? 12 : 14,
      fontFamily: 'JetBrains Mono, Consolas, Monaco, monospace',
      lineNumbers: 'on' as const,
      minimap: { enabled: !isMobile && !isTablet },
      scrollBeyondLastLine: false,
      automaticLayout: true,
      tabSize: 2,
      insertSpaces: true,
      wordWrap: 'on' as const,
      bracketPairColorization: { enabled: true },
      guides: {
        bracketPairs: true,
        indentation: true,
      },
      suggest: {
        showKeywords: true,
        showSnippets: true,
      },
      quickSuggestions: {
        other: true,
        comments: true,
        strings: true,
      },
      // Mobile-specific optimizations
      ...(isMobile && {
        scrollbar: {
          vertical: 'auto' as const,
          horizontal: 'auto' as const,
          verticalScrollbarSize: 8,
          horizontalScrollbarSize: 8,
        },
        overviewRulerBorder: false,
        overviewRulerLanes: 0,
        hideCursorInOverviewRuler: true,
        contextmenu: false, // Disable context menu on mobile for better touch experience
        quickSuggestions: false, // Disable quick suggestions on mobile to reduce clutter
      }),
      // Tablet-specific optimizations
      ...(isTablet && {
        scrollbar: {
          verticalScrollbarSize: 10,
          horizontalScrollbarSize: 10,
        },
      }),
    };

    editor.updateOptions(baseOptions);

    // Add keyboard shortcuts (desktop only)
    if (!isMobile) {
      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
        // Save functionality will be added later
        console.log('Save shortcut pressed');
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyF, () => {
        editor.getAction('actions.find')?.run();
      });

      editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyMod.Shift | monaco.KeyCode.KeyF, () => {
        editor.getAction('editor.action.startFindReplaceAction')?.run();
      });
    }

    // Mobile touch optimizations
    if (isMobile) {
      // Prevent zoom on double tap
      editor.onDidChangeConfiguration(() => {
        const domNode = editor.getDomNode();
        if (domNode) {
          domNode.style.touchAction = 'pan-x pan-y';
        }
      });
    }
  }, [isMobile, isTablet]);

  const handleEditorChange: OnChange = useCallback((value) => {
    onChange?.(value);
  }, [onChange]);

  const handleLanguageChange = useCallback((newLanguage: string) => {
    setCurrentLanguage(newLanguage);
    onLanguageChange?.(newLanguage);
  }, [onLanguageChange]);

  const getEditorTheme = () => {
    return theme === 'dark' ? 'vs-dark' : 'light';
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      <EditorToolbar
        language={currentLanguage}
        onLanguageChange={handleLanguageChange}
        onFormatCode={() => {
          editorRef.current?.getAction('editor.action.formatDocument')?.run();
        }}
        onToggleWordWrap={() => {
          const editor = editorRef.current;
          if (editor) {
            const currentWordWrap = editor.getOption(monaco.editor.EditorOption.wordWrap);
            editor.updateOptions({
              wordWrap: currentWordWrap === 'on' ? 'off' : 'on'
            });
          }
        }}
        onToggleMinimap={() => {
          const editor = editorRef.current;
          if (editor) {
            const currentMinimap = editor.getOption(monaco.editor.EditorOption.minimap);
            editor.updateOptions({
              minimap: { enabled: !currentMinimap.enabled }
            });
          }
        }}
      />
      <div className="flex-1 relative">
        <Editor
          height={height}
          language={currentLanguage}
          value={value}
          theme={getEditorTheme()}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          options={{
            readOnly,
            selectOnLineNumbers: true,
            roundedSelection: false,
            cursorStyle: 'line',
            automaticLayout: true,
            // Mobile-specific options
            ...(isMobile && {
              glyphMargin: false,
              folding: false,
              lineDecorationsWidth: 0,
              lineNumbersMinChars: 3,
              renderLineHighlight: 'none',
            }),
          }}
          loading={
            <div className="flex items-center justify-center h-full">
              <div className="text-gray-500 text-sm">Loading editor...</div>
            </div>
          }
        />
        {/* Collaborative editing components */}
        {enableCollaboration && roomId && currentUserId && (
          <>
            <CollaborativeCursors
              editor={editorRef.current}
              collaborators={collaborativeEditor.collaborators}
              currentUserId={currentUserId}
            />
            <UserSelections
              editor={editorRef.current}
              collaborators={collaborativeEditor.collaborators}
              currentUserId={currentUserId}
            />
          </>
        )}
      </div>
    </div>
  );
};