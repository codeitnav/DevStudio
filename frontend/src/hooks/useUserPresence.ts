import { useState, useEffect, useCallback } from 'react';
import { userPresenceService, type UserActivity } from '../services/userPresenceService';

export interface UseUserPresenceOptions {
  roomId: string;
  userId: string;
  username: string;
  enabled?: boolean;
}

export interface UseUserPresenceReturn {
  activities: Map<string, UserActivity>;
  typingUsers: UserActivity[];
  activeUsers: UserActivity[];
  isUserTyping: (userId: string) => boolean;
  isUserActive: (userId: string) => boolean;
  isUserFocused: (userId: string) => boolean;
  sendTypingStatus: (isTyping: boolean) => void;
  sendPresenceUpdate: () => void;
}

export function useUserPresence({
  roomId,
  userId,
  username,
  enabled = true,
}: UseUserPresenceOptions): UseUserPresenceReturn {
  const [activities, setActivities] = useState<Map<string, UserActivity>>(new Map());
  const [typingUsers, setTypingUsers] = useState<UserActivity[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserActivity[]>([]);

  // Initialize presence service
  useEffect(() => {
    if (!enabled) return;

    userPresenceService.initialize(roomId, userId, username);

    return () => {
      userPresenceService.cleanup();
    };
  }, [roomId, userId, username, enabled]);

  // Update state when activities change
  const updateState = useCallback(() => {
    const currentActivities = userPresenceService.getActivities();
    const currentTypingUsers = userPresenceService.getTypingUsers();
    const currentActiveUsers = userPresenceService.getActiveUsers();

    setActivities(new Map(currentActivities));
    setTypingUsers([...currentTypingUsers]);
    setActiveUsers([...currentActiveUsers]);
  }, []);

  // Setup event listeners
  useEffect(() => {
    if (!enabled) return;

    const handleTypingChanged = () => {
      updateState();
    };

    const handleActivityChanged = () => {
      updateState();
    };

    const handleFocusChanged = () => {
      updateState();
    };

    const handlePresenceUpdated = () => {
      updateState();
    };

    const handleUserJoined = () => {
      updateState();
    };

    const handleUserLeft = () => {
      updateState();
    };

    // Add event listeners
    userPresenceService.on('typing:changed', handleTypingChanged);
    userPresenceService.on('activity:changed', handleActivityChanged);
    userPresenceService.on('focus:changed', handleFocusChanged);
    userPresenceService.on('presence:updated', handlePresenceUpdated);
    userPresenceService.on('user:joined', handleUserJoined);
    userPresenceService.on('user:left', handleUserLeft);

    // Initial state update
    updateState();

    return () => {
      userPresenceService.off('typing:changed', handleTypingChanged);
      userPresenceService.off('activity:changed', handleActivityChanged);
      userPresenceService.off('focus:changed', handleFocusChanged);
      userPresenceService.off('presence:updated', handlePresenceUpdated);
      userPresenceService.off('user:joined', handleUserJoined);
      userPresenceService.off('user:left', handleUserLeft);
    };
  }, [enabled, updateState]);

  // Helper functions
  const isUserTyping = useCallback((targetUserId: string): boolean => {
    const activity = activities.get(targetUserId);
    return activity?.isTyping || false;
  }, [activities]);

  const isUserActive = useCallback((targetUserId: string): boolean => {
    const activity = activities.get(targetUserId);
    return activity?.isActive || false;
  }, [activities]);

  const isUserFocused = useCallback((targetUserId: string): boolean => {
    const activity = activities.get(targetUserId);
    return activity?.isFocused || false;
  }, [activities]);

  const sendTypingStatus = useCallback((isTyping: boolean) => {
    if (enabled) {
      userPresenceService.updateTypingStatus(userId, username, isTyping);
    }
  }, [enabled, userId, username]);

  const sendPresenceUpdate = useCallback(() => {
    if (enabled) {
      userPresenceService.sendPresenceUpdate();
    }
  }, [enabled]);

  return {
    activities,
    typingUsers,
    activeUsers,
    isUserTyping,
    isUserActive,
    isUserFocused,
    sendTypingStatus,
    sendPresenceUpdate,
  };
}