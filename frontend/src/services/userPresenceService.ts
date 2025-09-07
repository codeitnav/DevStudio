import { socketService } from './socketService';

export interface UserActivity {
  userId: string;
  username: string;
  lastActivity: Date;
  isActive: boolean;
  isTyping: boolean;
  isFocused: boolean;
}

export interface UserPresenceOptions {
  idleTimeout?: number; // Time in ms before user is considered idle
  typingTimeout?: number; // Time in ms before typing status is cleared
  activityCheckInterval?: number; // Interval for checking user activity
}

class UserPresenceService {
  private activities = new Map<string, UserActivity>();
  private currentRoomId: string | null = null;
  private currentUserId: string | null = null;
  private currentUsername: string | null = null;
  
  // Configuration
  private idleTimeout = 5 * 60 * 1000; // 5 minutes
  private typingTimeout = 3000; // 3 seconds
  private activityCheckInterval = 30000; // 30 seconds
  
  // Timers and intervals
  private typingTimeouts = new Map<string, NodeJS.Timeout>();
  private idleCheckInterval: NodeJS.Timeout | null = null;
  private lastActivityTime = Date.now();
  private isWindowFocused = true;
  
  // Event listeners
  private eventListeners = new Map<string, Function[]>();

  constructor(options: UserPresenceOptions = {}) {
    this.idleTimeout = options.idleTimeout ?? this.idleTimeout;
    this.typingTimeout = options.typingTimeout ?? this.typingTimeout;
    this.activityCheckInterval = options.activityCheckInterval ?? this.activityCheckInterval;
    
    this.setupActivityTracking();
    this.setupSocketListeners();
  }

  /**
   * Initialize presence tracking for a room
   */
  initialize(roomId: string, userId: string, username: string): void {
    this.currentRoomId = roomId;
    this.currentUserId = userId;
    this.currentUsername = username;
    
    // Start activity monitoring
    this.startActivityMonitoring();
    
    // Send initial presence update
    this.sendPresenceUpdate();
  }

  /**
   * Cleanup presence tracking
   */
  cleanup(): void {
    this.stopActivityMonitoring();
    this.clearAllTypingTimeouts();
    this.activities.clear();
    this.currentRoomId = null;
    this.currentUserId = null;
    this.currentUsername = null;
  }

  /**
   * Update user typing status
   */
  updateTypingStatus(userId: string, username: string, isTyping: boolean): void {
    const activity = this.activities.get(userId) || {
      userId,
      username,
      lastActivity: new Date(),
      isActive: true,
      isTyping: false,
      isFocused: true,
    };

    activity.isTyping = isTyping;
    activity.lastActivity = new Date();
    
    if (isTyping) {
      // Clear existing timeout
      const existingTimeout = this.typingTimeouts.get(userId);
      if (existingTimeout) {
        clearTimeout(existingTimeout);
      }
      
      // Set new timeout to clear typing status
      const timeout = setTimeout(() => {
        this.updateTypingStatus(userId, username, false);
      }, this.typingTimeout);
      
      this.typingTimeouts.set(userId, timeout);
    } else {
      // Clear timeout
      const timeout = this.typingTimeouts.get(userId);
      if (timeout) {
        clearTimeout(timeout);
        this.typingTimeouts.delete(userId);
      }
    }

    this.activities.set(userId, activity);
    this.emitEvent('typing:changed', { userId, username, isTyping });
  }

  /**
   * Update user focus status
   */
  updateFocusStatus(userId: string, username: string, isFocused: boolean): void {
    const activity = this.activities.get(userId) || {
      userId,
      username,
      lastActivity: new Date(),
      isActive: true,
      isTyping: false,
      isFocused,
    };

    activity.isFocused = isFocused;
    activity.lastActivity = new Date();
    this.activities.set(userId, activity);
    
    this.emitEvent('focus:changed', { userId, username, isFocused });
  }

  /**
   * Update user activity
   */
  updateActivity(userId: string, username: string): void {
    const activity = this.activities.get(userId) || {
      userId,
      username,
      lastActivity: new Date(),
      isActive: true,
      isTyping: false,
      isFocused: true,
    };

    const wasActive = activity.isActive;
    activity.lastActivity = new Date();
    activity.isActive = true;
    
    this.activities.set(userId, activity);
    
    // Emit event if user became active
    if (!wasActive) {
      this.emitEvent('activity:changed', { userId, username, isActive: true });
    }
  }

  /**
   * Get current user activities
   */
  getActivities(): Map<string, UserActivity> {
    return new Map(this.activities);
  }

  /**
   * Get typing users
   */
  getTypingUsers(): UserActivity[] {
    return Array.from(this.activities.values()).filter(activity => activity.isTyping);
  }

  /**
   * Get active users
   */
  getActiveUsers(): UserActivity[] {
    return Array.from(this.activities.values()).filter(activity => activity.isActive);
  }

  /**
   * Check if user is idle
   */
  isUserIdle(userId: string): boolean {
    const activity = this.activities.get(userId);
    if (!activity) return true;
    
    const timeSinceLastActivity = Date.now() - activity.lastActivity.getTime();
    return timeSinceLastActivity > this.idleTimeout;
  }

  /**
   * Send current user's presence update
   */
  sendPresenceUpdate(): void {
    if (!this.currentRoomId || !this.currentUserId || !socketService.isConnected()) {
      return;
    }

    const presenceData = {
      roomId: this.currentRoomId,
      userId: this.currentUserId,
      username: this.currentUsername,
      isActive: !this.isCurrentUserIdle(),
      isFocused: this.isWindowFocused,
      lastActivity: new Date(),
    };

    socketService.emit('presence:update', presenceData);
  }

