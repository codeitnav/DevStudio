import React from 'react';
import {
  File,
  FileText,
  Code,
  FileJson,
  Database,
  Settings,
  Folder as FolderIcon,
  FileCode,
  Globe,
  Palette,
  Package,
  Terminal,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  Archive,
  Lock
} from 'lucide-react';

// File extension to language mapping
export const getLanguageFromExtension = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const languageMap: Record<string, string> = {
    // JavaScript/TypeScript
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'mjs': 'javascript',
    'cjs': 'javascript',
    
    // Web
    'html': 'html',
    'htm': 'html',
    'css': 'css',
    'scss': 'scss',
    'sass': 'sass',
    'less': 'less',
    
    // Python
    'py': 'python',
    'pyw': 'python',
    'pyc': 'python',
    
    // Java
    'java': 'java',
    'class': 'java',
    'jar': 'java',
    
    // C/C++
    'c': 'c',
    'cpp': 'cpp',
    'cxx': 'cpp',
    'cc': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'hxx': 'cpp',
    
    // C#
    'cs': 'csharp',
    
    // Go
    'go': 'go',
    
    // Rust
    'rs': 'rust',
    
    // PHP
    'php': 'php',
    'phtml': 'php',
    
    // Ruby
    'rb': 'ruby',
    'rbw': 'ruby',
    
    // Shell
    'sh': 'shell',
    'bash': 'shell',
    'zsh': 'shell',
    'fish': 'shell',
    
    // Config files
    'json': 'json',
    'xml': 'xml',
    'yaml': 'yaml',
    'yml': 'yaml',
    'toml': 'toml',
    'ini': 'ini',
    'conf': 'ini',
    'config': 'ini',
    
    // Markdown
    'md': 'markdown',
    'markdown': 'markdown',
    
    // SQL
    'sql': 'sql',
    
    // Docker
    'dockerfile': 'dockerfile',
    
    // Plain text
    'txt': 'plaintext',
    'text': 'plaintext',
    'log': 'plaintext',
    
    // Other
    'gitignore': 'plaintext',
    'env': 'plaintext',
    'example': 'plaintext'
  };
  
  return languageMap[ext || ''] || 'plaintext';
};

// Get file icon based on extension or filename
export const getFileIcon = (filename: string, isFolder: boolean = false): React.ReactElement => {
  if (isFolder) {
    return <FolderIcon className="h-4 w-4 text-blue-500" />;
  }
  
  const ext = filename.split('.').pop()?.toLowerCase();
  const name = filename.toLowerCase();
  
  // Special files by name
  if (name === 'package.json' || name === 'package-lock.json') {
    return <Package className="h-4 w-4 text-green-600" />;
  }
  if (name === 'dockerfile' || name.startsWith('docker-compose')) {
    return <Package className="h-4 w-4 text-blue-600" />;
  }
  if (name === '.gitignore' || name === '.gitattributes') {
    return <Settings className="h-4 w-4 text-orange-500" />;
  }
  if (name === 'readme.md' || name === 'readme.txt') {
    return <FileText className="h-4 w-4 text-blue-600" />;
  }
  if (name.includes('license')) {
    return <Lock className="h-4 w-4 text-gray-600" />;
  }
  
  // Icons by extension
  switch (ext) {
    // Code files
    case 'js':
    case 'jsx':
    case 'mjs':
    case 'cjs':
      return <FileCode className="h-4 w-4 text-yellow-500" />;
    case 'ts':
    case 'tsx':
      return <FileCode className="h-4 w-4 text-blue-600" />;
    case 'py':
    case 'pyw':
      return <FileCode className="h-4 w-4 text-green-600" />;
    case 'java':
      return <FileCode className="h-4 w-4 text-red-600" />;
    case 'c':
    case 'cpp':
    case 'cxx':
    case 'cc':
    case 'h':
    case 'hpp':
      return <FileCode className="h-4 w-4 text-blue-700" />;
    case 'cs':
      return <FileCode className="h-4 w-4 text-purple-600" />;
    case 'go':
      return <FileCode className="h-4 w-4 text-cyan-600" />;
    case 'rs':
      return <FileCode className="h-4 w-4 text-orange-600" />;
    case 'php':
      return <FileCode className="h-4 w-4 text-purple-500" />;
    case 'rb':
      return <FileCode className="h-4 w-4 text-red-500" />;
    
    // Web files
    case 'html':
    case 'htm':
      return <Globe className="h-4 w-4 text-orange-500" />;
    case 'css':
    case 'scss':
    case 'sass':
    case 'less':
      return <Palette className="h-4 w-4 text-blue-500" />;
    
    // Data files
    case 'json':
      return <FileJson className="h-4 w-4 text-yellow-600" />;
    case 'xml':
      return <Code className="h-4 w-4 text-orange-600" />;
    case 'yaml':
    case 'yml':
      return <Settings className="h-4 w-4 text-red-500" />;
    case 'sql':
      return <Database className="h-4 w-4 text-blue-600" />;
    
    // Documents
    case 'md':
    case 'markdown':
      return <FileText className="h-4 w-4 text-blue-600" />;
    case 'txt':
    case 'log':
      return <FileText className="h-4 w-4 text-gray-600" />;
    
    // Images
    case 'png':
    case 'jpg':
    case 'jpeg':
    case 'gif':
    case 'svg':
    case 'webp':
    case 'ico':
      return <FileImage className="h-4 w-4 text-green-500" />;
    
    // Media
    case 'mp4':
    case 'avi':
    case 'mov':
    case 'wmv':
    case 'webm':
      return <FileVideo className="h-4 w-4 text-purple-500" />;
    case 'mp3':
    case 'wav':
    case 'ogg':
    case 'flac':
      return <FileAudio className="h-4 w-4 text-pink-500" />;
    
    // Archives
    case 'zip':
    case 'rar':
    case 'tar':
    case 'gz':
    case '7z':
      return <Archive className="h-4 w-4 text-gray-600" />;
    
    // Spreadsheets
    case 'csv':
    case 'xlsx':
    case 'xls':
      return <FileSpreadsheet className="h-4 w-4 text-green-600" />;
    
    // Shell scripts
    case 'sh':
    case 'bash':
    case 'zsh':
    case 'fish':
      return <Terminal className="h-4 w-4 text-green-700" />;
    
    default:
      return <File className="h-4 w-4 text-gray-500" />;
  }
};

// Get file type category for styling
export const getFileCategory = (filename: string): string => {
  const ext = filename.split('.').pop()?.toLowerCase();
  
  const categories: Record<string, string> = {
    // Code
    'js': 'code',
    'jsx': 'code',
    'ts': 'code',
    'tsx': 'code',
    'py': 'code',
    'java': 'code',
    'c': 'code',
    'cpp': 'code',
    'cs': 'code',
    'go': 'code',
    'rs': 'code',
    'php': 'code',
    'rb': 'code',
    
    // Web
    'html': 'web',
    'css': 'web',
    'scss': 'web',
    'sass': 'web',
    
    // Data
    'json': 'data',
    'xml': 'data',
    'yaml': 'data',
    'yml': 'data',
    'sql': 'data',
    
    // Document
    'md': 'document',
    'txt': 'document',
    'log': 'document',
    
    // Media
    'png': 'image',
    'jpg': 'image',
    'jpeg': 'image',
    'gif': 'image',
    'svg': 'image',
    'mp4': 'video',
    'mp3': 'audio',
    
    // Archive
    'zip': 'archive',
    'tar': 'archive',
    'gz': 'archive'
  };
  
  return categories[ext || ''] || 'other';
};