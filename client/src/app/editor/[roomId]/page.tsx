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
  
  // Ref to hold Yjs instances for cleanup
  const yjsInstances = useRef<{
    doc: Y.Doc | null;
    webrtcProvider: WebrtcProvider | null;
    websocketProvider: WebsocketProvider | null;
    binding: MonacoBinding | null;
  }>({ doc: null, webrtcProvider: null, websocketProvider: null, binding: null });


  const { user, isLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const roomId = params.roomId as string;

  useEffect(() => {
    if (!isLoading && !user) {
      router.push('/?login=true');
    }
    
    // Cleanup function on component unmount
    return () => {
      yjsInstances.current.doc?.destroy();
      yjsInstances.current.webrtcProvider?.destroy();
      yjsInstances.current.websocketProvider?.destroy();
      yjsInstances.current.binding?.destroy();
    };
  }, [isLoading, user, router]);


  const handleEditorDidMount = (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    editorRef.current = editor;
    editor.focus();

    // 1. Initialize YJS
    const doc = new Y.Doc();
    const ytext = doc.getText("monaco"); // a shared text object
    yjsInstances.current.doc = doc;

    // 2. Connect to peers with WebRTC and WebSocket providers
    // WebSocket is for resilience and peer discovery
    const wsProvider = new WebsocketProvider(
      'ws://localhost:5000', // Your server's WebSocket endpoint
      roomId,
      doc
    );
    yjsInstances.current.websocketProvider = wsProvider;

    // WebRTC is for ultra-low-latency peer-to-peer editing
    const webrtcProvider = new WebrtcProvider(roomId, doc);
    yjsInstances.current.webrtcProvider = webrtcProvider;

    // 3. Bind Yjs to the Monaco Editor
    const binding = new MonacoBinding(
      ytext,
      editor.getModel()!,
      new Set([editor]),
      webrtcProvider.awareness
    );
    yjsInstances.current.binding = binding;
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  const onSelectLanguage = (language: string) => {
    setLanguage(language);
    // Note: With Yjs, we don't set value directly.
    // Instead, you might want to clear the shared doc and insert snippet content.
  };

  const handleFileSelect = async (fileId: string, content: string, fileName: string) => {
    setActiveFile(fileId);
    
    // When a new file is selected, update the shared document for everyone
    const ytext = yjsInstances.current.doc?.getText("monaco");
    if (ytext) {
      yjsInstances.current.doc?.transact(() => {
        ytext.delete(0, ytext.length); // Clear current content
        ytext.insert(0, content); // Insert new content
      });
    }

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
    if (!activeFile || !yjsInstances.current.doc) return;
    setIsSaving(true);
    try {
      const currentContent = yjsInstances.current.doc.getText("monaco").toString();
      await api.updateFileContent(activeFile, currentContent);
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
        {sidebarOpen && <FileExplorer onFileSelect={handleFileSelect} />}
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
            <LanguageSelector language={language} onSelect={onSelectLanguage} />
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
              onMount={handleEditorDidMount} // Use the new mount function
              // value and onChange are no longer needed; y-monaco handles them
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