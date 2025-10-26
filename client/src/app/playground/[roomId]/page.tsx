"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import {
  Panel,
  PanelGroup,
  PanelResizeHandle,
  ImperativePanelHandle, // Corrected import
} from "react-resizable-panels";
import * as Y from "yjs";
import { Text as YText } from "yjs";
import { WebsocketProvider } from "y-websocket";
import { Folder, FileText, Loader2, GripVertical } from "lucide-react";

import FileExplorer from "@/components/FileExplorer";
import { CodeEditor } from "@/components/CodeEditor";
import ActiveMembers from "@/components/ActiveMembers";
import { useYjs } from "@/hooks/useYjs";
import { useAuth } from "@/context/AuthContext";
import { getToken } from "@/lib/auth";

export const getFileRoomName = (roomId: string): string => `files-${roomId}`;
export const getFileDocName = (fileContentId: string): string =>
  `file-${fileContentId}`;

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000";

const LoadingSpinner = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
    <Loader2 className="animate-spin h-6 w-6 text-blue-400" />
    <p className="ml-4 text-lg">Connecting to workspace...</p>
  </div>
);

export default function PlaygroundPage() {
  const params = useParams();
  const roomId = params.roomId as string;
  const { user } = useAuth();

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null);
  const [selectedFileContentId, setSelectedFileContentId] = useState<
    string | null
  >(null);
  const [fileProvider, setFileProvider] = useState<WebsocketProvider | null>(
    null
  );
  const [fileYText, setFileYText] = useState<YText | null>(null);
  const [isMembersPanelCollapsed, setIsMembersPanelCollapsed] = useState(false);
  const membersPanelRef = useRef<ImperativePanelHandle>(null); // Corrected type

  const fileRoomName = useMemo(() => getFileRoomName(roomId), [roomId]);

  // This provider has the awareness for the whole room (File System + Active Members)
  const {
    ydoc: fileSystemDoc,
    provider: fileSystemProvider,
    yNodeMap,
    connectionStatus: fileSystemStatus,
  } = useYjs(fileRoomName, user || null, roomId);

  // Establish file-level Yjs provider when a file is opened
  useEffect(() => {
    // Disconnect from previous file provider if one exists
    if (fileProvider) {
      fileProvider.disconnect();
      fileProvider.doc.destroy();
      setFileProvider(null);
      setFileYText(null);
    }

    // Connect to the new file's Yjs document
    if (selectedFileContentId && user) {
      const fileDocName = getFileDocName(selectedFileContentId);
      const fileDoc = new Y.Doc();
      const token = getToken();
      const params = { token: token || "", roomId };
      const newProvider = new WebsocketProvider(WS_URL, fileDocName, fileDoc, {
        params,
      });

      // Set awareness for this specific file (e.g., cursor position)
      // Note: This is separate from the room's main awareness (fileSystemProvider)
      newProvider.awareness.setLocalStateField("user", {
        name: user.username,
        email: user.email,
        color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
      });

      const newYText = fileDoc.getText("file-content");
      setFileProvider(newProvider);
      setFileYText(newYText);
    }

    // Cleanup on component unmount or file change
    return () => {
      if (fileProvider) {
        fileProvider.disconnect();
        fileProvider.doc.destroy();
      }
    };
  }, [selectedFileContentId, user, roomId]); // Re-run when the selected file changes

  const handleFileSelect = (fileId: string, fileContentId: string) => {
    setSelectedFileId(fileId);
    setSelectedFileContentId(fileContentId);
  };

  // Toggles the collapsible state of the members panel
  const toggleMembersPanel = () => {
    const panel = membersPanelRef.current;
    if (panel) {
      if (panel.isCollapsed()) {
        panel.expand();
      } else {
        panel.collapse();
      }
    }
  };

  // Show loading spinner until the main file system connection is ready
  if (fileSystemStatus !== "connected" || !yNodeMap) {
    return <LoadingSpinner />;
  }

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-800">
      <PanelGroup direction="horizontal">
        {/* Panel 1: File Explorer */}
        <Panel defaultSize={15} minSize={15} className="min-w-[200px]">
          <div className="h-full p-2 bg-gray-900 text-white flex flex-col">
            <h2 className="flex items-center text-lg font-semibold mb-2 p-2 text-gray-300 flex-shrink-0">
              <Folder className="w-5 h-5 mr-2 text-gray-500" />
              Files
            </h2>
            <FileExplorer
              yNodeMap={yNodeMap}
              ydoc={fileSystemDoc!}
              provider={fileSystemProvider}
              onFileSelect={handleFileSelect}
              selectedFileId={selectedFileId}
            />
          </div>
        </Panel>

        <PanelResizeHandle className="flex w-2 items-center justify-center bg-gray-800 hover:bg-blue-600 transition-colors data-[resizing]:bg-blue-600">
          <GripVertical className="w-2.5 h-8 text-gray-500" />
        </PanelResizeHandle>

        {/* Panel 2: Code Editor */}
        <Panel defaultSize={65} minSize={30}>
          {selectedFileId && fileYText && fileProvider ? (
            <CodeEditor
              yText={fileYText}
              provider={fileProvider}
              roomId={roomId} // Pass roomId for the "Share" button
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-gray-900 text-gray-600">
              <FileText className="w-16 h-16 mb-4" />
              <p className="text-lg text-gray-500">
                Select a file to start editing.
              </p>
            </div>
          )}
        </Panel>

        <PanelResizeHandle className="flex w-2 items-center justify-center bg-gray-800 hover:bg-blue-600 transition-colors data-[resizing]:bg-blue-600">
          <GripVertical className="w-2.5 h-8 text-gray-500" />
        </PanelResizeHandle>

        {/* Panel 3: Active Members (Collapsible) */}
        <Panel
          ref={membersPanelRef}
          defaultSize={20}
          minSize={15}
          collapsible={true}
          collapsedSize={4} // Size when collapsed (for the icon)
          onCollapse={() => setIsMembersPanelCollapsed(true)}
          onExpand={() => setIsMembersPanelCollapsed(false)}
          className="min-w-[60px]" // min-w to accommodate the collapsed icon
        >
          <ActiveMembers
            provider={fileSystemProvider} // Use the main provider for room awareness
            currentUser={user}
            isCollapsed={isMembersPanelCollapsed}
            onToggle={toggleMembersPanel}
          />
        </Panel>
      </PanelGroup>
    </div>
  );
}

