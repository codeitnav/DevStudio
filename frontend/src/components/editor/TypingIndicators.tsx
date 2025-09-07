import React from 'react';
import type { CollaborativeUser } from '../../types/editor';
import { useResponsive } from '../../hooks/useResponsive';

interface TypingIndicatorsProps {
  collaborators: Map<string, CollaborativeUser>;
  className?: string;
}

export const TypingIndicators: React.FC<TypingIndicatorsProps> = ({
  collaborators,
  className = '',
}) => {
  const { isMobile } = useResponsive();
  
  // Get users who are currently typing
  const typingUsers = Array.from(collaborators.values()).filter(user => user.isTyping);

  if (typingUsers.length === 0) {
    return null;
  }

  const formatTypingMessage = (users: CollaborativeUser[]): string => {
    if (isMobile) {
      // Shorter messages for mobile
      if (users.length === 1) {
        return `${users[0].username.split(' ')[0]} typing...`;
      } else {
        return `${users.length} typing...`;
      }
    }
    
    // Full messages for desktop
    if (users.length === 1) {
      return `${users[0].username} is typing...`;
    } else if (users.length === 2) {
      return `${users[0].username} and ${users[1].username} are typing...`;
    } else if (users.length === 3) {
      return `${users[0].username}, ${users[1].username}, and ${users[2].username} are typing...`;
    } else {
      return `${users[0].username}, ${users[1].username}, and ${users.length - 2} others are typing...`;
    }
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-center space-x-2 px-2 sm:px-3 py-2 bg-gray-50 border-t border-gray-200">
        <div className="flex space-x-1 flex-shrink-0">
          {/* User color indicators */}
          {typingUsers.slice(0, isMobile ? 2 : 3).map((user) => (
            <div
              key={user.userId}
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: user.color }}
            />
          ))}
        </div>
        <span className="text-xs sm:text-sm text-gray-600 truncate">
          {formatTypingMessage(typingUsers)}
        </span>
      </div>
    </div>
  );
};

export default TypingIndicators;