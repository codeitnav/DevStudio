import React, { useState } from 'react';
import { FileExplorer } from '../file/FileExplorer';
import { CodeEditor } from '../editor/CodeEditor';
import { File } from '../../types/file';
import { useAutoSave } from '../../hooks/useAutoSave';

export const FileOperationsDemo: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [_lastSaved, setLastSaved] = useState<Date>();

  // Mock room ID for demo
  const roomId = 'demo-room';

  // Auto-save hook
  const { hasUnsavedChanges, isSaving } = useAutoSave({
    roomId,
    fileId: selectedFile?.id || '',
    content: fileContent,
    enabled: !!selectedFile,
    onSave: () => setLastSaved(new Date()),
    onError: (error) => console.error('Auto-save error:', error)
  });

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setFileContent(file.content);
  };

  const handleContentChange = (content: string | undefined) => {
    setFileContent(content || '');
  };

  return (
    <div className="h-screen flex">
      {/* File Explorer */}
      <div className="w-64 border-r border-gray-200 bg-gray-50">
        <FileExplorer
          roomId={roomId}
          onFileSelect={handleFileSelect}
          selectedFileId={selectedFile?.id}
        />
      </div>

      {/* Code Editor */}
      <div className="flex-1 flex flex-col">
        {selectedFile ? (
          <>
            <div className="p-4 border-b border-gray-200 bg-white">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold">{selectedFile.name}</h2>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-gray-500">
                    Language: {selectedFile.language}
                  </span>
                  {hasUnsavedChanges && (
                    <span className="text-sm text-orange-500">
                      • Unsaved changes
                    </span>
                  )}
                  {isSaving && (
                    <span className="text-sm text-blue-500">
                      Saving...
                    </span>
                  )}
                </div>
              </div>
            </div>
            <CodeEditor
              value={fileContent}
              language={selectedFile.language}
              onChange={handleContentChange}
              height="100%"
              className="flex-1"
            />
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center text-gray-500">
            <div className="text-center">
              <h3 className="text-lg font-medium mb-2">No file selected</h3>
              <p>Select a file from the explorer to start editing</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};