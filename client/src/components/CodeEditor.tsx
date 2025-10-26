"use client";

import React, { useState, useRef, useEffect } from "react";
import { Editor, OnMount } from "@monaco-editor/react";
import type * as monaco from "monaco-editor";
import { Text as YText } from "yjs";
import { WebsocketProvider } from "y-websocket";
import { useMonacoBinding } from "@/hooks/y-monaco";
import { executeCode } from "@/lib/services/piston";
import { LANGUAGE_VERSIONS } from "@/constants";
import { Share2 } from "lucide-react";

interface CodeEditorProps {
  yText: YText;
  provider: WebsocketProvider | null;
  roomId: string;
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  yText,
  provider,
  roomId,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null);
  const [editorInstance, setEditorInstance] =
    useState<monaco.editor.IStandaloneCodeEditor | null>(null);

  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [output, setOutput] = useState<string | null>(null);
  const [stderr, setStderr] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor;
    setEditorInstance(editor);
  };

  useMonacoBinding(yText, editorInstance, provider);

  const handleRunCode = async () => {
    const sourceCode = editorRef.current?.getValue();
    if (!sourceCode) return;

    setIsLoading(true);
    setOutput(null);
    setStderr(null);

    try {
      const result = await executeCode(selectedLanguage, sourceCode);
      setOutput(result.run.stdout);
      setStderr(result.run.stderr);
    } catch (error: any) {
      console.error("Error executing code:", error);
      setStderr(
        error.response?.data?.message ||
          error.message ||
          "An unknown error occurred."
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = () => {
    if (!roomId) return;
    navigator.clipboard.writeText(roomId).then(
      () => {
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000); // Reset after 2 seconds
      },
      (err) => {
        console.error("Failed to copy room ID: ", err);
      }
    );
  };

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <div>
          <label htmlFor="language-select" className="mr-2 text-sm">
            Language:
          </label>
          <select
            id="language-select"
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="bg-gray-700 text-white p-1 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.keys(LANGUAGE_VERSIONS).map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleShare}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-4 rounded-md text-sm flex items-center transition-all"
            title="Copy Room ID to share"
          >
            <Share2 className="w-4 h-4 mr-1" />
            {isCopied ? "Copied!" : "Share"}
          </button>

          <button
            onClick={handleRunCode}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-4 rounded-md text-sm disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center"
          >
            {isLoading ? (
              <svg
                className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="w-4 h-4 mr-1"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A.5.5 0 009 7.618v4.764a.5.5 0 00.555.45l3.223-1.9a.5.5 0 000-.9l-3.223-1.9z"
                  clipRule="evenodd"
                />
              </svg>
            )}
            {isLoading ? "Running..." : "Run"}
          </button>
        </div>
      </div>

      {/* Editor */}
      <div className="flex-grow min-h-0">
        <Editor
          height="100%"
          width="100%"
          theme="vs-dark"
          language={selectedLanguage}
          onMount={handleEditorDidMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            wordWrap: "on",
            automaticLayout: true,
          }}
        />
      </div>

      {/* Output Console */}
      <div className="h-48 flex-shrink-0 bg-gray-950 border-t border-gray-700 p-2 overflow-y-auto">
        <h3 className="text-sm font-semibold text-gray-400 mb-1">Output:</h3>
        {output && (
          <pre className="text-sm text-white whitespace-pre-wrap">
            {output}
          </pre>
        )}
        {stderr && (
          <pre className="text-sm text-red-400 whitespace-pre-wrap">
            {stderr}
          </pre>
        )}
        {!isLoading && !output && !stderr && (
          <p className="text-sm text-gray-500">
            Click "Run" to execute the code.
          </p>
        )}
      </div>
    </div>
  );
};

export default CodeEditor;