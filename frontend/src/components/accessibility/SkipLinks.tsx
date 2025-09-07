import React from 'react';

export const SkipLinks: React.FC = () => {
  return (
    <div className="sr-only-focusable">
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <a href="#navigation" className="skip-link">
        Skip to navigation
      </a>
      <a href="#file-explorer" className="skip-link">
        Skip to file explorer
      </a>
      <a href="#code-editor" className="skip-link">
        Skip to code editor
      </a>
    </div>
  );
};