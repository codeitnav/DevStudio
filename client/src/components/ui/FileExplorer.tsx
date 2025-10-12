'use client';

import React, { useState, useEffect, FC } from 'react';
import * as api from '@/lib/services/api';
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

// A unified type for tree nodes, combining File and Folder with UI state
type TreeNode = (api.File | api.Folder) & {
  type: 'file' | 'folder';
  children?: TreeNode[];
  isExpanded?: boolean;
};

// --- PROPS INTERFACE ---

interface FileExplorerProps {
  onFileSelect: (fileId: string, content: string, fileName: string) => void;
  // Add any other props you might need, like the sidebar's open/close state
}


// --- RECURSIVE TREE NODE COMPONENT ---

const Node: FC<{ node: TreeNode; depth: number; onNodeUpdate: () => void; onFileSelect: FileExplorerProps['onFileSelect'] }> = ({
  node,
  depth,
  onNodeUpdate,
  onFileSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(node.name);

  const isFolder = node.type === 'folder';

  const handleToggle = () => {
    setIsExpanded(!isExpanded);
  };

  const handleCreate = async (type: 'file' | 'folder') => {
    const name = prompt(`Enter name for new ${type}:`);
    if (name) {
      try {
        if (type === 'folder') {
          await api.createFolder(name, node._id);
        } else {
          await api.createEmptyFile(name, node._id);
        }
        onNodeUpdate(); // Trigger a refetch in the parent
      } catch (error) {
        console.error(`Error creating ${type}:`, error);
        alert(`Failed to create ${type}. Check if an item with the same name already exists.`);
      }
    }
  };

  const handleDelete = async () => {
    if (confirm(`Are you sure you want to delete "${node.name}"?`)) {
      try {
        if (isFolder) {
          await api.deleteFolder(node._id);
        } else {
          await api.deleteFile(node._id);
        }
        onNodeUpdate();
      } catch (error) {
        console.error('Error deleting item:', error);
        alert('Failed to delete item.');
      }
    }
  };

  const handleRename = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newName && newName !== node.name) {
        try {
            await api.renameItem(node.type, node._id, newName);
            onNodeUpdate();
        } catch (error) {
            console.error('Error renaming item:', error);
            alert('Failed to rename. An item with this name may already exist.');
        }
    }
    setIsEditing(false);
  };

  const handleFileClick = async () => {
    if (node.type === 'file') {
      try {
        const response = await api.getFileContent(node._id);
        onFileSelect(response.data._id, response.data.content, response.data.name);
      } catch(error) {
        console.error("Failed to fetch file content", error);
        alert("Could not open file.");
      }
    }
  };


  const Icon = isFolder ? (isExpanded ? FolderOpen : FolderIcon) : FileIcon;

  return (
    <div>
      <div
        className="flex items-center p-1.5 rounded-md hover:bg-gray-700 cursor-pointer group"
        style={{ paddingLeft: `${depth * 1.5}rem` }}
        onClick={isFolder ? handleToggle : handleFileClick}
      >
        {isFolder ? (
          isExpanded ? (
            <ChevronDown size={18} className="mr-2 flex-shrink-0" />
          ) : (
            <ChevronRight size={18} className="mr-2 flex-shrink-0" />
          )
        ) : (
          <span className="w-[18px] mr-2 flex-shrink-0"></span> // Spacer for alignment
        )}
        <Icon size={18} className="mr-2 text-sky-400 flex-shrink-0" />

        {isEditing ? (
            <form onSubmit={handleRename}>
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    onBlur={handleRename}
                    autoFocus
                    className="bg-gray-900 text-white border border-gray-600 rounded px-1 w-full"
                    onClick={(e) => e.stopPropagation()} // Prevent toggle on click
                />
            </form>
        ) : (
            <span className="flex-grow truncate">{node.name}</span>
        )}

        {/* Action icons shown on hover */}
        <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
            {isFolder && (
              <>
                <button onClick={(e) => { e.stopPropagation(); handleCreate('file'); }} title="New File" className="p-1 hover:bg-gray-600 rounded"><Plus size={14} /></button>
                <button onClick={(e) => { e.stopPropagation(); handleCreate('folder'); }} title="New Folder" className="p-1 hover:bg-gray-600 rounded"><FolderIcon size={14} /></button>
              </>
            )}
            <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); }} title="Rename" className="p-1 hover:bg-gray-600 rounded"><Edit2 size={14} /></button>
            <button onClick={(e) => { e.stopPropagation(); handleDelete(); }} title="Delete" className="p-1 hover:text-red-500 hover:bg-gray-600 rounded"><Trash2 size={14} /></button>
        </div>
      </div>
      {isExpanded && node.children && (
        <div>
          {node.children.map((child) => (
            <Node key={child._id} node={child} depth={depth + 1} onNodeUpdate={onNodeUpdate} onFileSelect={onFileSelect} />
          ))}
        </div>
      )}
    </div>
  );
};


// --- MAIN FILE EXPLORER COMPONENT ---

const FileExplorer: FC<FileExplorerProps> = ({ onFileSelect }) => {
  const [data, setData] = useState<TreeNode[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Function to fetch the entire file system tree
  const fetchFileSystemTree = async () => {
    setIsLoading(true);
    try {
      // This function recursively fetches folder contents
      const buildTree = async (folderId?: string): Promise<TreeNode[]> => {
        const response = await api.getFileSystem(folderId);
        const { folders, files } = response.data;

        const fileNodes: TreeNode[] = files.map(file => ({ ...file, type: 'file' }));

        const folderNodes: TreeNode[] = await Promise.all(
          folders.map(async (folder) => ({
            ...folder,
            type: 'folder' as const,
            children: await buildTree(folder._id), // Recursive call
          }))
        );

        return [...folderNodes, ...fileNodes].sort((a,b) => a.name.localeCompare(b.name));
      };

      const tree = await buildTree();
      setData(tree);
    } catch (error) {
      console.error('Failed to fetch file system:', error);
      // Handle error state in UI if needed
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFileSystemTree();
  }, []);

  const handleCreateRoot = async (type: 'file' | 'folder') => {
      const name = prompt(`Enter name for new root ${type}:`);
      if (name) {
          try {
              if (type === 'file') {
                  await api.createEmptyFile(name, undefined);
              } else {
                  await api.createFolder(name, undefined);
              }
              fetchFileSystemTree(); // Refetch whole tree
          } catch (error) {
              console.error(`Error creating root ${type}:`, error);
              alert('Failed to create item at root.');
          }
      }
  }

  if (isLoading) {
    return <div className="p-4 text-gray-400">Loading files...</div>;
  }

  return (
    <div className="container text-white h-full overflow-y-auto bg-gray-800 p-2">
        <div className="flex justify-between items-center mb-2 p-1.5">
            <h2 className="font-bold text-lg">Explorer</h2>
            <div>
                <button onClick={() => handleCreateRoot('file')} title="New File in Root" className="p-1 hover:bg-gray-600 rounded"><Plus size={16} /></button>
                <button onClick={() => handleCreateRoot('folder')} title="New Folder in Root" className="p-1 hover:bg-gray-600 rounded"><FolderIcon size={16} /></button>
            </div>
        </div>
      {data.map((node) => (
        <Node key={node._id} node={node} depth={0} onNodeUpdate={fetchFileSystemTree} onFileSelect={onFileSelect} />
      ))}
    </div>
  );
};

export default FileExplorer;