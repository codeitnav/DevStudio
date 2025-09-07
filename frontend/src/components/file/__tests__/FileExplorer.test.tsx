import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { FileExplorer } from '../FileExplorer';
import { fileService } from '../../../services/fileService';
import { FileSystemItem } from '../../../types/file';

// Mock the fileService
vi.mock('../../../services/fileService', () => ({
  fileService: {
    getFileStructure: vi.fn(),
    getFileContent: vi.fn()
  }
}));

const mockFileService = fileService as any;

describe('FileExplorer', () => {
  const mockProps = {
    roomId: 'test-room',
    onFileSelect: vi.fn(),
    selectedFileId: undefined
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render loading state initially', () => {
    mockFileService.getFileStructure.mockImplementation(() => new Promise(() => {}));

    render(<FileExplorer {...mockProps} />);

    expect(screen.getByText('Files')).toBeInTheDocument();
    // Loading animation should be present
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();
  });

  it('should render empty state when no files', async () => {
    mockFileService.getFileStructure.mockResolvedValue([]);

    render(<FileExplorer {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('No files yet')).toBeInTheDocument();
      expect(screen.getByText('Create first file')).toBeInTheDocument();
    });
  });

  it('should render file structure when files exist', async () => {
    const mockFiles: FileSystemItem[] = [
      {
        id: '1',
        name: 'src',
        type: 'folder',
        path: '/src',
        createdAt: new Date(),
        updatedAt: new Date(),
        children: [
          {
            id: '2',
            name: 'index.ts',
            type: 'file',
            path: '/src/index.ts',
            parentId: '1',
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ]
      },
      {
        id: '3',
        name: 'README.md',
        type: 'file',
        path: '/README.md',
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    mockFileService.getFileStructure.mockResolvedValue(mockFiles);

    render(<FileExplorer {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('src')).toBeInTheDocument();
      expect(screen.getByText('README.md')).toBeInTheDocument();
    });
  });

  it('should render error state when loading fails', async () => {
    mockFileService.getFileStructure.mockRejectedValue(new Error('Network error'));

    render(<FileExplorer {...mockProps} />);

    await waitFor(() => {
      expect(screen.getByText('Failed to load file structure')).toBeInTheDocument();
      expect(screen.getByText('Retry')).toBeInTheDocument();
    });
  });

  it('should have create file and folder buttons', async () => {
    mockFileService.getFileStructure.mockResolvedValue([]);

    render(<FileExplorer {...mockProps} />);

    await waitFor(() => {
      // Check for the new file and new folder buttons in the header
      const buttons = screen.getAllByRole('button');
      expect(buttons.some(button => button.getAttribute('title') === 'New File')).toBe(true);
      expect(buttons.some(button => button.getAttribute('title') === 'New Folder')).toBe(true);
    });
  });
});