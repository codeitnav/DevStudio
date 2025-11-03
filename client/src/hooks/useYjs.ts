"use client";

import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { User } from "@/lib/services/api";
import { getToken } from "@/lib/auth";

// Represents a node in the file system
export interface FileSystemNode {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
  children: Y.Array<string>; 
  fileContentId?: string; 
  tombstone?: boolean; 
}

// Shared Y.Map type for file system
export type SharedFileSystemMap = Y.Map<any>;

// Return type of the hook
interface UseYjsHook {
  ydoc: Y.Doc | null;
  provider: WebsocketProvider | null;
  yNodeMap: SharedFileSystemMap | null; // file system map
  connectionStatus: string;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000"; 

// Custom hook to manage Yjs connection for a document
export const useYjs = (
  docName: string,
  user: Partial<User> | null,
  actualRoomId: string
): UseYjsHook => {
  const [ydoc, setYdoc] = useState<Y.Doc | null>(null);
  const [provider, setProvider] = useState<WebsocketProvider | null>(null);
  const [yNodeMap, setYNodeMap] = useState<SharedFileSystemMap | null>(null);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");

  useEffect(() => {
    if (!docName || !user || !actualRoomId) return; // skip if missing info

    const doc = new Y.Doc(); 
    const nodeMap = doc.getMap<any>("file-system-map"); // get shared file system map

    const token = getToken();
    const params = { token: token || "", roomId: actualRoomId }; // auth query params

    const wsProvider = new WebsocketProvider(WS_URL, docName, doc, { params }); // create WS provider

    wsProvider.on("status", (event: { status: string }) => setConnectionStatus(event.status)); // update connection status

    // set local user awareness
    wsProvider.awareness.setLocalStateField("user", {
      name: user.username,
      email: user.email,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    });

    // update state
    setYdoc(doc);
    setProvider(wsProvider);
    setYNodeMap(nodeMap);

    return () => {
      wsProvider.disconnect(); 
      doc.destroy(); 
      setYdoc(null);
      setProvider(null);
      setYNodeMap(null);
      setConnectionStatus("disconnected");
    };
  }, [docName, user, actualRoomId]); // reconnect if inputs change

  return { ydoc, provider, yNodeMap, connectionStatus };
};