import React, { useState } from 'react';
import { FileSystemItem, Folder } from '../../types/file';
import { fileService } from '../../services/fileService';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { FileContextMenu } from './FileContextMenu';
import { getFileIcon } from '../../utils/fileIcons';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import {
  ChevronRight,
  ChevronDown,
  MoreHorizontal
} from 'lucide-react';

interface FileTreeNodeProps {
  item: FileSystemItem;
  roomId: string;
  onSelect: (item: FileSystemItem) => void;
  onCreateFile: (parentId?: string) => void;
  onCreateFolder: (parentId?: string) => void;
  onDelete: () => void;
  onRename: () => void;
  onMove: (itemId: string, newParentId?: string) => Promise<void>;
  selectedFileId?: string;
  level: number;
}

export const FileTreeNode: React.FC<FileTreeNodeProps> = ({
  item,
  roomId,
  onSelect,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onRename,
  onMove,
  selectedFileId,
  level,
  
}) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isRenaming, setIsRenaming] = useState(false);
  const [newName, setNewName] = useState(item.name);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);
  const [loading, setLoading] = useState(false);

  const {
    isDraggedItem,
    isDragOver,
    handleDragStart,
    handleDragEnd,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useDragAndDrop({ onMove });

  const isFolder = item.type === 'folder';
  const isSelected = item.type === 'file' && item.id === selectedFileId;
  const hasChildren = isFolder && (item as Folder).children?.length > 0;

  const handleToggleExpand = () => {
    if (isFolder) {
      setIsExpanded(!isExpanded);
    }
  };

  const handleSelect = () => {
    if (!isRenaming) {
      onSelect(item);
    }
  };

  const handleRename = async () => {
    if (newName.trim() && newName !== item.name) {
      try {
        setLoading(true);
        await fileService.renameItem(roomId, item.id, newName.trim());
        onRename();
      } catch (err) {
        console.error('Error renaming item:', err);
        setNewName(item.name); // Reset on error
      } finally {
        setLoading(false);
      }
    }
    setIsRenaming(false);
  };

  const handleDelete = async () => {
    if (window.confirm(`Are you sure you want to delete "${item.name}"?`)) {
      try {
        setLoading(true);
        await fileService.deleteItem(roomId, item.id);
        onDelete();
      } catch (err) {
        console.error('Error deleting item:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRename();
    } else if (e.key === 'Escape') {
      setNewName(item.name);
      setIsRenaming(false);
    }
  };

  const handleContextMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ x: e.clientX, y: e.clientY });
  };

  const handleDownload = async () => {
    if (item.type === 'file') {
      try {
        const content = await fileService.getFileContent(roomId, item.id);
        const blob = new Blob([content], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = item.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (error) {
        console.error('Error downloading file:', error);
      }
    }
  };

  return (
    <div className="select-none">
      <div
        className={`flex items-center py-1 px-2 rounded hover:bg-gray-100 cursor-pointer group relative transition-colors ${
          isSelected ? 'bg-blue-50 border-l-2 border-blue-500' : ''
        } ${isDraggedItem(item.id) ? 'opacity-50' : ''} ${
          isDragOver(item.id) ? 'bg-blue-100 border-blue-300' : ''
        }`}
        style={{ paddingLeft: `${level * 16 + 8}px` }}
        onClick={handleSelect}
        onDoubleClick={() => setIsRenaming(true)}
        onContextMenu={handleContextMenu}
        draggable={!isRenaming}
        onDragStart={() => handleDragStart(item)}
        onDragEnd={handleDragEnd}
        onDragOver={(e) => handleDragOver(e, item)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, item)}
      >
        {/* Expand/Collapse button for folders */}
        {isFolder && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleToggleExpand();
            }}
            className="p-0.5 hover:bg-gray-200 rounded mr-1"
          >
            {isExpanded ? (
              <ChevronDown className="h-3 w-3" />
            ) : (
              <ChevronRight className="h-3 w-3" />
            )}
          </button>
        )}

        {/* Icon */}
        <div className="mr-2">
          {getFileIcon(item.name, isFolder)}
        </div>

        {/* Name */}
        <div className="flex-1 min-w-0">
          {isRenaming ? (
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onBlur={handleRename}
              onKeyDown={handleKeyDown}
              className="h-6 text-sm py-0 px-1"
              autoFocus
              disabled={loading}
            />
          ) : (
            <span className="text-sm truncate block">{item.name}</span>
          )}
        </div>

        {/* Context menu button */}
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleContextMenu(e);
            }}
            variant="ghost"
            size="sm"
            className="p-1 h-6 w-6"
          >
            <MoreHorizontal className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Children */}
      {isFolder && isExpanded && hasChildren && (
        <div>
          {(item as Folder).children.map((child) => (
            <FileTreeNode
              key={child.id}
              item={child}
              roomId={roomId}
              onSelect={onSelect}
              onCreateFile={onCreateFile}
              onCreateFolder={onCreateFolder}
              onDelete={onDelete}
              onRename={onRename}
              onMove={onMove}
              selectedFileId={selectedFileId}
              level={level + 1}
            />
          ))}
        </div>
      )}

      {/* Context menu */}
      {contextMenu && (
        <FileContextMenu
          item={item}
          position={contextMenu}
          onClose={() => setContextMenu(null)}
          onRename={() => setIsRenaming(true)}
          onDelete={handleDelete}
          onCreateFile={isFolder ? () => onCreateFile(item.id) : undefined}
          onCreateFolder={isFolder ? () => onCreateFolder(item.id) : undefined}
          onDownload={item.type === 'file' ? handleDownload : undefined}
        />
      )}
    </div>
  );
};