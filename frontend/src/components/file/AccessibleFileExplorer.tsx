import React, { useState, useEffect, useRef, useCallback } from 'react';
import { FileSystemItem, File } from '../../types/file';
import { fileService } from '../../services/fileService';
import { FileTreeNode } from './FileTreeNode';
import { CreateFileModal } from './CreateFileModal';
import { CreateFolderModal } from './CreateFolderModal';
import { Button } from '../ui/Button';
import { Plus, FolderPlus, FileText, MoreVertical } from 'lucide-react';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useResponsive } from '../../hooks/useResponsive';
import { useKeyboardNavigation, useArrowKeyNavigation } from '../../hooks/useKeyboardNavigation';
import { useFocusManagement } from '../../hooks/useFocusManagement';

interface AccessibleFileExplorerProps {
  roomId: string;
  onFileSelect: (file: File) => void;
  selectedFileId?: string;
  className?: string;
}

export const AccessibleFileExplorer: React.FC<AccessibleFileExplorerProps> = ({
  roomId,
  onFileSelect,
  selectedFileId,
  className = ''
}) => {
  const [fileStructure, setFileStructure] = useState<FileSystemItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateFileModal, setShowCreateFileModal] = useState(false);
  const [showCreateFolderModal, setShowCreateFolderModal] = useState(false);
  const [selectedParentId, setSelectedParentId] = useState<string | undefined>();
  const [showActions, setShowActions] = useState(false);
  const [focusedItemIndex, setFocusedItemIndex] = useState(0);
  
  const { isMobile } = useResponsive();
  const containerRef = useRef<HTMLDivElement>(null);
  const fileItemRefs = useRef<HTMLElement[]>([]);
  const { saveFocus, restoreFocus } = useFocusManagement();

  // Flatten file structure for keyboard navigation
  const flattenedItems = React.useMemo(() => {
    const flatten = (items: FileSystemItem[], level = 0): Array<{ item: FileSystemItem; level: number }> => {
      return items.reduce((acc, item) => {
        acc.push({ item, level });
        if (item.type === 'folder' && (item as any).expanded) {
          acc.push(...flatten((item as any).children || [], level + 1));
        }
        return acc;
      }, [] as Array<{ item: FileSystemItem; level: number }>);
    };
    return flatten(fileStructure);
  }, [fileStructure]);

  // Update refs when items change
  useEffect(() => {
    fileItemRefs.current = fileItemRefs.current.slice(0, flattenedItems.length);
  }, [flattenedItems.length]);

  // Arrow key navigation
  const { navigate: _navigate, setCurrentIndex: _setCurrentIndex } = useArrowKeyNavigation(
    fileItemRefs.current,
    {
      loop: true,
      orientation: 'vertical',
      onSelect: (index) => {
        setFocusedItemIndex(index);
      }
    }
  );

  // Keyboard shortcuts
  const shortcuts = [
    {
      key: 'Enter',
      action: () => {
        const focusedItem = flattenedItems[focusedItemIndex];
        if (focusedItem) {
          handleFileSelect(focusedItem.item);
        }
      },
      description: 'Open selected file/folder'
    },
    {
      key: 'F2',
      action: () => {
        // Trigger rename for focused item
        const focusedItem = flattenedItems[focusedItemIndex];
        if (focusedItem) {
          // This would trigger rename mode
          console.log('Rename item:', focusedItem.item.name);
        }
      },
      description: 'Rename selected item'
    },
    {
      key: 'Delete',
      action: () => {
        // Trigger delete for focused item
        const focusedItem = flattenedItems[focusedItemIndex];
        if (focusedItem) {
          // This would trigger delete confirmation
          console.log('Delete item:', focusedItem.item.name);
        }
      },
      description: 'Delete selected item'
    },
    {
      key: 'n',
      ctrlKey: true,
      action: () => handleCreateFile(),
      description: 'Create new file'
    },
    {
      key: 'n',
      ctrlKey: true,
      shiftKey: true,
      action: () => handleCreateFolder(),
      description: 'Create new folder'
    }
  ];

  useKeyboardNavigation(shortcuts);

  useEffect(() => {
    loadFileStructure();
  }, [roomId]);

  const loadFileStructure = async () => {
    try {
      setLoading(true);
      setError(null);
      const structure = await fileService.getFileStructure(roomId);
      setFileStructure(structure);
    } catch (err) {
      setError('Failed to load file structure');
      console.error('Error loading file structure:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleFileSelect = async (item: FileSystemItem) => {
    if (item.type === 'file') {
      try {
        const fileContent = await fileService.getFileContent(roomId, item.id);
        const file: File = {
          ...item,
          type: 'file',
          language: (item as File).language || 'javascript',
          content: fileContent,
          size: fileContent.length
        };
        onFileSelect(file);
      } catch (err) {
        console.error('Error loading file content:', err);
      }
    }
  };

  const handleCreateFile = useCallback((parentId?: string) => {
    saveFocus();
    setSelectedParentId(parentId);
    setShowCreateFileModal(true);
    setShowActions(false);
  }, [saveFocus]);

  const handleCreateFolder = useCallback((parentId?: string) => {
    saveFocus();
    setSelectedParentId(parentId);
    setShowCreateFolderModal(true);
    setShowActions(false);
  }, [saveFocus]);

  const handleFileCreated = () => {
    setShowCreateFileModal(false);
    loadFileStructure();
    restoreFocus();
  };

  const handleFolderCreated = () => {
    setShowCreateFolderModal(false);
    loadFileStructure();
    restoreFocus();
  };

  const handleItemDeleted = () => {
    loadFileStructure();
  };

  const handleItemRenamed = () => {
    loadFileStructure();
  };

  const handleItemMoved = async (itemId: string, newParentId?: string) => {
    try {
      await fileService.moveItem(roomId, itemId, newParentId);
      loadFileStructure();
    } catch (error) {
      console.error('Error moving item:', error);
      throw error;
    }
  };

  const {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useDragAndDrop({ onMove: handleItemMoved });

  if (loading) {
    return (
      <div className={`p-3 sm:p-4 ${className}`} role="status" aria-label="Loading files">
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
        <span className="sr-only">Loading file structure...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-3 sm:p-4 ${className}`} role="alert">
        <div className="text-red-500 text-sm mb-3">{error}</div>
        <Button
          onClick={loadFileStructure}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
          aria-label="Retry loading file structure"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className={`h-full flex flex-col ${className}`}
      id="file-explorer"
      role="region"
      aria-label="File Explorer"
    >
      <div className="p-3 sm:p-4 border-b border-gray-200 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-900">Files</h3>
          <div className="relative">
            {isMobile ? (
              <>
                <Button
                  onClick={() => setShowActions(!showActions)}
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  aria-label="File actions menu"
                  aria-expanded={showActions}
                  aria-haspopup="menu"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                {showActions && (
                  <div 
                    className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50"
                    role="menu"
                    aria-label="File actions"
                  >
                    <div className="py-1">
                      <button
                        onClick={() => handleCreateFile()}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        role="menuitem"
                      >
                        <FileText className="h-4 w-4 mr-3" aria-hidden="true" />
                        New File
                      </button>
                      <button
                        onClick={() => handleCreateFolder()}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 focus:bg-gray-100 focus:outline-none"
                        role="menuitem"
                      >
                        <FolderPlus className="h-4 w-4 mr-3" aria-hidden="true" />
                        New Folder
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex gap-1" role="toolbar" aria-label="File actions">
                <Button
                  onClick={() => handleCreateFile()}
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  aria-label="Create new file (Ctrl+N)"
                  title="New File (Ctrl+N)"
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleCreateFolder()}
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  aria-label="Create new folder (Ctrl+Shift+N)"
                  title="New Folder (Ctrl+Shift+N)"
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div 
        className={`flex-1 overflow-auto ${isDragOver('root') ? 'bg-blue-50' : ''}`}
        onDragOver={(e) => handleDragOver(e)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e)}
        role="tree"
        aria-label="File tree"
      >
        {fileStructure.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <p className="mb-3">No files yet</p>
            <Button
              onClick={() => handleCreateFile()}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
              aria-label="Create your first file"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create first file
            </Button>
          </div>
        ) : (
          <div className="p-2">
  {fileStructure.map((item, index) => (
    <div
      key={item.id}
      ref={(el: HTMLDivElement | null) => {
        if (el) fileItemRefs.current[index] = el;
      }}
    >
      <FileTreeNode
        item={item}
        roomId={roomId}
        onSelect={handleFileSelect}
        onCreateFile={handleCreateFile}
        onCreateFolder={handleCreateFolder}
        onDelete={handleItemDeleted}
        onRename={handleItemRenamed}
        onMove={handleItemMoved}
        selectedFileId={selectedFileId}
        level={0}
      />
    </div>
  ))}
</div>

        )}
      </div>

      {showCreateFileModal && (
        <CreateFileModal
          roomId={roomId}
          parentId={selectedParentId}
          onClose={() => {
            setShowCreateFileModal(false);
            restoreFocus();
          }}
          onFileCreated={handleFileCreated}
        />
      )}

      {showCreateFolderModal && (
        <CreateFolderModal
          roomId={roomId}
          parentId={selectedParentId}
          onClose={() => {
            setShowCreateFolderModal(false);
            restoreFocus();
          }}
          onFolderCreated={handleFolderCreated}
        />
      )}
    </div>
  );
};