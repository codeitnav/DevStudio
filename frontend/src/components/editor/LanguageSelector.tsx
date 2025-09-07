import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

// Common programming languages supported by Monaco Editor
const SUPPORTED_LANGUAGES = [
  { id: 'javascript', name: 'JavaScript', extensions: ['.js', '.mjs'] },
  { id: 'typescript', name: 'TypeScript', extensions: ['.ts'] },
  { id: 'python', name: 'Python', extensions: ['.py'] },
  { id: 'java', name: 'Java', extensions: ['.java'] },
  { id: 'csharp', name: 'C#', extensions: ['.cs'] },
  { id: 'cpp', name: 'C++', extensions: ['.cpp', '.cc', '.cxx'] },
  { id: 'c', name: 'C', extensions: ['.c'] },
  { id: 'go', name: 'Go', extensions: ['.go'] },
  { id: 'rust', name: 'Rust', extensions: ['.rs'] },
  { id: 'php', name: 'PHP', extensions: ['.php'] },
  { id: 'ruby', name: 'Ruby', extensions: ['.rb'] },
  { id: 'swift', name: 'Swift', extensions: ['.swift'] },
  { id: 'kotlin', name: 'Kotlin', extensions: ['.kt'] },
  { id: 'scala', name: 'Scala', extensions: ['.scala'] },
  { id: 'html', name: 'HTML', extensions: ['.html', '.htm'] },
  { id: 'css', name: 'CSS', extensions: ['.css'] },
  { id: 'scss', name: 'SCSS', extensions: ['.scss'] },
  { id: 'less', name: 'Less', extensions: ['.less'] },
  { id: 'json', name: 'JSON', extensions: ['.json'] },
  { id: 'xml', name: 'XML', extensions: ['.xml'] },
  { id: 'yaml', name: 'YAML', extensions: ['.yml', '.yaml'] },
  { id: 'markdown', name: 'Markdown', extensions: ['.md', '.markdown'] },
  { id: 'sql', name: 'SQL', extensions: ['.sql'] },
  { id: 'shell', name: 'Shell', extensions: ['.sh', '.bash'] },
  { id: 'dockerfile', name: 'Dockerfile', extensions: ['Dockerfile'] },
  { id: 'plaintext', name: 'Plain Text', extensions: ['.txt'] },
];

export interface LanguageSelectorProps {
  value: string;
  onChange: (language: string) => void;
  className?: string;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  value,
  onChange,
  className = '',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const selectedLanguage = SUPPORTED_LANGUAGES.find(lang => lang.id === value);
  
  const filteredLanguages = SUPPORTED_LANGUAGES.filter(lang =>
    lang.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lang.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setSearchTerm('');
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  const handleLanguageSelect = (languageId: string) => {
    onChange(languageId);
    setIsOpen(false);
    setSearchTerm('');
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Escape') {
      setIsOpen(false);
      setSearchTerm('');
    } else if (event.key === 'Enter' && filteredLanguages.length > 0) {
      handleLanguageSelect(filteredLanguages[0].id);
    }
  };

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => setIsOpen(!isOpen)}
        className="h-8 px-3 text-sm font-medium"
      >
        {selectedLanguage?.name || 'Select Language'}
        <ChevronDown className="ml-1 h-3 w-3" />
      </Button>

      {isOpen && (
        <div className="absolute top-full left-0 z-50 mt-1 w-64 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-md shadow-lg">
          <div className="p-2 border-b border-gray-200 dark:border-gray-700">
            <div className="relative">
              <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                ref={searchInputRef}
                type="text"
                placeholder="Search languages..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={handleKeyDown}
                className="pl-8 h-8 text-sm"
              />
            </div>
          </div>
          
          <div className="max-h-64 overflow-y-auto">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((language) => (
                <button
                  key={language.id}
                  onClick={() => handleLanguageSelect(language.id)}
                  className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors ${
                    value === language.id 
                      ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400' 
                      : 'text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="font-medium">{language.name}</div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">
                    {language.extensions.join(', ')}
                  </div>
                </button>
              ))
            ) : (
              <div className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">
                No languages found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};