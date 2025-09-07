const Room = require('../models/Room');
const mongoose = require('mongoose');

class FileSystemService {
  async createFileSystemItem(roomId, itemData) {
    try {
      const room = await Room.findOne({
        $or: [{ roomId }, { joinCode: roomId }]
      });

      if (!room) {
        throw new Error('Room not found');
      }

      const { type, name, parentId, content = '', extension, createdBy } = itemData;

      // Validate parent folder exists if specified
      if (parentId && parentId !== 'root') {
        const parentFolder = room.folders.id(parentId);
        if (!parentFolder) {
          throw new Error('Parent folder not found');
        }
      }

      // Generate path
      const parentPath = await this.getItemPath(room, parentId);
      const fullPath = parentPath === '/' ? `/${name}` : `${parentPath}/${name}`;

      // Check for duplicate names in the same directory
      const existingItem = await this.findItemByPath(room, fullPath);
      if (existingItem) {
        throw new Error(`${type} with name "${name}" already exists in this directory`);
      }

      let newItem;
      
      if (type === 'file') {
        newItem = {
          name,
          type: 'file',
          extension: extension || this.getFileExtension(name),
          content,
          path: fullPath,
          parentId: parentId === 'root' ? room.rootFolderId : parentId,
          size: content ? content.length : 0,
          createdBy,
          lastModifiedBy: createdBy
        };

        room.files.push(newItem);
        room.totalFiles += 1;

        // Add to parent folder's children
        if (parentId && parentId !== 'root') {
          const parentFolder = room.folders.id(parentId);
          parentFolder.children.push(newItem._id);
        } else {
          const rootFolder = room.folders.id(room.rootFolderId);
          rootFolder.children.push(newItem._id);
        }

      } else if (type === 'folder') {
        newItem = {
          name,
          type: 'folder',
          path: fullPath,
          parentId: parentId === 'root' ? room.rootFolderId : parentId,
          children: [],
          createdBy
        };

        room.folders.push(newItem);
        room.totalFolders += 1;

        // Add to parent folder's children
        if (parentId && parentId !== 'root') {
          const parentFolder = room.folders.id(parentId);
          parentFolder.children.push(newItem._id);
        } else {
          const rootFolder = room.folders.id(room.rootFolderId);
          rootFolder.children.push(newItem._id);
        }
      }

      room.lastActivity = new Date();
      await room.save();

      return {
        success: true,
        item: newItem,
        message: `${type} created successfully`
      };

    } catch (error) {
      throw new Error(`Failed to create ${itemData.type}: ${error.message}`);
    }
  }

  // Delete a file or folder
  async deleteFileSystemItem(roomId, itemId) {
    try {
      const room = await Room.findOne({
        $or: [{ roomId }, { joinCode: roomId }]
      });

      if (!room) {
        throw new Error('Room not found');
      }

      // Find the item (could be file or folder)
      const file = room.files.id(itemId);
      const folder = room.folders.id(itemId);

      if (!file && !folder) {
        throw new Error('File or folder not found');
      }

      if (file) {
        // Delete file
        await this.deleteFile(room, file);
      } else if (folder) {
        // Delete folder and all its contents
        if (folder._id.equals(room.rootFolderId)) {
          throw new Error('Cannot delete root folder');
        }
        await this.deleteFolder(room, folder);
      }

      room.lastActivity = new Date();
      await room.save();

      return {
        success: true,
        message: `${file ? 'File' : 'Folder'} deleted successfully`
      };

    } catch (error) {
      throw new Error(`Failed to delete item: ${error.message}`);
    }
  }

  // Rename a file or folder
  async renameFileSystemItem(roomId, itemId, newName) {
    try {
      const room = await Room.findOne({
        $or: [{ roomId }, { joinCode: roomId }]
      });

      if (!room) {
        throw new Error('Room not found');
      }

      // Find the item
      const file = room.files.id(itemId);
      const folder = room.folders.id(itemId);

      if (!file && !folder) {
        throw new Error('File or folder not found');
      }

      const item = file || folder;
      const oldPath = item.path;
      const parentPath = oldPath.substring(0, oldPath.lastIndexOf('/')) || '/';
      const newPath = parentPath === '/' ? `/${newName}` : `${parentPath}/${newName}`;

      // Check for duplicate names in the same directory
      const existingItem = await this.findItemByPath(room, newPath);
      if (existingItem && !existingItem._id.equals(item._id)) {
        throw new Error(`Item with name "${newName}" already exists in this directory`);
      }

      // Update name and path
      item.name = newName;
      item.path = newPath;

      if (file) {
        // Update file extension if it's a file
        file.extension = this.getFileExtension(newName);
        file.lastModifiedBy = file.createdBy; // Should be current user in real implementation
      }

      // If it's a folder, update all child paths recursively
      if (folder) {
        await this.updateChildPaths(room, folder, oldPath, newPath);
      }

      room.lastActivity = new Date();
      await room.save();

      return {
        success: true,
        item: item,
        message: `${file ? 'File' : 'Folder'} renamed successfully`
      };

    } catch (error) {
      throw new Error(`Failed to rename item: ${error.message}`);
    }
  }

