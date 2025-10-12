'use client';

import { useRef, useState, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import LanguageSelector from "../../components/ui/LanguageSelector";
import { CODE_SNIPPETS } from "../../constants";
import Output from "../../components/ui/Output";
import type { editor } from "monaco-editor";
import FileExplorer from "../../components/ui/FileExplorer";
import { ChevronLeft, ChevronRight, Save } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import * as api from "@/lib/services/api"; 

const CodeEditor: React.FC = () => {
  const editorRef = useRef<editor.IStandaloneCodeEditor | null>(null);
  const [value, setValue] = useState<string>(CODE_SNIPPETS.javascript);
  const [language, setLanguage] = useState<string>("javascript");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false); 

  // Authentication Check
  const { user, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/login');
    }
  }, [user, isLoading, router]);

  const onMount = (editor: editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    editor.focus();
  };

  const onSelectLanguage = (language: string) => {
    setLanguage(language);
    setValue(CODE_SNIPPETS[language as keyof typeof CODE_SNIPPETS]);
    setActiveFile(null);
  };

  const handleFileSelect = (fileId: string, content: string, fileName: string) => {
    setValue(content);
    setActiveFile(fileId);
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: { [key: string]: string } = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript',
      'tsx': 'typescript', 'py': 'python', 'java': 'java', 'cpp': 'cpp',
      'c': 'c', 'html': 'html', 'css': 'css', 'json': 'json',
    };
    if (ext && langMap[ext]) {
      setLanguage(langMap[ext]);
    } else {
      setLanguage('plaintext');
    }
  };

  const handleSave = async () => {
    if (!activeFile) {
      alert("No file is open to save.");
      return;
    }
    setIsSaving(true);
    try {
      await api.updateFileContent(activeFile, value); 
      alert("File saved successfully!");
    } catch (error) {
      console.error("Failed to save file:", error);
      alert("Error: Could not save the file.");
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading || !user) {
      return <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">Loading...</div>;
  }

  return (
    <div className="flex h-screen bg-gray-900 text-white">
      <div className={`transition-all duration-300 ease-in-out flex-shrink-0 bg-gray-800 border-r border-gray-700 ${sidebarOpen ? "w-72" : "w-0"} overflow-hidden`}>
        {sidebarOpen && <FileExplorer onFileSelect={handleFileSelect} />}
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Controls Bar */}
        <div className="flex items-center gap-4 p-2 border-b border-gray-700 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg"
            title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
          >
            {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
          <div className="flex-1 flex items-center justify-between">
            <LanguageSelector language={language} onSelect={onSelectLanguage} />
          </div>
        </div>

        {/* Editor and Output Panes */}
        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          <div className="w-1/2 h-full">
            <Editor
              options={{ minimap: { enabled: false } }}
              height="100%"
              theme="vs-dark"
              language={language}
              value={value}
              onMount={onMount}
              onChange={(val) => setValue(val || "")}
            />
          </div>
          <div className="w-1/2 h-full">
            <Output
              editorRef={editorRef}
              language={language}
              activeFile={activeFile}
              isSaving={isSaving}
              onSave={handleSave}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CodeEditor;