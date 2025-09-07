import React from 'react';
import { Save, Clock, AlertCircle, Check } from 'lucide-react';

interface SaveIndicatorProps {
  hasUnsavedChanges: boolean;
  isSaving: boolean;
  lastSaved?: Date;
  onManualSave?: () => void;
  className?: string;
}

export const SaveIndicator: React.FC<SaveIndicatorProps> = ({
  hasUnsavedChanges,
  isSaving,
  lastSaved,
  onManualSave,
  className = ''
}) => {
  const getStatusIcon = () => {
    if (isSaving) {
      return <Clock className="h-4 w-4 text-blue-500 animate-spin" />;
    }
    if (hasUnsavedChanges) {
      return <AlertCircle className="h-4 w-4 text-orange-500" />;
    }
    return <Check className="h-4 w-4 text-green-500" />;
  };

  const getStatusText = () => {
    if (isSaving) {
      return 'Saving...';
    }
    if (hasUnsavedChanges) {
      return 'Unsaved changes';
    }
    if (lastSaved) {
      const now = new Date();
      const diff = now.getTime() - lastSaved.getTime();
      const seconds = Math.floor(diff / 1000);
      const minutes = Math.floor(seconds / 60);
      
      if (minutes > 0) {
        return `Saved ${minutes}m ago`;
      } else if (seconds > 0) {
        return `Saved ${seconds}s ago`;
      } else {
        return 'Saved just now';
      }
    }
    return 'All changes saved';
  };

  return (
    <div className={`flex items-center gap-2 text-sm ${className}`}>
      {getStatusIcon()}
      <span className="text-gray-600">{getStatusText()}</span>
      {onManualSave && hasUnsavedChanges && (
        <button
          onClick={onManualSave}
          className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
          title="Save now (Ctrl+S)"
        >
          <Save className="h-3 w-3" />
          Save
        </button>
      )}
    </div>
  );
};