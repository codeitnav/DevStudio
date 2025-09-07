import React from 'react';
import { Button } from '../ui/Button';
import { LanguageSelector } from './LanguageSelector';
import { SaveIndicator } from './SaveIndicator';
import { 
  Code, 
  WrapText, 
  Map, 
  Search,
  Settings
} from 'lucide-react';

export interface EditorToolbarProps {
  language: string;
  onLanguageChange: (language: string) => void;
  onFormatCode: () => void;
  onToggleWordWrap: () => void;
  onToggleMinimap: () => void;
  onSave?: () => void;
  onFind?: () => void;
  // Save indicator props
  hasUnsavedChanges?: boolean;
  isSaving?: boolean;
  lastSaved?: Date;
  className?: string;
}

export const EditorToolbar: React.FC<EditorToolbarProps> = ({
  language,
  onLanguageChange,
  onFormatCode,
  onToggleWordWrap,
  onToggleMinimap,
  onSave,
  onFind,
  hasUnsavedChanges = false,
  isSaving = false,
  lastSaved,
  className = '',
}) => {
  return (
    <div className={`flex items-center justify-between px-4 py-2 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 ${className}`}>
      <div className="flex items-center space-x-2">
        <LanguageSelector
          value={language}
          onChange={onLanguageChange}
        />
        
        <div className="h-4 w-px bg-gray-300 dark:bg-gray-600" />
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onFormatCode}
          title="Format Code (Shift+Alt+F)"
          className="h-8 px-2"
        >
          <Code className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleWordWrap}
          title="Toggle Word Wrap"
          className="h-8 px-2"
        >
          <WrapText className="h-4 w-4" />
        </Button>
        
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleMinimap}
          title="Toggle Minimap"
          className="h-8 px-2"
        >
          <Map className="h-4 w-4" />
        </Button>
      </div>
      
      <div className="flex items-center space-x-4">
        <SaveIndicator
          hasUnsavedChanges={hasUnsavedChanges}
          isSaving={isSaving}
          lastSaved={lastSaved}
          onManualSave={onSave}
        />
        
        <div className="flex items-center space-x-2">
          {onFind && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onFind}
              title="Find (Ctrl+F)"
              className="h-8 px-2"
            >
              <Search className="h-4 w-4" />
            </Button>
          )}
          
          <Button
            variant="ghost"
            size="sm"
            title="Editor Settings"
            className="h-8 px-2"
          >
            <Settings className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};