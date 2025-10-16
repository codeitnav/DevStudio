'use client';

import React, { useState, useEffect, FC } from 'react';
import * as Y from 'yjs';
import { nanoid } from 'nanoid';
import {
  ChevronRight,
  ChevronDown,
  File as FileIcon,
  Folder as FolderIcon,
  FolderOpen,
  Plus,
  Trash2,
  Edit2,
} from 'lucide-react';

// --- TYPE DEFINITIONS ---

// The shared data structure for a file or folder in our Yjs Array
export interface FileSystemItem {
  id: string;
  name: string;
  type: 'file' | 'folder';
  parentId: string | null;
}

// A recursive type for rendering the tree structure in React
type TreeNode = FileSystemItem & {
  children: TreeNode[];
};

// --- PROPS INTERFACE ---

interface FileExplorerProps {
  yDoc: Y.Doc;
  onFileSelect: (fileId: string, fileName: string) => void;
}

// Helper function to build a nested tree from a flat array
const buildTree = (items: FileSystemItem[]): TreeNode[] => {
  const tree: TreeNode[] = [];
  const map: { [key: string]: TreeNode } = {};

  items.forEach(item => {
    map[item.id] = { ...item, children: [] };
  });

  items.forEach(item => {
    if (item.parentId && map[item.parentId]) {
      map[item.parentId].children.push(map[item.id]);
    } else {
      tree.push(map[item.id]);
    }
  });

  return tree;
};


// --- RECURSIVE TREE NODE COMPONENT ---

const Node: FC<{ node: TreeNode; yfiles: Y.Array<FileSystemItem>; yDoc: Y.Doc; onFileSelect: FileExplorerProps['onFileSelect'] }> = ({
  node,
  yfiles,
  yDoc,
  onFileSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(node.name);

  const handleCreate = (type: 'file' | 'folder') => {
    const name = prompt(`Enter name for new ${type}:`, type === 'file' ? 'new-file.js' : 'new-folder');
    if (name) {
      const newItem: FileSystemItem = { id: nanoid(), name, type, parentId: node.id };
      yfiles.push([newItem]);
    }
  };

  const handleDelete = () => {
    if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
      const idsToDelete = new Set<string>([node.id]);
      // Recursively find all children to delete
      const findChildren = (parentId: string) => {
        yfiles.toArray().forEach(item => {
          if (item.parentId === parentId) {
            idsToDelete.add(item.id);
            if (item.type === 'folder') findChildren(item.id);
          }
        });
      };
      if (node.type === 'folder') findChildren(node.id);
      
      // Delete all items in a single transaction
      yDoc.transact(() => {
        let i = yfiles.length;
        while (i--) {
          if (idsToDelete.has(yfiles.get(i).id)) {
            yfiles.delete(i, 1);
          }
        }
      });
    }
  };
  
  const handleRename = (e: React.FormEvent) => {
    e.preventDefault();
    if (newName && newName !== node.name) {
        const index = yfiles.toArray().findIndex(item => item.id === node.id);
        if (index > -1) {
            const updatedItem = { ...yfiles.get(index), name: newName };
            yDoc.transact(() => {
                yfiles.delete(index, 1);
                yfiles.insert(index, [updatedItem]);
            });
        }
    }
    setIsEditing(false);
  };

  const Icon = node.type === 'folder' ? (isExpanded ? FolderOpen : FolderIcon) : FileIcon;

  return (
    <div className="pl-4">
      <div
        className="flex items-center p-1.5 rounded-md hover:bg-gray-700 cursor-pointer group"
        onClick={node.type === 'folder' ? () => setIsExpanded(!isExpanded) : () => onFileSelect(node.id, node.name)}
      >
        {node.type === 'folder' ? (isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />) : <span className="w-4" />}
        <Icon size={16} className="mx-2 text-sky-400 flex-shrink-0" />

        {isEditing ? (
            <form onSubmit={handleRename} className="flex-grow">
                <input
                    type="text" value={newName} onChange={(e) => setNewName(e.target.value)}
                    onBlur={handleRename} autoFocus
                    className="bg-gray-900 text-white border border-gray-600 rounded px-1 w-full"
                    onClick={(e) => e.stopPropagation()}
                />
            </form>
        ) : (
            <span className="flex-grow truncate">{node.name}</span>
        )}

        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
            {node.type === 'folder' && <button onClick={(e) => { e.stopPropagation(); handleCreate('file'); }} title="New File" className="p-1 hover:bg-gray-600 rounded"><Plus size={14} /></button>}
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} title="Rename" className="p-1 hover:bg-gray-600 rounded"><Edit2 size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} title="Delete" className="p-1 hover:text-red-500 hover:bg-gray-600 rounded"><Trash2 size={14} /></button>
        </div>
      </div>
      {isExpanded && node.children.map(child => (
          <Node key={child.id} node={child} yfiles={yfiles} yDoc={yDoc} onFileSelect={onFileSelect} />
      ))}
    </div>
  );
};


// --- MAIN FILE EXPLORER COMPONENT ---

const FileExplorer: FC<FileExplorerProps> = ({ yDoc, onFileSelect }) => {
  const [treeData, setTreeData] = useState<TreeNode[]>([]);
  const yfiles = yDoc.getArray<FileSystemItem>('files');

  useEffect(() => {
    const updateTree = () => setTreeData(buildTree(yfiles.toArray()));
    yfiles.observe(updateTree);
    updateTree(); // Initial render
    return () => yfiles.unobserve(updateTree);
  }, [yfiles]);

  const handleCreateRoot = (type: 'file' | 'folder') => {
    const name = prompt(`Enter name for new root ${type}:`);
    if (name) {
      const newItem: FileSystemItem = { id: nanoid(), name, type, parentId: null };
      yfiles.push([newItem]);
    }
  };

  return (
    <div className="text-white h-full overflow-y-auto bg-gray-800 p-2 text-sm">
      <div className="flex justify-between items-center mb-2 p-1.5">
        <h2 className="font-bold">Explorer</h2>
        <div>
          <button onClick={() => handleCreateRoot('file')} title="New File in Root" className="p-1 hover:bg-gray-600 rounded"><Plus size={16} /></button>
          <button onClick={() => handleCreateRoot('folder')} title="New Folder in Root" className="p-1 hover:bg-gray-600 rounded"><FolderIcon size={16} /></button>
        </div>
      </div>
      {treeData.map((node) => (
        <Node key={node.id} node={node} yfiles={yfiles} yDoc={yDoc} onFileSelect={onFileSelect} />
      ))}
    </div>
  );
};

export default FileExplorer;