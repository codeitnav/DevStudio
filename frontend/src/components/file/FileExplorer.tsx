import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FileSystemItem, File, Folder } from '../../types/file';
import { fileService } from '../../services/fileService';
import { FileTreeNode } from './FileTreeNode';
import { CreateFileModal } from './CreateFileModal';
import { CreateFolderModal } from './CreateFolderModal';
import { Button } from '../ui/Button';
import { Plus, FolderPlus, FileText, MoreVertical } from 'lucide-react';
import { useDragAndDrop } from '../../hooks/useDragAndDrop';
import { useResponsive } from '../../hooks/useResponsive';

interface FileExplorerProps {
  roomId: string;
  onFileSelect: (file: File) => void;
  selectedFileId?: string;
  className?: string;
}

export const FileExplorer: React.FC<FileExplorerProps> = React.memo(({
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
  const { isMobile } = useResponsive();

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

  const handleFileSelect = useCallback(async (item: FileSystemItem) => {
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
  }, [roomId, onFileSelect]);

  const handleCreateFile = useCallback((parentId?: string) => {
    setSelectedParentId(parentId);
    setShowCreateFileModal(true);
    setShowActions(false);
  }, []);

  const handleCreateFolder = useCallback((parentId?: string) => {
    setSelectedParentId(parentId);
    setShowCreateFolderModal(true);
    setShowActions(false);
  }, []);

  const handleFileCreated = useCallback(() => {
    setShowCreateFileModal(false);
    loadFileStructure();
  }, []);

  const handleFolderCreated = useCallback(() => {
    setShowCreateFolderModal(false);
    loadFileStructure();
  }, []);

  const handleItemDeleted = useCallback(() => {
    loadFileStructure();
  }, []);

  const handleItemRenamed = useCallback(() => {
    loadFileStructure();
  }, []);

  const handleItemMoved = useCallback(async (itemId: string, newParentId?: string) => {
    try {
      await fileService.moveItem(roomId, itemId, newParentId);
      loadFileStructure();
    } catch (error) {
      console.error('Error moving item:', error);
      throw error;
    }
  }, [roomId]);

  const {
    isDragOver,
    handleDragOver,
    handleDragLeave,
    handleDrop
  } = useDragAndDrop({ onMove: handleItemMoved });

  if (loading) {
    return (
      <div className={`p-3 sm:p-4 ${className}`}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-200 rounded"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`p-3 sm:p-4 ${className}`}>
        <div className="text-red-500 text-sm mb-3">{error}</div>
        <Button
          onClick={loadFileStructure}
          variant="outline"
          size="sm"
          className="w-full sm:w-auto"
        >
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={`h-full flex flex-col ${className}`}>
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
                  aria-label="File actions"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
                {showActions && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={() => handleCreateFile()}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <FileText className="h-4 w-4 mr-3" />
                        New File
                      </button>
                      <button
                        onClick={() => handleCreateFolder()}
                        className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                      >
                        <FolderPlus className="h-4 w-4 mr-3" />
                        New Folder
                      </button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex gap-1">
                <Button
                  onClick={() => handleCreateFile()}
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  title="New File"
                >
                  <FileText className="h-4 w-4" />
                </Button>
                <Button
                  onClick={() => handleCreateFolder()}
                  variant="ghost"
                  size="sm"
                  className="p-2"
                  title="New Folder"
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
      >
        {fileStructure.length === 0 ? (
          <div className="p-4 text-center text-gray-500 text-sm">
            <p className="mb-3">No files yet</p>
            <Button
              onClick={() => handleCreateFile()}
              variant="outline"
              size="sm"
              className="w-full sm:w-auto"
            >
              <Plus className="h-4 w-4 mr-2" />
              Create first file
            </Button>
          </div>
        ) : (
          <div className="p-2">
            {useMemo(() => 
              fileStructure.map((item) => (
                <FileTreeNode
                  key={item.id}
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
              )), [fileStructure, roomId, handleFileSelect, handleCreateFile, handleCreateFolder, handleItemDeleted, handleItemRenamed, handleItemMoved, selectedFileId]
            )}
          </div>
        )}
      </div>

      {showCreateFileModal && (
        <CreateFileModal
          roomId={roomId}
          parentId={selectedParentId}
          onClose={() => setShowCreateFileModal(false)}
          onFileCreated={handleFileCreated}
        />
      )}

      {showCreateFolderModal && (
        <CreateFolderModal
          roomId={roomId}
          parentId={selectedParentId}
          onClose={() => setShowCreateFolderModal(false)}
          onFolderCreated={handleFolderCreated}
        />
      )}
    </div>
  );
});