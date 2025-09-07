import React, { useMemo, useCallback } from 'react';
import { FileSystemItem, File } from '../../types/file';
import { VirtualList } from '../ui/VirtualList';
import { FileTreeNode } from './FileTreeNode';

interface VirtualizedFileTreeProps {
  fileStructure: FileSystemItem[];
  roomId: string;
  onFileSelect: (file: File) => void;
  onCreateFile: (parentId?: string) => void;
  onCreateFolder: (parentId?: string) => void;
  onDelete: () => void;
  onRename: () => void;
  onMove: (itemId: string, newParentId?: string) => Promise<void>;
  selectedFileId?: string;
  containerHeight: number;
}

interface FlattenedItem {
  item: FileSystemItem;
  level: number;
  isExpanded?: boolean;
}

const ITEM_HEIGHT = 32; // Height of each file/folder item in pixels

export const VirtualizedFileTree: React.FC<VirtualizedFileTreeProps> = React.memo(({
  fileStructure,
  roomId,
  onFileSelect,
  onCreateFile,
  onCreateFolder,
  onDelete,
  onRename,
  onMove,
  selectedFileId,
  containerHeight,
}) => {
  // Flatten the tree structure for virtual scrolling
  const flattenedItems = useMemo(() => {
    const flatten = (items: FileSystemItem[], level = 0, expandedFolders = new Set<string>()): FlattenedItem[] => {
      const result: FlattenedItem[] = [];
      
      for (const item of items) {
        result.push({ item, level });
        
        if (item.type === 'folder' && expandedFolders.has(item.id)) {
          const folderItem = item as any;
          if (folderItem.children) {
            result.push(...flatten(folderItem.children, level + 1, expandedFolders));
          }
        }
      }
      
      return result;
    };

    // For now, expand all folders. In a real implementation, you'd track expanded state
    const expandedFolders = new Set<string>();
    const addExpandedFolders = (items: FileSystemItem[]) => {
      items.forEach(item => {
        if (item.type === 'folder') {
          expandedFolders.add(item.id);
          const folderItem = item as any;
          if (folderItem.children) {
            addExpandedFolders(folderItem.children);
          }
        }
      });
    };
    
    addExpandedFolders(fileStructure);
    return flatten(fileStructure, 0, expandedFolders);
  }, [fileStructure]);

  const handleItemSelect = (item: FileSystemItem) => {
  onFileSelect(item as File);
};

  const renderItem = useCallback((flattenedItem: FlattenedItem, _index: number) => {
    return (
      <FileTreeNode
        key={flattenedItem.item.id}
        item={flattenedItem.item}
        roomId={roomId}
        onSelect={handleItemSelect}
        onCreateFile={onCreateFile}
        onCreateFolder={onCreateFolder}
        onDelete={onDelete}
        onRename={onRename}
        onMove={onMove}
        selectedFileId={selectedFileId}
        level={flattenedItem.level}
      />
    );
  }, [roomId, onFileSelect, onCreateFile, onCreateFolder, onDelete, onRename, onMove, selectedFileId]);

  if (flattenedItems.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500 text-sm">
        No files to display
      </div>
    );
  }

  return (
    <VirtualList
      items={flattenedItems}
      itemHeight={ITEM_HEIGHT}
      containerHeight={containerHeight}
      renderItem={renderItem}
      overscan={10}
      className="w-full"
    />
  );
});

export default VirtualizedFileTree;