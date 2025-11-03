"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Editor, type OnMount } from "@monaco-editor/react"
import type * as monaco from "monaco-editor"
import type { Text as YText } from "yjs"
import type { WebsocketProvider } from "y-websocket"
import { useMonacoBinding } from "@/hooks/y-monaco"
import { executeCode } from "@/lib/services/piston"
import * as api from "@/lib/services/api"
import {
  LANGUAGE_VERSIONS,
  LANGUAGE_MAPPING,
  CODE_SNIPPETS,
  LANGUAGE_EXTENSIONS,
} from "@/constants"
import { Save } from "lucide-react"
import type { SharedFileSystemMap } from "@/hooks/useYjs" // Corrected import path

interface CodeEditorProps {
  yText: YText
  provider: WebsocketProvider | null
  fileName: string | null
  roomId: string
  // Props needed for renaming
  yNodeMap: SharedFileSystemMap | null
  selectedFileId: string | null
  fileContentId: string | null
  onFileSelect: (fileId: string, fileContentId: string, fileName: string) => void
}

export const CodeEditor: React.FC<CodeEditorProps> = ({
  yText,
  provider,
  fileName,
  roomId,
  // Destructure new props
  yNodeMap,
  selectedFileId,
  fileContentId,
  onFileSelect,
}) => {
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const [editorInstance, setEditorInstance] = useState<monaco.editor.IStandaloneCodeEditor | null>(null)

  const [selectedLanguage, setSelectedLanguage] = useState("javascript")
  const [output, setOutput] = useState<string | null>(null)
  const [stderr, setStderr] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveMessage, setSaveMessage] = useState<string | null>(null)

  const handleEditorDidMount: OnMount = (editor) => {
    editorRef.current = editor
    setEditorInstance(editor)
  }

  useMonacoBinding(yText, editorInstance, provider)

  useEffect(() => {
    if (fileName && yText?.doc) {
      const ext = "." + fileName.split(".").pop()
      const language = (LANGUAGE_MAPPING as Record<string, string>)[ext]
      const newLanguage =
        language && LANGUAGE_VERSIONS[language as keyof typeof LANGUAGE_VERSIONS]
          ? language
          : "javascript"

      const oldLanguage = selectedLanguage

      setSelectedLanguage(newLanguage)

      const currentContent = yText.toString()
      const oldSnippet = CODE_SNIPPETS[oldLanguage as keyof typeof CODE_SNIPPETS]
      const newSnippet = CODE_SNIPPETS[newLanguage as keyof typeof CODE_SNIPPETS]

      if (newSnippet && newLanguage !== oldLanguage) {
        if (currentContent.trim() === "" || currentContent === oldSnippet) {
          yText.doc.transact(() => {
            yText.delete(0, yText.length)
            yText.insert(0, newSnippet)
          })
        }
      }
    }
  }, [fileName, yText])

  const handleLanguageChange = (newLanguage: string) => {
    if (newLanguage === selectedLanguage) return

    setSelectedLanguage(newLanguage)

    const snippet = CODE_SNIPPETS[newLanguage as keyof typeof CODE_SNIPPETS]
    const newExtension = LANGUAGE_EXTENSIONS[newLanguage as keyof typeof LANGUAGE_EXTENSIONS]

    if (!newExtension) return 

    if (yText && snippet) {
      yText.doc?.transact(() => {
        yText.delete(0, yText.length)
        yText.insert(0, snippet)
      })
    }

    if (fileName && selectedFileId && yNodeMap && fileContentId) {
      const lastDotIndex = fileName.lastIndexOf('.')
      const baseName = lastDotIndex !== -1 ? fileName.substring(0, lastDotIndex) : fileName
      
      const newFileName = baseName + newExtension

      if (newFileName === fileName) return 

      const fileNode = yNodeMap.get(selectedFileId)
      if (fileNode) {
        fileNode.doc?.transact(() => {
          fileNode.set("name", newFileName)
        })

        onFileSelect(selectedFileId, fileContentId, newFileName)
      }
    }
  }

  const handleRunCode = async () => {
    const sourceCode = editorRef.current?.getValue()
    if (!sourceCode) return

    setIsLoading(true)
    setOutput(null)
    setStderr(null)

    try {
      const result = await executeCode(selectedLanguage, sourceCode)
      setOutput(result.run.stdout)
      setStderr(result.run.stderr)
    } catch (error: any) {
      console.error("Error executing code:", error)
      setStderr(error.response?.data?.message || error.message || "An unknown error occurred.")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSaveProject = async () => {
    setIsSaving(true)
    setSaveMessage(null)
    try {
      await api.saveProject(roomId)
      setSaveMessage("Saved!")
      setTimeout(() => setSaveMessage(null), 2000)
    } catch (error: any) {
      console.error("Failed to save project:", error)
      setSaveMessage("Failed!")
      setTimeout(() => setSaveMessage(null), 3000) 
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 sm:p-3 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-2">
          <label htmlFor="language-select" className="text-xs sm:text-sm whitespace-nowrap">
            Language:
          </label>
          <select
            id="language-select"
            value={selectedLanguage}
            onChange={(e) => handleLanguageChange(e.target.value)}
            className="bg-gray-700 text-white p-1 sm:p-2 rounded-md text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {Object.keys(LANGUAGE_VERSIONS).map((lang) => (
              <option key={lang} value={lang}>
                {lang}
              </option>
            ))}
          </select>
        </div>

        {/* Button container */}
        <div className="flex items-center gap-2">
          {/* Save Button */}
          <button
            onClick={handleSaveProject}
            disabled={isSaving}
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1 px-3 sm:px-4 rounded-md text-xs sm:text-sm disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center whitespace-nowrap transition-all duration-150"
            style={{ minWidth: '80px', justifyContent: 'center' }} 
          >
            {isSaving ? (
              <svg
                className="animate-spin h-3 w-3 sm:h-4 sm:w-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            ) : saveMessage ? (
              <span className="text-xs">{saveMessage}</span>
            ) : (
              <>
                <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                <span>Save</span>
              </>
            )}
          </button>

          {/* Run Button */}
          <button
            onClick={handleRunCode}
            disabled={isLoading}
            className="bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-3 sm:px-4 rounded-md text-xs sm:text-sm disabled:bg-gray-600 disabled:cursor-not-allowed flex items-center whitespace-nowrap"
          >
            {isLoading ? (
              <svg
                className="animate-spin -ml-1 mr-2 h-3 w-3 sm:h-4 sm:h-4 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
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
                className="w-3 h-3 sm:w-4 sm:h-4 mr-1"
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
            fontSize: 12,
            wordWrap: "on",
            automaticLayout: true,
          }}
        />
      </div>

      <div className="h-32 sm:h-48 flex-shrink-0 bg-gray-950 border-t border-gray-700 p-2 sm:p-3 overflow-y-auto">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-400 mb-1">Output:</h3>
        {output && <pre className="text-xs sm:text-sm text-white whitespace-pre-wrap font-mono">{output}</pre>}
        {stderr && <pre className="text-xs sm:text-sm text-red-400 whitespace-pre-wrap font-mono">{stderr}</pre>}
        {!isLoading && !output && !stderr && (
          <p className="text-xs sm:text-sm text-gray-500">Click "Run" to execute the code.</p>
        )}
      </div>
    </div>
  )
}

export default CodeEditor