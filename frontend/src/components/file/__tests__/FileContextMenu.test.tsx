import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { FileContextMenu } from '../FileContextMenu';
import { FileSystemItem } from '../../../types/file';

const mockFile: FileSystemItem = {
  id: 'file-1',
  name: 'test.js',
  path: '/test.js',
  type: 'file',
  createdAt: new Date(),
  updatedAt: new Date()
};

const mockFolder: FileSystemItem = {
  id: 'folder-1',
  name: 'src',
  path: '/src',
  type: 'folder',
  createdAt: new Date(),
  updatedAt: new Date()
};

describe('FileContextMenu', () => {
  const defaultProps = {
    position: { x: 100, y: 100 },
    onClose: vi.fn(),
    onRename: vi.fn(),
    onDelete: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders context menu for file', () => {
    render(
      <FileContextMenu
        item={mockFile}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Rename')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.queryByText('New File')).not.toBeInTheDocument();
    expect(screen.queryByText('New Folder')).not.toBeInTheDocument();
  });

  it('renders context menu for folder with create options', () => {
    render(
      <FileContextMenu
        item={mockFolder}
        onCreateFile={vi.fn()}
        onCreateFolder={vi.fn()}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Rename')).toBeInTheDocument();
    expect(screen.getByText('Delete')).toBeInTheDocument();
    expect(screen.getByText('New File')).toBeInTheDocument();
    expect(screen.getByText('New Folder')).toBeInTheDocument();
  });

  it('calls onRename when rename is clicked', () => {
    const onRename = vi.fn();
    render(
      <FileContextMenu
        item={mockFile}
        {...defaultProps}
        onRename={onRename}
      />
    );

    fireEvent.click(screen.getByText('Rename'));
    expect(onRename).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onDelete when delete is clicked', () => {
    const onDelete = vi.fn();
    render(
      <FileContextMenu
        item={mockFile}
        {...defaultProps}
        onDelete={onDelete}
      />
    );

    fireEvent.click(screen.getByText('Delete'));
    expect(onDelete).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onCreateFile when new file is clicked', () => {
    const onCreateFile = vi.fn();
    render(
      <FileContextMenu
        item={mockFolder}
        onCreateFile={onCreateFile}
        {...defaultProps}
      />
    );

    fireEvent.click(screen.getByText('New File'));
    expect(onCreateFile).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', () => {
    render(
      <FileContextMenu
        item={mockFile}
        {...defaultProps}
      />
    );

    const backdrop = document.querySelector('.fixed.inset-0');
    expect(backdrop).toBeInTheDocument();
    
    fireEvent.click(backdrop!);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('positions menu correctly', () => {
    render(
      <FileContextMenu
        item={mockFile}
        position={{ x: 200, y: 300 }}
        {...defaultProps}
      />
    );

    const menu = document.querySelector('.fixed.bg-white');
    expect(menu).toHaveStyle({
      left: '200px',
      top: '300px'
    });
  });

  it('shows download option for files when provided', () => {
    const onDownload = vi.fn();
    render(
      <FileContextMenu
        item={mockFile}
        onDownload={onDownload}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Download')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Download'));
    expect(onDownload).toHaveBeenCalledTimes(1);
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
  });

  it('shows copy and cut options when provided', () => {
    const onCopy = vi.fn();
    const onCut = vi.fn();
    render(
      <FileContextMenu
        item={mockFile}
        onCopy={onCopy}
        onCut={onCut}
        {...defaultProps}
      />
    );

    expect(screen.getByText('Copy')).toBeInTheDocument();
    expect(screen.getByText('Cut')).toBeInTheDocument();
    
    fireEvent.click(screen.getByText('Copy'));
    expect(onCopy).toHaveBeenCalledTimes(1);
    
    fireEvent.click(screen.getByText('Cut'));
    expect(onCut).toHaveBeenCalledTimes(1);
  });
});