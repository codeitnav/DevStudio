"use client";

import { useEffect } from "react";
import { editor } from "monaco-editor";
import { MonacoBinding } from "y-monaco";
import { WebsocketProvider } from "y-websocket";
import * as Y from "yjs";

export const useMonacoBinding = (
  yText: Y.Text | null,
  editorInstance: editor.IStandaloneCodeEditor | null,
  provider: WebsocketProvider | null
) => {
  useEffect(() => {
    if (!yText || !editorInstance || !provider) return; 

    const monacoBinding = new MonacoBinding(
      yText,
      editorInstance.getModel()!,
      new Set([editorInstance]),
      provider.awareness
    );

    return () => {
      monacoBinding.destroy();
    };
  }, [yText, editorInstance, provider]);
};