  // Get file system structure
  async getFileSystemStructure(roomId) {
    try {
      const room = await Room.findOne({
        $or: [{ roomId }, { joinCode: roomId }]
      });

      if (!room) {
        throw new Error('Room not found');
      }

      const rootFolder = room.folders.id(room.rootFolderId);
      if (!rootFolder) {
        throw new Error('Root folder not found');
      }

      const structure = await this.buildFileTree(room, rootFolder);

      return {
        success: true,
        structure,
        stats: {
          totalFiles: room.totalFiles,
          totalFolders: room.totalFolders,
          lastActivity: room.lastActivity
        }
      };

    } catch (error) {
      throw new Error(`Failed to get file system structure: ${error.message}`);
    }
  }

  // Get file content
  async getFileContent(roomId, fileId) {
    try {
      const room = await Room.findOne({
        $or: [{ roomId }, { joinCode: roomId }]
      });

      if (!room) {
        throw new Error('Room not found');
      }

      const file = room.files.id(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      return {
        success: true,
        file: {
          id: file._id,
          name: file.name,
          extension: file.extension,
          content: file.content,
          path: file.path,
          size: file.size,
          createdAt: file.createdAt,
          updatedAt: file.updatedAt
        }
      };

    } catch (error) {
      throw new Error(`Failed to get file content: ${error.message}`);
    }
  }

  // Update file content
  async updateFileContent(roomId, fileId, content, modifiedBy) {
    try {
      const room = await Room.findOne({
        $or: [{ roomId }, { joinCode: roomId }]
      });

      if (!room) {
        throw new Error('Room not found');
      }

      const file = room.files.id(fileId);
      if (!file) {
        throw new Error('File not found');
      }

      file.content = content;
      file.size = content.length;
      file.lastModifiedBy = modifiedBy;
      file.updatedAt = new Date();

      room.lastActivity = new Date();
      await room.save();

      return {
        success: true,
        file: file,
        message: 'File content updated successfully'
      };

    } catch (error) {
      throw new Error(`Failed to update file content: ${error.message}`);
    }
  }

  // Helper Methods

  async deleteFile(room, file) {
    // Remove from parent folder's children
    const parentFolder = room.folders.id(file.parentId);
    if (parentFolder) {
      parentFolder.children = parentFolder.children.filter(
        childId => !childId.equals(file._id)
      );
    }

    // Remove from room's files array
    room.files = room.files.filter(f => !f._id.equals(file._id));
    room.totalFiles -= 1;
  }

  async deleteFolder(room, folder) {
    // Recursively delete all children
    for (const childId of folder.children) {
      const childFile = room.files.id(childId);
      const childFolder = room.folders.id(childId);

      if (childFile) {
        await this.deleteFile(room, childFile);
      } else if (childFolder) {
        await this.deleteFolder(room, childFolder);
      }
    }

    // Remove from parent folder's children
    const parentFolder = room.folders.id(folder.parentId);
    if (parentFolder) {
      parentFolder.children = parentFolder.children.filter(
        childId => !childId.equals(folder._id)
      );
    }

    // Remove from room's folders array
    room.folders = room.folders.filter(f => !f._id.equals(folder._id));
    room.totalFolders -= 1;
  }

  async updateChildPaths(room, folder, oldPath, newPath) {
    for (const childId of folder.children) {
      const childFile = room.files.id(childId);
      const childFolder = room.folders.id(childId);

      if (childFile) {
        childFile.path = childFile.path.replace(oldPath, newPath);
      } else if (childFolder) {
        const oldChildPath = childFolder.path;
        childFolder.path = childFolder.path.replace(oldPath, newPath);
        await this.updateChildPaths(room, childFolder, oldChildPath, childFolder.path);
      }
    }
  }

  async buildFileTree(room, folder) {
    const children = [];

    for (const childId of folder.children) {
      const childFile = room.files.id(childId);
      const childFolder = room.folders.id(childId);

      if (childFile) {
        children.push({
          id: childFile._id,
          name: childFile.name,
          type: 'file',
          extension: childFile.extension,
          path: childFile.path,
          size: childFile.size,
          createdAt: childFile.createdAt,
          updatedAt: childFile.updatedAt
        });
      } else if (childFolder) {
        const subTree = await this.buildFileTree(room, childFolder);
        children.push(subTree);
      }
    }

    return {
      id: folder._id,
      name: folder.name,
      type: 'folder',
      path: folder.path,
      children: children.sort((a, b) => {
        // Folders first, then files, both alphabetically
        if (a.type !== b.type) {
          return a.type === 'folder' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      }),
      createdAt: folder.createdAt,
      updatedAt: folder.updatedAt
    };
  }

  async getItemPath(room, parentId) {
    if (!parentId || parentId === 'root') {
      return '/';
    }

    const parentFolder = room.folders.id(parentId);
    return parentFolder ? parentFolder.path : '/';
  }

  async findItemByPath(room, path) {
    const file = room.files.find(f => f.path === path);
    const folder = room.folders.find(f => f.path === path);
    return file || folder;
  }

  getFileExtension(filename) {
    const parts = filename.split('.');
    return parts.length > 1 ? parts.pop().toLowerCase() : '';
  }
}

module.exports = new FileSystemService();