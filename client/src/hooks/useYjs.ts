"use client";

import { useEffect, useState } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { User } from "@/lib/services/api";
import { getToken } from "@/lib/auth"; // Import the getToken function

// --- YJS DATA MODEL ---
// This is the new, normalized data structure as requested.

/**
 * Represents a node in the file system Y.Map.
 * Note: When retrieved from Y.Map, 'children' will be a Y.Array.
 */
export interface FileSystemNode {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null; // null for root items
  children: Y.Array<string>; // Y.Array of child node IDs
  fileContentId?: string; // A unique Y.Doc ID for this file's content
  tombstone?: boolean; // For soft deletes, if needed
}

/**
 * The Y.Map shared type.
 * Keys are node IDs (string), values are Y.Map representations
 * of FileSystemNode (but Yjs maps/arrays, not plain JS objects).
 */
export type SharedFileSystemMap = Y.Map<any>;

// Define the return type of the hook
interface UseYjsHook {
  ydoc: Y.Doc | null;
  provider: WebsocketProvider | null;
  yNodeMap: SharedFileSystemMap | null; // Renamed from yFiles
  connectionStatus: string;
}

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000"; // Default to port 5000

/**
 * Custom hook to manage Yjs connection for a *specific* Y.Doc.
 * @param docName The name of the Y.Doc to connect to (e.g., "files-room123").
 * @param user The currently authenticated user.
 * @param actualRoomId The *actual* room ID (e.g., "room123") for auth query param.
 */
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
    if (!docName || !user || !actualRoomId) {
      // Don't connect if we're missing info
      return;
    }

    // 1. Create the Y.Doc
    const doc = new Y.Doc();
    
    // 2. Get the shared Y.Map for the file system
    // This is the new data model.
    const nodeMap = doc.getMap<any>("file-system-map");

    // 3. Get auth token and create query params
    const token = getToken();
    const params = {
      token: token || "",
      roomId: actualRoomId, // Pass the *actual* room ID for auth
    };

    // 4. Create the WebSocket Provider
    const wsProvider = new WebsocketProvider(WS_URL, docName, doc, { params });

    // Listen to connection status changes
    wsProvider.on("status", (event: { status: string }) => {
      setConnectionStatus(event.status);
    });

    // 5. Set up Awareness
    wsProvider.awareness.setLocalStateField("user", {
      name: user.username,
      email: user.email,
      color: `#${Math.floor(Math.random() * 16777215).toString(16)}`,
    });

    // Set state
    setYdoc(doc);
    setProvider(wsProvider);
    setYNodeMap(nodeMap);

    // 6. Cleanup function
    return () => {
      wsProvider.disconnect();
      doc.destroy();
      setYdoc(null);
      setProvider(null);
      setYNodeMap(null);
      setConnectionStatus("disconnected");
    };
  }, [docName, user, actualRoomId]); // Re-connect if these change

  return { ydoc, provider, yNodeMap, connectionStatus };
};
