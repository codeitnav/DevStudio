const Y = require('yjs');
const Room = require('../models/Room');
const roomService = require('./roomService');

class DocumentPersistenceService {
  constructor() {
    this.inactivityTimers = new Map(); // roomId -> timer
    this.lastActivityTime = new Map(); // roomId -> timestamp
    this.roomClientCounts = new Map(); // roomId -> client count
    this.INACTIVITY_PERIOD = parseInt(process.env.YJS_ROOM_CLEANUP_INTERVAL) || 300000; // 5 minutes
    this.isEnabled = process.env.YJS_PERSISTENCE_ENABLED !== 'false';
    
    console.log(`📦 Document Persistence Service initialized (${this.INACTIVITY_PERIOD}ms inactivity period)`);
  }

  // Called when a client joins a room
  onClientJoin(roomId, clientId) {
    if (!this.isEnabled) return;

    const currentCount = this.roomClientCounts.get(roomId) || 0;
    this.roomClientCounts.set(roomId, currentCount + 1);
    
    // Update activity and cancel any existing save timer
    this.updateActivity(roomId);
    this.cancelInactivityTimer(roomId);
    
    console.log(`👥 Client joined room ${roomId} (${currentCount + 1} clients)`);
  }

  // Called when a client leaves a room
  async onClientLeave(roomId, clientId) {
    if (!this.isEnabled) return;

    const currentCount = this.roomClientCounts.get(roomId) || 0;
    const newCount = Math.max(0, currentCount - 1);
    this.roomClientCounts.set(roomId, newCount);
    
    console.log(`👥 Client left room ${roomId} (${newCount} clients remaining)`);
    
    if (newCount === 0) {
      // Last user left - save immediately and cleanup
      console.log(`🔒 Last user left room ${roomId}, triggering immediate save`);
      await this.saveDocumentState(roomId, 'last_user_left');
      this.cleanupRoom(roomId);
    } else {
      // Still users present - reset inactivity timer
      this.startInactivityTimer(roomId);
    }
  }

  // Called on any document update activity
  updateActivity(roomId) {
    if (!this.isEnabled) return;

    this.lastActivityTime.set(roomId, Date.now());
    
    // Reset inactivity timer if users are present
    const clientCount = this.roomClientCounts.get(roomId) || 0;
    if (clientCount > 0) {
      this.cancelInactivityTimer(roomId);
      this.startInactivityTimer(roomId);
    }
  }

  // Start/restart inactivity timer for a room
  startInactivityTimer(roomId) {
    if (!this.isEnabled) return;

    this.cancelInactivityTimer(roomId);
    
    // Start new timer
    const timer = setTimeout(async () => {
      const clientCount = this.roomClientCounts.get(roomId) || 0;
      
      if (clientCount > 0) {
        console.log(`⏰ Room ${roomId} inactive for ${this.INACTIVITY_PERIOD}ms, triggering save`);
        await this.saveDocumentState(roomId, 'inactivity_timeout');
        
        // Restart timer for continued monitoring
        this.startInactivityTimer(roomId);
      }
    }, this.INACTIVITY_PERIOD);
    
    this.inactivityTimers.set(roomId, timer);
  }

  // Cancel inactivity timer for a room
  cancelInactivityTimer(roomId) {
    const timer = this.inactivityTimers.get(roomId);
    if (timer) {
      clearTimeout(timer);
      this.inactivityTimers.delete(roomId);
    }
  }

  // Save Yjs document state to MongoDB
  async saveDocumentState(roomId, reason = 'manual') {
    try {
      console.log(`💾 Saving document state for room ${roomId} (reason: ${reason})`);
      
      // Get the Yjs document from room service
      const yjsDoc = roomService.getYjsDocument(roomId);
      
      if (!yjsDoc) {
        console.warn(`⚠️ No Yjs document found for room ${roomId}, skipping save`);
        return false;
      }

      // Encode the current document state
      const documentState = Y.encodeStateAsUpdate(yjsDoc);
      const documentBuffer = Buffer.from(documentState);
      
      // Extract text content and metadata for backup/fallback
      const sharedText = yjsDoc.getText('code');
      const sharedMetadata = yjsDoc.getMap('metadata');
      const codeContent = sharedText.toString();
      
      const metadata = {};
      sharedMetadata.forEach((value, key) => {
        metadata[key] = value;
      });

      // Find and update the room
      const room = await Room.findOne({
        $or: [{ roomId }, { joinCode: roomId }]
      });

      if (!room) {
        console.error(`❌ Room ${roomId} not found in database`);
        return false;
      }

      // Update room with document state
      const updateData = {
        yjsDocumentState: documentBuffer,
        code: codeContent, // Fallback plain text
        lastActivity: new Date(),
        lastSaved: new Date(),
        saveReason: reason
      };

      // Add language from metadata if available
      if (metadata.language) {
        updateData.language = metadata.language;
      }

      await Room.findByIdAndUpdate(room._id, updateData);

      console.log(`✅ Document state saved for room ${roomId} (${documentBuffer.length} bytes, reason: ${reason})`);
      
      // Emit save event for monitoring
      this.emitSaveEvent(roomId, {
        size: documentBuffer.length,
        reason,
        timestamp: new Date(),
        codeLength: codeContent.length
      });

      return true;
      
    } catch (error) {
      console.error(`❌ Error saving document state for room ${roomId}:`, error);
      return false;
    }
  }

