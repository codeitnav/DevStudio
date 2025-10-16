'use client';

import { useRef, useState, useEffect } from "react";
import { Editor } from "@monaco-editor/react";
import type * as Monaco from 'monaco-editor';
import * as Y from 'yjs';
import { WebrtcProvider } from 'y-webrtc';
import { WebsocketProvider } from 'y-websocket';
import { MonacoBinding } from 'y-monaco';

import LanguageSelector from "../../../components/ui/LanguageSelector";
import Output from "../../../components/ui/Output";
import FileExplorer from "../../../components/ui/FileExplorer";
import { ChevronLeft, ChevronRight, Share2, Copy } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter, useParams } from "next/navigation";
import * as api from "@/lib/services/api";

const CodeEditor: React.FC = () => {
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const [language, setLanguage] = useState<string>("javascript");
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  const [activeFile, setActiveFile] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [copied, setCopied] = useState(false);

  // Ref to hold all Yjs instances for state management and cleanup
  const yjsInstances = useRef<{
    doc: Y.Doc | null;
    webrtcProvider: WebrtcProvider | null;
    websocketProvider: WebsocketProvider | null;
    binding: MonacoBinding | null;
    yfiles: Y.Array<any> | null;
    ycontents: Y.Map<Y.Text> | null;
  }>({ doc: null, webrtcProvider: null, websocketProvider: null, binding: null, yfiles: null, ycontents: null });

  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  // Main effect for setting up and tearing down Yjs connection
  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/?login=true');
    }

    // 1. Initialize YJS Document and Shared Types
    const doc = new Y.Doc();
    const yfiles = doc.getArray('files'); // For file tree structure
    const ycontents = doc.getMap<Y.Text>('contents'); // For content of each file

    // 2. Connect to peers with providers
    const wsProvider = new WebsocketProvider('ws://localhost:5000', roomId, doc);
    const webrtcProvider = new WebrtcProvider(roomId, doc);

    // Store instances in ref
    yjsInstances.current = {
      ...yjsInstances.current,
      doc,
      webrtcProvider,
      websocketProvider: wsProvider,
      yfiles,
      ycontents,
    };

    // 3. Cleanup function on component unmount
    return () => {
      yjsInstances.current.doc?.destroy();
      yjsInstances.current.websocketProvider?.destroy();
      yjsInstances.current.webrtcProvider?.destroy();
      yjsInstances.current.binding?.destroy();
    };
  }, [roomId, isLoading, user, router]);

  // Effect for handling editor binding when the active file changes
  useEffect(() => {
    // Destroy the previous binding if it exists
    yjsInstances.current.binding?.destroy();

    if (activeFile && editorRef.current && yjsInstances.current.ycontents && yjsInstances.current.webrtcProvider) {
      const { ycontents, webrtcProvider } = yjsInstances.current;

      // Get or create the Y.Text for the active file
      let ytext = ycontents.get(activeFile);
      if (!ytext) {
        ytext = new Y.Text();
        ycontents.set(activeFile, ytext);
      }
      
      const editorModel = editorRef.current.getModel();
      
      // Create a new binding for the active file's content
      if (editorModel) {
        yjsInstances.current.binding = new MonacoBinding(
          ytext,
          editorModel,
          new Set([editorRef.current]),
          webrtcProvider.awareness
        );
      }
    }
  }, [activeFile]);

  const handleEditorDidMount = (editor: Monaco.editor.IStandaloneCodeEditor) => {
    editorRef.current = editor;
    editor.focus();
  };
  
  const handleFileSelect = (fileId: string, fileName: string) => {
    // Set the active file ID, which triggers the useEffect above to handle the binding
    setActiveFile(fileId);
    
    // Update language based on file extension
    const ext = fileName.split('.').pop()?.toLowerCase();
    const langMap: { [key: string]: string } = {
      'js': 'javascript', 'jsx': 'javascript', 'ts': 'typescript',
      'tsx': 'typescript', 'py': 'python', 'java': 'java', 'cpp': 'cpp',
      'c': 'c', 'html': 'html', 'css': 'css', 'json': 'json',
    };
    setLanguage((ext && langMap[ext]) || 'plaintext');
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const handleSave = async () => {
    if (!activeFile || !yjsInstances.current.ycontents) return;
    setIsSaving(true);
    try {
      const contentToSave = yjsInstances.current.ycontents.get(activeFile)?.toString();
      if (contentToSave !== undefined) {
        await api.updateFileContent(activeFile, contentToSave);
      }
    } catch (error) {
      console.error("Failed to save file:", error);
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
        {sidebarOpen && yjsInstances.current.doc && (
          <FileExplorer
            yDoc={yjsInstances.current.doc}
            onFileSelect={handleFileSelect}
          />
        )}
      </div>
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex items-center justify-between gap-4 p-2 border-b border-gray-700 flex-shrink-0">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="bg-gray-700 hover:bg-gray-600 p-2 rounded-lg"
              title={sidebarOpen ? "Close Sidebar" : "Open Sidebar"}
            >
              {sidebarOpen ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
            <LanguageSelector language={language} onSelect={setLanguage} />
          </div>
          <button
            onClick={handleShare}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {copied ? <Copy className="h-5 w-5" /> : <Share2 className="h-5 w-5" />}
            {copied ? "Copied!" : "Share"}
          </button>
        </div>

        <div className="flex-1 flex gap-4 p-4 overflow-hidden">
          <div className="w-1/2 h-full">
            <Editor
              options={{ minimap: { enabled: false } }}
              height="100%"
              theme="vs-dark"
              language={language}
              onMount={handleEditorDidMount}
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