  /**
   * Add event listener
   */
  on(event: string, callback: Function): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)!.push(callback);
  }

  /**
   * Remove event listener
   */
  off(event: string, callback: Function): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(callback);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Setup activity tracking for current user
   */
  private setupActivityTracking(): void {
    // Track mouse movement, keyboard input, and focus changes
    const updateActivity = () => {
      this.lastActivityTime = Date.now();
      if (this.currentUserId && this.currentUsername) {
        this.updateActivity(this.currentUserId, this.currentUsername);
      }
    };

    // Window focus/blur events
    const handleFocus = () => {
      this.isWindowFocused = true;
      updateActivity();
      if (this.currentUserId && this.currentUsername) {
        this.updateFocusStatus(this.currentUserId, this.currentUsername, true);
      }
    };

    const handleBlur = () => {
      this.isWindowFocused = false;
      if (this.currentUserId && this.currentUsername) {
        this.updateFocusStatus(this.currentUserId, this.currentUsername, false);
      }
    };

    // Activity events
    const activityEvents = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    
    activityEvents.forEach(event => {
      document.addEventListener(event, updateActivity, { passive: true });
    });

    window.addEventListener('focus', handleFocus);
    window.addEventListener('blur', handleBlur);

    // Store cleanup function
    this.cleanupActivityTracking = () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, updateActivity);
      });
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('blur', handleBlur);
    };
  }

  private cleanupActivityTracking: (() => void) | null = null;

  /**
   * Setup socket event listeners
   */
  private setupSocketListeners(): void {
    // Listen for typing status updates
    socketService.on('typing:status', (data: {
      roomId: string;
      userId: string;
      username: string;
      isTyping: boolean;
    }) => {
      if (data.roomId === this.currentRoomId && data.userId !== this.currentUserId) {
        this.updateTypingStatus(data.userId, data.username, data.isTyping);
      }
    });

    // Listen for presence updates
    socketService.on('presence:update', (data: {
      roomId: string;
      userId: string;
      username: string;
      isActive: boolean;
      isFocused: boolean;
      lastActivity: string;
    }) => {
      if (data.roomId === this.currentRoomId && data.userId !== this.currentUserId) {
        const activity: UserActivity = {
          userId: data.userId,
          username: data.username,
          lastActivity: new Date(data.lastActivity),
          isActive: data.isActive,
          isTyping: this.activities.get(data.userId)?.isTyping || false,
          isFocused: data.isFocused,
        };
        
        this.activities.set(data.userId, activity);
        this.emitEvent('presence:updated', activity);
      }
    });

    // Listen for user join/leave events
    socketService.on('room:user-joined', (data: {
      roomId: string;
      userId: string;
      username: string;
    }) => {
      if (data.roomId === this.currentRoomId && data.userId !== this.currentUserId) {
        const activity: UserActivity = {
          userId: data.userId,
          username: data.username,
          lastActivity: new Date(),
          isActive: true,
          isTyping: false,
          isFocused: true,
        };
        
        this.activities.set(data.userId, activity);
        this.emitEvent('user:joined', activity);
      }
    });

    socketService.on('room:user-left', (data: {
      roomId: string;
      userId: string;
    }) => {
      if (data.roomId === this.currentRoomId) {
        const activity = this.activities.get(data.userId);
        this.activities.delete(data.userId);
        
        // Clear typing timeout if exists
        const timeout = this.typingTimeouts.get(data.userId);
        if (timeout) {
          clearTimeout(timeout);
          this.typingTimeouts.delete(data.userId);
        }
        
        if (activity) {
          this.emitEvent('user:left', activity);
        }
      }
    });
  }

  /**
   * Start activity monitoring
   */
  private startActivityMonitoring(): void {
    this.idleCheckInterval = setInterval(() => {
      this.checkIdleUsers();
      this.sendPresenceUpdate();
    }, this.activityCheckInterval);
  }

  /**
   * Stop activity monitoring
   */
  private stopActivityMonitoring(): void {
    if (this.idleCheckInterval) {
      clearInterval(this.idleCheckInterval);
      this.idleCheckInterval = null;
    }
    
    if (this.cleanupActivityTracking) {
      this.cleanupActivityTracking();
      this.cleanupActivityTracking = null;
    }
  }

  /**
   * Check for idle users and update their status
   */
  private checkIdleUsers(): void {
    const now = Date.now();
    
    this.activities.forEach((activity, userId) => {
      const timeSinceLastActivity = now - activity.lastActivity.getTime();
      const wasActive = activity.isActive;
      const isActive = timeSinceLastActivity <= this.idleTimeout;
      
      if (wasActive !== isActive) {
        activity.isActive = isActive;
        this.activities.set(userId, activity);
        this.emitEvent('activity:changed', {
          userId,
          username: activity.username,
          isActive,
        });
      }
    });
  }

  /**
   * Check if current user is idle
   */
  private isCurrentUserIdle(): boolean {
    const timeSinceLastActivity = Date.now() - this.lastActivityTime;
    return timeSinceLastActivity > this.idleTimeout;
  }

  /**
   * Clear all typing timeouts
   */
  private clearAllTypingTimeouts(): void {
    this.typingTimeouts.forEach(timeout => clearTimeout(timeout));
    this.typingTimeouts.clear();
  }

  /**
   * Emit event to listeners
   */
  private emitEvent(event: string, data: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in presence service event listener for '${event}':`, error);
        }
      });
    }
  }
}

// Create and export singleton instance
export const userPresenceService = new UserPresenceService();
export default userPresenceService;