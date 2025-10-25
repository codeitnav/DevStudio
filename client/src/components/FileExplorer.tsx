"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import * as Y from "yjs";
import { WebsocketProvider } from "y-websocket";
import { File, Folder, ChevronRight, Plus, Trash2, Edit, Lock } from "lucide-react";
import { SharedFileSystemMap } from "@/hooks/useYjs";

interface FileSystemNode {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
  children: string[];
  fileContentId?: string;
}

const yNodeToJs = (yMap: Y.Map<any>): FileSystemNode => ({
  id: yMap.get("id"),
  name: yMap.get("name"),
  type: yMap.get("type"),
  parentId: yMap.get("parentId"),
  children: (yMap.get("children") as Y.Array<string>).toArray(),
  fileContentId: yMap.get("fileContentId"),
});

interface FileExplorerProps {
  yNodeMap: SharedFileSystemMap | null;
  ydoc: Y.Doc | null;
  provider: WebsocketProvider | null;
  onFileSelect: (fileId: string, fileContentId: string) => void;
  selectedFileId: string | null;
}

const FileExplorer: React.FC<FileExplorerProps> = ({
  yNodeMap,
  ydoc,
  provider,
  onFileSelect,
  selectedFileId,
}) => {
  const [fileSystem, setFileSystem] = useState<{ [id: string]: FileSystemNode }>({});
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [renamingSet, setRenamingSet] = useState<Set<string>>(new Set());

  // Sync local state with Yjs document
  useEffect(() => {
    if (!yNodeMap) {
      setFileSystem({});
      return;
    }

    const updateStateFromYjs = () => {
      const newFileSystem: { [id: string]: FileSystemNode } = {};
      yNodeMap.forEach((yMap, id) => {
        newFileSystem[id] = yNodeToJs(yMap);
      });
      setFileSystem(newFileSystem);
    };

    updateStateFromYjs();
    const observer = () => updateStateFromYjs();
    yNodeMap.observeDeep(observer);

    return () => yNodeMap.unobserveDeep(observer);
  }, [yNodeMap]);

  // Awareness state sync for rename lock
  useEffect(() => {
    if (!provider) return;

    const observer = () => {
      const states = Array.from(provider.awareness.getStates().values());
      const renamingIds = new Set<string>(
        states.map((state) => state.renaming).filter(Boolean)
      );
      setRenamingSet(renamingIds);
    };

    provider.awareness.on("change", observer);
    observer();

    return () => provider.awareness.off("change", observer);
  }, [provider]);

  // File & folder creation
  const handleCreate = (type: "file" | "folder", parentId: string | null) => {
    if (!ydoc || !yNodeMap) return;

    const newName = type === "file" ? "untitled.js" : "New Folder";
    const newId = crypto.randomUUID();
    const fileContentId = type === "file" ? crypto.randomUUID() : undefined;

    const newNode = new Y.Map();
    newNode.set("id", newId);
    newNode.set("name", newName);
    newNode.set("type", type);
    newNode.set("parentId", parentId);
    newNode.set("children", new Y.Array<string>());
    if (fileContentId) newNode.set("fileContentId", fileContentId);

    ydoc.transact(() => {
      yNodeMap.set(newId, newNode);
      if (parentId) {
        const parentNode = yNodeMap.get(parentId);
        if (parentNode) {
          const parentChildren = parentNode.get("children") as Y.Array<string>;
          parentChildren.push([newId]);
        }
      }
    });

    if (type === "file" && fileContentId) onFileSelect(newId, fileContentId);
    if (parentId) setExpandedFolders((prev) => new Set(prev).add(parentId));
  };

  // Recursive delete
  const handleDelete = (itemId: string) => {
    if (!ydoc || !yNodeMap) return;

    const nodeToDelete = yNodeMap.get(itemId);
    if (!nodeToDelete) return;

    const parentId = nodeToDelete.get("parentId") as string | null;
    const itemsToDelete = new Set<string>();
    const stack = [itemId];

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (itemsToDelete.has(currentId)) continue;
      itemsToDelete.add(currentId);

      const node = yNodeMap.get(currentId);
      if (node && node.get("type") === "folder") {
        const children = (node.get("children") as Y.Array<string>).toArray();
        children.forEach((childId) => stack.push(childId));
      }
    }

    ydoc.transact(() => {
      itemsToDelete.forEach((id) => yNodeMap.delete(id));
      if (parentId) {
        const parentNode = yNodeMap.get(parentId);
        if (parentNode) {
          const parentChildren = parentNode.get("children") as Y.Array<string>;
          const idx = parentChildren.toArray().indexOf(itemId);
          if (idx > -1) parentChildren.delete(idx);
        }
      }
    });
  };

  const handleRenameStart = (item: FileSystemNode) => {
    setEditingItemId(item.id);
    setEditingName(item.name);
    provider?.awareness.setLocalStateField("renaming", item.id);
  };

  const handleRenameSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!ydoc || !yNodeMap || !editingItemId || !editingName) return;

    const yMapToUpdate = yNodeMap.get(editingItemId);
    if (yMapToUpdate) {
      ydoc.transact(() => {
        yMapToUpdate.set("name", editingName);
      });
    }

    setEditingItemId(null);
    setEditingName("");
    provider?.awareness.setLocalStateField("renaming", null);
  };

  const toggleFolder = (folderId: string) => {
    setExpandedFolders((prev) => {
      const newSet = new Set(prev);
      newSet.has(folderId) ? newSet.delete(folderId) : newSet.add(folderId);
      return newSet;
    });
  };

  const rootItemIds = useMemo(
    () => Object.values(fileSystem).filter((item) => item.parentId === null).map((item) => item.id),
    [fileSystem]
  );

  const renderItem = useCallback(
    (itemId: string, depth: number) => {
      const item = fileSystem[itemId];
      if (!item) return null;

      const isFolder = item.type === "folder";
      const isSelected = item.id === selectedFileId;
      const isEditing = item.id === editingItemId;
      const isExpanded = expandedFolders.has(item.id);
      const isBeingRenamed = renamingSet.has(item.id) && !isEditing;

      return (
        <div key={item.id} className="text-gray-300 text-sm">
          <div
            style={{ paddingLeft: `${depth * 16}px` }}
            className={`flex items-center group w-full pr-2 rounded-md ${
              isSelected ? "bg-blue-800/50" : "hover:bg-gray-700/50"
            } ${isFolder ? "cursor-pointer" : ""}`}
            onClick={
              isFolder
                ? () => toggleFolder(item.id)
                : () => onFileSelect(item.id, item.fileContentId!)
            }
          >
            <div className="flex items-center flex-1 py-1 truncate">
              {isFolder ? (
                <ChevronRight
                  className={`w-4 h-4 mr-1 transition-transform flex-shrink-0 ${
                    isExpanded ? "rotate-90" : ""
                  }`}
                />
              ) : (
                <File className="w-4 h-4 mr-1 opacity-60 flex-shrink-0" />
              )}

              {isEditing ? (
                <form onSubmit={handleRenameSubmit} className="flex-1">
                  <input
                    type="text"
                    value={editingName}
                    onChange={(e) => setEditingName(e.target.value)}
                    onBlur={handleRenameSubmit}
                    autoFocus
                    className="bg-gray-900 text-white outline-none w-full"
                  />
                </form>
              ) : (
                <span className={`truncate ${isBeingRenamed ? "opacity-50" : ""}`}>
                  {item.name}
                </span>
              )}
              {isBeingRenamed && <Lock className="w-3 h-3 ml-1 text-yellow-500 flex-shrink-0" />}
            </div>

            {!isEditing && (
              <div className="flex opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isBeingRenamed) handleRenameStart(item);
                  }}
                  className={`p-1 ${isBeingRenamed ? "text-gray-600 cursor-not-allowed" : "hover:text-white"}`}
                  title={isBeingRenamed ? "Being renamed by another user" : "Rename"}
                  disabled={isBeingRenamed}
                >
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (!isBeingRenamed) handleDelete(item.id);
                  }}
                  className={`p-1 ${isBeingRenamed ? "text-gray-600 cursor-not-allowed" : "hover:text-red-500"}`}
                  title={isBeingRenamed ? "Being renamed by another user" : "Delete"}
                  disabled={isBeingRenamed}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          {isFolder && isExpanded && (
            <div>
              {item.children.length > 0 ? (
                item.children.map((childId) => renderItem(childId, depth + 1))
              ) : (
                <div
                  style={{ paddingLeft: `${(depth + 1) * 16}px` }}
                  className="text-gray-500 italic text-xs py-1"
                >
                  (empty)
                </div>
              )}
            </div>
          )}
        </div>
      );
    },
    [
      fileSystem,
      selectedFileId,
      editingItemId,
      editingName,
      expandedFolders,
      renamingSet,
      onFileSelect,
      handleDelete,
      handleRenameStart,
      handleRenameSubmit,
      toggleFolder,
    ]
  );

  return (
    <div className="w-full h-full flex flex-col overflow-y-auto">
      <div className="flex items-center justify-between mb-2 p-1 flex-shrink-0">
        <span className="text-xs font-bold uppercase text-gray-400">Explorer</span>
        <div className="flex items-center">
          <button
            onClick={() => handleCreate("file", null)}
            className="p-1 hover:text-white text-gray-400"
            title="New File (Root)"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleCreate("folder", null)}
            className="p-1 hover:text-white text-gray-400"
            title="New Folder (Root)"
          >
            <Folder className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {yNodeMap === null ? (
          <div className="text-gray-400 text-sm">Connecting...</div>
        ) : (
          rootItemIds.map((itemId) => renderItem(itemId, 0))
        )}
      </div>
    </div>
  );
};

export default FileExplorer;
