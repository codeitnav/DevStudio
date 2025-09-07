import React, { useState } from 'react';
import { FileExplorer } from '../file/FileExplorer';
import { CodeEditor } from '../editor/CodeEditor';
import { useFileManager } from '../../hooks/useFileManager';
import { File } from '../../types/file';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { Save, FileText } from 'lucide-react';

interface FileManagementDemoProps {
  roomId: string;
}

export const FileManagementDemo: React.FC<FileManagementDemoProps> = ({ roomId }) => {
  const {
    selectedFile,
    loading,
    error,
    selectFile,
    saveFile,
  } = useFileManager(roomId);

  const [editorContent, setEditorContent] = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const handleFileSelect = (file: File) => {
    selectFile(file);
    setEditorContent(file.content);
    setHasUnsavedChanges(false);
  };

  const handleEditorChange = (value: string | undefined) => {
    const content = value || '';
    setEditorContent(content);
    setHasUnsavedChanges(selectedFile ? value !== selectedFile.content : false);
  };

  const handleSaveFile = async () => {
    if (selectedFile && hasUnsavedChanges) {
      try {
        await saveFile(selectedFile.id, editorContent);
        setHasUnsavedChanges(false);
      } catch (err) {
        console.error('Failed to save file:', err);
      }
    }
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex gap-4">
      {/* File Explorer */}
      <div className="w-80 flex-shrink-0">
        <Card className="h-full">
          <FileExplorer
            roomId={roomId}
            onFileSelect={handleFileSelect}
            selectedFileId={selectedFile?.id}
          />
        </Card>
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex flex-col">
        <Card className="flex-1 flex flex-col">
          {/* Editor Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-900">
                {selectedFile ? selectedFile.name : 'No file selected'}
              </span>
              {hasUnsavedChanges && (
                <span className="text-xs text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  Unsaved changes
                </span>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {selectedFile && (
                <Button
                  onClick={handleSaveFile}
                  disabled={!hasUnsavedChanges || loading}
                  size="sm"
                >
                  <Save className="h-4 w-4 mr-1" />
                  {loading ? 'Saving...' : 'Save'}
                </Button>
              )}
            </div>
          </div>

          {/* Editor Content */}
          <div className="flex-1 p-4">
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                {error}
              </div>
            )}

            {selectedFile ? (
              <div className="h-full">
                <CodeEditor
                  value={editorContent}
                  onChange={handleEditorChange}
                  language={selectedFile.language}
                />
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500">
                <div className="text-center">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium mb-2">No file selected</p>
                  <p className="text-sm">Select a file from the explorer to start editing</p>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
};