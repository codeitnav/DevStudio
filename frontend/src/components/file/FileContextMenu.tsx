import React from 'react';
import { FileSystemItem } from '../../types/file';
import {
  Edit2,
  Trash2,
  FileText,
  FolderPlus,
  Copy,
  Cut,
  Download,
  Upload
} from 'lucide-react';

interface FileContextMenuProps {
  item: FileSystemItem;
  position: { x: number; y: number };
  onClose: () => void;
  onRename: () => void;
  onDelete: () => void;
  onCreateFile?: () => void;
  onCreateFolder?: () => void;
  onCopy?: () => void;
  onCut?: () => void;
  onDownload?: () => void;
  onUpload?: () => void;
}

export const FileContextMenu: React.FC<FileContextMenuProps> = ({
  item,
  position,
  onClose,
  onRename,
  onDelete,
  onCreateFile,
  onCreateFolder,
  onCopy,
  onCut,
  onDownload,
  onUpload
}) => {
  const isFolder = item.type === 'folder';

  const handleAction = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      {/* Backdrop to close menu */}
      <div
        className="fixed inset-0 z-40"
        onClick={onClose}
      />
      
      {/* Context menu */}
      <div
        className="fixed bg-white border border-gray-200 rounded-md shadow-lg z-50 min-w-48 py-1"
        style={{
          left: position.x,
          top: position.y,
        }}
      >
        <button
          onClick={() => handleAction(onRename)}
          className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 text-left"
        >
          <Edit2 className="h-4 w-4 mr-3" />
          Rename
        </button>

        {onCopy && (
          <button
            onClick={() => handleAction(onCopy)}
            className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 text-left"
          >
            <Copy className="h-4 w-4 mr-3" />
            Copy
          </button>
        )}

        {onCut && (
          <button
            onClick={() => handleAction(onCut)}
            className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 text-left"
          >
            <Cut className="h-4 w-4 mr-3" />
            Cut
          </button>
        )}

        {isFolder && (
          <>
            <div className="border-t border-gray-100 my-1" />
            
            {onCreateFile && (
              <button
                onClick={() => handleAction(onCreateFile)}
                className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 text-left"
              >
                <FileText className="h-4 w-4 mr-3" />
                New File
              </button>
            )}

            {onCreateFolder && (
              <button
                onClick={() => handleAction(onCreateFolder)}
                className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 text-left"
              >
                <FolderPlus className="h-4 w-4 mr-3" />
                New Folder
              </button>
            )}
          </>
        )}

        {!isFolder && onDownload && (
          <button
            onClick={() => handleAction(onDownload)}
            className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 text-left"
          >
            <Download className="h-4 w-4 mr-3" />
            Download
          </button>
        )}

        {isFolder && onUpload && (
          <button
            onClick={() => handleAction(onUpload)}
            className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 text-left"
          >
            <Upload className="h-4 w-4 mr-3" />
            Upload Files
          </button>
        )}

        <div className="border-t border-gray-100 my-1" />
        
        <button
          onClick={() => handleAction(onDelete)}
          className="flex items-center w-full px-3 py-2 text-sm hover:bg-gray-100 text-red-600 text-left"
        >
          <Trash2 className="h-4 w-4 mr-3" />
          Delete
        </button>
      </div>
    </>
  );
};