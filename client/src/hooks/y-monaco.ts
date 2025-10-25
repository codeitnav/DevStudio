"use client";

import { useEffect } from "react";
import { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

/**
 * Custom hook to bind a Y.Text object to a Monaco editor instance.
 *
 * @param yText The Y.Text type to bind.
 * @param editorInstance The Monaco editor instance.
 *When * @param provider The WebsocketProvider (for awareness state).
 */
export const useMonacoBinding = (
  yText: Y.Text | null,
  // Use the type via the imported 'editor' namespace
  editorInstance: editor.IStandaloneCodeEditor | null,
  provider: WebsocketProvider | null
) => {
  useEffect(() => {
    if (!yText || !editorInstance || !provider) {
      // If any of the required objects are missing, don't do anything.
      return;
    }

    // 1. Create the Monaco Binding
    // This object does the magic of syncing the Y.Text with the editor content.
    const monacoBinding = new MonacoBinding(
      yText,
      editorInstance.getModel()!,
      new Set([editorInstance]),
      provider.awareness
    );

    // 2. Cleanup function
    // This is run when the component unmounts or the dependencies change.
    // It's crucial to destroy the binding to prevent memory leaks.
    return () => {
      monacoBinding.destroy();
    };
  }, [yText, editorInstance, provider]); // Re-create the binding if these change
};

