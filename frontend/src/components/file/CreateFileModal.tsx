import React, { useState } from 'react';
import { fileService } from '../../services/fileService';
import { CreateFileData } from '../../types/file';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { X } from 'lucide-react';

interface CreateFileModalProps {
  roomId: string;
  parentId?: string;
  onClose: () => void;
  onFileCreated: () => void;
}

const LANGUAGE_OPTIONS = [
  { value: 'javascript', label: 'JavaScript', extension: '.js' },
  { value: 'typescript', label: 'TypeScript', extension: '.ts' },
  { value: 'python', label: 'Python', extension: '.py' },
  { value: 'java', label: 'Java', extension: '.java' },
  { value: 'cpp', label: 'C++', extension: '.cpp' },
  { value: 'c', label: 'C', extension: '.c' },
  { value: 'html', label: 'HTML', extension: '.html' },
  { value: 'css', label: 'CSS', extension: '.css' },
  { value: 'json', label: 'JSON', extension: '.json' },
  { value: 'markdown', label: 'Markdown', extension: '.md' },
  { value: 'yaml', label: 'YAML', extension: '.yml' },
  { value: 'xml', label: 'XML', extension: '.xml' },
  { value: 'sql', label: 'SQL', extension: '.sql' },
  { value: 'shell', label: 'Shell', extension: '.sh' },
  { value: 'plaintext', label: 'Plain Text', extension: '.txt' }
];

export const CreateFileModal: React.FC<CreateFileModalProps> = ({
  roomId,
  parentId,
  onClose,
  onFileCreated
}) => {
  const [fileName, setFileName] = useState('');
  const [language, setLanguage] = useState('javascript');
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!fileName.trim()) {
      setError('File name is required');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const fileData: CreateFileData = {
        name: fileName.trim(),
        parentId,
        language,
        content: content || ''
      };

      await fileService.createFile(roomId, fileData);
      onFileCreated();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create file');
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageChange = (newLanguage: string) => {
    setLanguage(newLanguage);
    
    // Auto-suggest file extension if filename doesn't have one
    const selectedLang = LANGUAGE_OPTIONS.find(lang => lang.value === newLanguage);
    if (selectedLang && fileName && !fileName.includes('.')) {
      setFileName(fileName + selectedLang.extension);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Create New File</h2>
          <Button
            onClick={onClose}
            variant="ghost"
            size="sm"
            className="p-1 h-8 w-8"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="fileName" className="block text-sm font-medium text-gray-700 mb-1">
              File Name
            </label>
            <Input
              id="fileName"
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="Enter file name..."
              disabled={loading}
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="language" className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              id="language"
              value={language}
              onChange={(e) => handleLanguageChange(e.target.value)}
              disabled={loading}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {LANGUAGE_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="content" className="block text-sm font-medium text-gray-700 mb-1">
              Initial Content (Optional)
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Enter initial file content..."
              disabled={loading}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading || !fileName.trim()}
            >
              {loading ? 'Creating...' : 'Create File'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};