  // Load Yjs document state from MongoDB
  async loadDocumentState(roomId) {
    try {
      console.log(`📂 Loading document state for room ${roomId}`);
      
      const room = await Room.findOne({
        $or: [{ roomId }, { joinCode: roomId }]
      });

      if (!room) {
        console.warn(`⚠️ Room ${roomId} not found for loading`);
        return null;
      }

      if (!room.yjsDocumentState) {
        console.log(`📝 No saved Yjs state for room ${roomId}, using fallback code`);
        return {
          hasYjsState: false,
          code: room.code || '',
          language: room.language || 'javascript'
        };
      }

      const documentState = new Uint8Array(room.yjsDocumentState);
      
      console.log(`✅ Loaded document state for room ${roomId} (${documentState.length} bytes)`);
      
      return {
        hasYjsState: true,
        documentState,
        code: room.code, // Fallback
        language: room.language,
        lastSaved: room.lastSaved,
        saveReason: room.saveReason
      };
      
    } catch (error) {
      console.error(`❌ Error loading document state for room ${roomId}:`, error);
      return null;
    }
  }

  // Apply loaded state to Yjs document
  async applyLoadedState(roomId, loadedState) {
    try {
      if (!loadedState) return false;

      const yjsDoc = roomService.getYjsDocument(roomId);
      if (!yjsDoc) {
        console.error(`❌ No Yjs document available for room ${roomId}`);
        return false;
      }

      if (loadedState.hasYjsState) {
        // Apply the saved Yjs state
        Y.applyUpdate(yjsDoc, loadedState.documentState);
        console.log(`🔄 Applied saved Yjs state to room ${roomId}`);
      } else {
        // Initialize with fallback code
        const sharedText = yjsDoc.getText('code');
        const sharedMetadata = yjsDoc.getMap('metadata');
        
        if (sharedText.length === 0 && loadedState.code) {
          sharedText.insert(0, loadedState.code);
        }
        
        if (loadedState.language) {
          sharedMetadata.set('language', loadedState.language);
        }
        
        sharedMetadata.set('lastLoaded', new Date().toISOString());
        
        console.log(`📝 Initialized room ${roomId} with fallback code`);
      }

      return true;
      
    } catch (error) {
      console.error(`❌ Error applying loaded state to room ${roomId}:`, error);
      return false;
    }
  }

  // Clean up room resources
  cleanupRoom(roomId) {
    this.cancelInactivityTimer(roomId);
    this.lastActivityTime.delete(roomId);
    this.roomClientCounts.delete(roomId);
    console.log(`🗑️ Cleaned up persistence tracking for room ${roomId}`);
  }

  // Force save for all active rooms (useful for server shutdown)
  async saveAllActiveRooms() {
    console.log(`💾 Force saving all active rooms...`);
    
    const savePromises = [];
    for (const [roomId, clientCount] of this.roomClientCounts.entries()) {
      if (clientCount > 0) {
        savePromises.push(this.saveDocumentState(roomId, 'server_shutdown'));
      }
    }
    
    const results = await Promise.allSettled(savePromises);
    const successful = results.filter(r => r.status === 'fulfilled').length;
    
    console.log(`💾 Saved ${successful}/${results.length} active rooms`);
    return successful;
  }

  // Get persistence statistics
  getStatistics() {
    return {
      activeRooms: this.roomClientCounts.size,
      activeTimers: this.inactivityTimers.size,
      totalClients: Array.from(this.roomClientCounts.values()).reduce((a, b) => a + b, 0),
      inactivityPeriod: this.INACTIVITY_PERIOD,
      enabled: this.isEnabled
    };
  }

  // Emit save event for monitoring (can be extended with EventEmitter)
  emitSaveEvent(roomId, data) {
    // Could emit to monitoring system or admin dashboard
    console.log(`📊 Save event - Room: ${roomId}, Size: ${data.size}B, Reason: ${data.reason}`);
  }

  // Manual save trigger (for API endpoints)
  async manualSave(roomId) {
    return await this.saveDocumentState(roomId, 'manual');
  }

  // Destroy service and cleanup
  async destroy() {
    console.log(`🛑 Shutting down Document Persistence Service...`);
    
    // Save all active rooms
    await this.saveAllActiveRooms();
    
    // Cancel all timers
    for (const timer of this.inactivityTimers.values()) {
      clearTimeout(timer);
    }
    
    // Clear all data
    this.inactivityTimers.clear();
    this.lastActivityTime.clear();
    this.roomClientCounts.clear();
    
    console.log(`✅ Document Persistence Service shut down complete`);
  }
}

module.exports = new DocumentPersistenceService();