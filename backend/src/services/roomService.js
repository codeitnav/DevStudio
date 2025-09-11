const Room = require('../models/Room');
const RoomMember = require('../models/RoomMember');
const User = require('../models/User');
const Y = require('yjs');
const documentPersistenceService = require('./documentPersistenceService');

class RoomService {
  constructor() {
    this.yjsDocuments = new Map(); // Cache for Yjs documents
  }

  // Basic Room CRUD Operations
  async createRoom(roomData, creatorId) {
    try {
      const room = new Room({
        name: roomData.name,
        description: roomData.description || '',
        language: roomData.language || 'javascript',
        isPublic: roomData.isPublic || false,
        creator: creatorId,
        members: [creatorId],
        collaborationEnabled: true,
        createdAt: new Date()
      });

      const savedRoom = await room.save();
      
      // Create room member entry for creator
      await this.addMemberToRoom(savedRoom._id, creatorId, 'owner');
      
      // Initialize Yjs document for collaboration
      this.initializeYjsDocument(savedRoom._id.toString());
      
      return await this.getRoomById(savedRoom._id);
    } catch (error) {
      throw new Error(`Failed to create room: ${error.message}`);
    }
  }

  async getRoomById(roomId) {
    try {
      const room = await Room.findById(roomId)
        .populate('creator', 'username email')
        .populate('members', 'username email')
        .lean();
      
      if (!room) {
        throw new Error('Room not found');
      }

      // Get member details with roles
      const memberDetails = await RoomMember.find({ room: roomId })
        .populate('user', 'username email')
        .lean();

      room.memberDetails = memberDetails;
      return room;
    } catch (error) {
      throw new Error(`Failed to get room: ${error.message}`);
    }
  }

  async getAllRooms(userId, filters = {}) {
    try {
      const query = {};
      
      // Apply filters
      if (filters.isPublic !== undefined) {
        query.isPublic = filters.isPublic;
      }
      
      if (filters.language) {
        query.language = filters.language;
      }

      // Get rooms where user is a member or public rooms
      const rooms = await Room.find({
        $or: [
          { members: userId },
          { isPublic: true, ...query }
        ]
      })
      .populate('creator', 'username email')
      .populate('members', 'username email')
      .sort({ updatedAt: -1 })
      .lean();

      return rooms;
    } catch (error) {
      throw new Error(`Failed to get rooms: ${error.message}`);
    }
  }

  async updateRoom(roomId, updateData, userId) {
    try {
      const room = await Room.findById(roomId);
      
      if (!room) {
        throw new Error('Room not found');
      }

      // Check if user has permission to update
      const memberRole = await this.getUserRoleInRoom(roomId, userId);
      if (!memberRole || !['owner', 'admin'].includes(memberRole)) {
        throw new Error('Insufficient permissions to update room');
      }

      const allowedUpdates = ['name', 'description', 'language', 'isPublic'];
      const updates = {};
      
      Object.keys(updateData).forEach(key => {
        if (allowedUpdates.includes(key)) {
          updates[key] = updateData[key];
        }
      });

      updates.updatedAt = new Date();

      const updatedRoom = await Room.findByIdAndUpdate(
        roomId, 
        updates, 
        { new: true, runValidators: true }
      )
      .populate('creator', 'username email')
      .populate('members', 'username email');

      return updatedRoom;
    } catch (error) {
      throw new Error(`Failed to update room: ${error.message}`);
    }
  }

  async deleteRoom(roomId, userId) {
    try {
      const room = await Room.findById(roomId);
      
      if (!room) {
        throw new Error('Room not found');
      }

      // Only room creator can delete the room
      if (room.creator.toString() !== userId.toString()) {
        throw new Error('Only room creator can delete the room');
      }

      // Clean up related data
      await RoomMember.deleteMany({ room: roomId });
      await Room.findByIdAndDelete(roomId);
      
      // Clean up Yjs document
      this.cleanupYjsDocument(roomId.toString());

      return { message: 'Room deleted successfully' };
    } catch (error) {
      throw new Error(`Failed to delete room: ${error.message}`);
    }
  }

  // Room Member Management
  async addMemberToRoom(roomId, userId, role = 'member') {
    try {
      // Check if user is already a member
      const existingMember = await RoomMember.findOne({
        room: roomId,
        user: userId
      });

      if (existingMember) {
        throw new Error('User is already a member of this room');
      }

      // Create room member entry
      const roomMember = new RoomMember({
        room: roomId,
        user: userId,
        role: role,
        joinedAt: new Date()
      });

      await roomMember.save();

      // Add user to room members array
      await Room.findByIdAndUpdate(
        roomId,
        { 
          $addToSet: { members: userId },
          $set: { updatedAt: new Date() }
        }
      );

      return await this.getRoomById(roomId);
    } catch (error) {
      throw new Error(`Failed to add member to room: ${error.message}`);
    }
  }

  async removeMemberFromRoom(roomId, userId, requestorId) {
    try {
      const room = await Room.findById(roomId);
      if (!room) {
        throw new Error('Room not found');
      }

      // Check permissions
      const requestorRole = await this.getUserRoleInRoom(roomId, requestorId);
      const targetRole = await this.getUserRoleInRoom(roomId, userId);

      // Owner can remove anyone, admin can remove members, users can remove themselves
      if (requestorId.toString() !== userId.toString()) {
        if (!requestorRole || !['owner', 'admin'].includes(requestorRole)) {
          throw new Error('Insufficient permissions');
        }
        if (targetRole === 'owner') {
          throw new Error('Cannot remove room owner');
        }
      }

      // Remove from room members and room member collection
      await Promise.all([
        Room.findByIdAndUpdate(roomId, { 
          $pull: { members: userId },
          $set: { updatedAt: new Date() }
        }),
        RoomMember.findOneAndDelete({ room: roomId, user: userId })
      ]);

      return { message: 'Member removed successfully' };
    } catch (error) {
      throw new Error(`Failed to remove member: ${error.message}`);
    }
  }

  async getUserRoleInRoom(roomId, userId) {
    try {
      const member = await RoomMember.findOne({
        room: roomId,
        user: userId
      });
      
      return member ? member.role : null;
    } catch (error) {
      return null;
    }
  }

  async getRoomMembers(roomId) {
    try {
      const members = await RoomMember.find({ room: roomId })
        .populate('user', 'username email')
        .sort({ joinedAt: -1 })
        .lean();

      return members;
    } catch (error) {
      throw new Error(`Failed to get room members: ${error.message}`);
    }
  }

  // Collaboration Features
  async joinRoom(roomId, userId) {
    try {
      const room = await Room.findById(roomId);
      
      if (!room) {
        throw new Error('Room not found');
      }

      // Check if room is public or user is already a member
      const isMember = room.members.includes(userId);
      
      if (!room.isPublic && !isMember) {
        throw new Error('Room is private and you are not a member');
      }

      if (!isMember) {
        await this.addMemberToRoom(roomId, userId, 'member');
      }

      // Return room with collaboration info
      const roomData = await this.getRoomById(roomId);
      roomData.collaborationUrl = `ws://localhost:${process.env.PORT || 3000}/yjs?room=${roomId}`;
      
      return roomData;
    } catch (error) {
      throw new Error(`Failed to join room: ${error.message}`);
    }
  }

  async getCollaborationInfo(roomId, userId) {
    try {
      const room = await Room.findById(roomId);
      
      if (!room) {
        throw new Error('Room not found');
      }

      // Check if user has access
      const hasAccess = room.members.includes(userId) || room.isPublic;
      if (!hasAccess) {
        throw new Error('Access denied');
      }

      const yjsDoc = this.getYjsDocument(roomId.toString());
      
      return {
        roomId: roomId,
        collaborationEnabled: room.collaborationEnabled,
        websocketUrl: `ws://localhost:${process.env.PORT || 3000}/yjs?room=${roomId}`,
        activeCollaborators: this.getActiveCollaborators(roomId.toString()),
        documentState: yjsDoc ? Y.encodeStateAsUpdate(yjsDoc) : null
      };
    } catch (error) {
      throw new Error(`Failed to get collaboration info: ${error.message}`);
    }
  }

  // Yjs Document Management
 async initializeYjsDocument(roomId) {
  if (!this.yjsDocuments.has(roomId)) {
    console.log(`🔧 Initializing Yjs document for room: ${roomId}`);
    
    const doc = new Y.Doc();
    
    try {
      // First, try to load existing document state from database
      const loadedState = await this.loadPersistedDocument(roomId);
      
      if (loadedState && loadedState.hasYjsState) {
        // Apply the persisted Yjs state to restore document
        Y.applyUpdate(doc, loadedState.documentState);
        console.log(`📂 Restored Yjs document state for room: ${roomId} (${loadedState.documentState.length} bytes)`);
      } else if (loadedState && loadedState.code) {
        // Initialize with fallback code from database
        const sharedText = doc.getText('code');
        const sharedMetadata = doc.getMap('metadata');
        
        if (sharedText.length === 0) {
          sharedText.insert(0, loadedState.code);
        }
        
        if (loadedState.language) {
          sharedMetadata.set('language', loadedState.language);
        }
        
        sharedMetadata.set('initializedFrom', 'database');
        sharedMetadata.set('initializedAt', new Date().toISOString());
        
        console.log(`📝 Initialized room ${roomId} with database code (${loadedState.code.length} chars)`);
      } else {
        // Initialize with default content for new rooms
        const sharedText = doc.getText('code');
        const sharedMetadata = doc.getMap('metadata');
        
        const defaultCode = `// Welcome to DevStudio!\n// Room: ${roomId}\n// Start collaborative coding...\n\n`;
        
        sharedText.insert(0, defaultCode);
        sharedMetadata.set('language', 'javascript');
        sharedMetadata.set('initializedFrom', 'default');
        sharedMetadata.set('initializedAt', new Date().toISOString());
        
        console.log(`🆕 Initialized new room ${roomId} with default content`);
      }
      
    } catch (error) {
      console.error(`❌ Error loading document state for room ${roomId}:`, error);
      
      // Fallback: Initialize with basic content
      const sharedText = doc.getText('code');
      const sharedMetadata = doc.getMap('metadata');
      
      sharedText.insert(0, `// Welcome to DevStudio!\n// Room: ${roomId}\n// Start coding...\n\n`);
      sharedMetadata.set('language', 'javascript');
      sharedMetadata.set('initializedFrom', 'fallback');
      sharedMetadata.set('initializedAt', new Date().toISOString());
      sharedMetadata.set('error', error.message);
    }
    
    // Initialize shared types for collaboration features
    const sharedText = doc.getText('code');
    const sharedMetadata = doc.getMap('metadata');
    const sharedCursors = doc.getMap('cursors');
    const sharedAwareness = doc.getMap('awareness');
    
    // Set up document update listener for persistence
    let updateTimeout = null;
    
    doc.on('update', (update, origin) => {
      console.log(`📝 Document update in room ${roomId} (origin: ${origin || 'unknown'})`);
      
      // Update last activity timestamp
      const roomDoc = this.yjsDocuments.get(roomId);
      if (roomDoc) {
        roomDoc.lastActivity = new Date();
        roomDoc.lastUpdateSize = update.length;
        roomDoc.totalUpdates = (roomDoc.totalUpdates || 0) + 1;
      }
      
      // Notify document persistence service
      if (typeof require !== 'undefined') {
        try {
          const documentPersistenceService = require('./documentPersistenceService');
          documentPersistenceService.updateActivity(roomId);
        } catch (err) {
          // Service might not be available, continue silently
        }
      }
      
      // Debounced persistence to database (immediate backup)
      clearTimeout(updateTimeout);
      updateTimeout = setTimeout(async () => {
        try {
          await this.persistDocumentUpdate(roomId, update);
        } catch (error) {
          console.error(`❌ Failed to persist update for room ${roomId}:`, error);
        }
      }, 1000); // 1 second debounce
    });
    
    // Set up awareness change listener
    sharedAwareness.observe((event) => {
      console.log(`👁️ Awareness changed in room ${roomId}`);
      const roomDoc = this.yjsDocuments.get(roomId);
      if (roomDoc) {
        roomDoc.lastActivity = new Date();
      }
    });
    
    // Create room document entry
    const roomDocument = {
      doc: doc,
      activeUsers: new Set(),
      lastActivity: new Date(),
      createdAt: new Date(),
      totalUpdates: 0,
      lastUpdateSize: 0,
      persistenceTimer: updateTimeout
    };
    
    this.yjsDocuments.set(roomId, roomDocument);
    
    console.log(`✅ Yjs document initialized and ready for room: ${roomId}`);
  }
  
  return this.yjsDocuments.get(roomId);
}


  getYjsDocument(roomId) {
    const roomDoc = this.yjsDocuments.get(roomId);
    return roomDoc ? roomDoc.doc : null;
  }

  addActiveCollaborator(roomId, userId) {
    const roomDoc = this.yjsDocuments.get(roomId);
    if (roomDoc) {
      roomDoc.activeUsers.add(userId);
      roomDoc.lastActivity = new Date();
    }
  }

  async removeActiveCollaborator(roomId, userId) {
  const roomDoc = this.yjsDocuments.get(roomId);
  if (roomDoc) {
    roomDoc.activeUsers.delete(userId);
    roomDoc.lastActivity = new Date();
    
    console.log(`👤 Removed collaborator ${userId} from room ${roomId} (${roomDoc.activeUsers.size} remaining)`);
    
    // Notify document persistence service
    if (typeof require !== 'undefined') {
      try {
        const documentPersistenceService = require('./documentPersistenceService');
        await documentPersistenceService.onClientLeave(roomId, userId);
      } catch (err) {
        console.warn(`⚠️ Document persistence service not available for room ${roomId}`);
      }
    }
    
    // Handle empty room cleanup
    if (roomDoc.activeUsers.size === 0) {
      console.log(`🔒 No active users left in room ${roomId}, scheduling cleanup`);
      
      // Immediate save when last user leaves
      try {
        await this.saveDocumentStateToDatabase(roomId, 'last_user_left');
      } catch (error) {
        console.error(`❌ Failed to save document on user leave for room ${roomId}:`, error);
      }
      
      // Schedule room cleanup after delay
      setTimeout(async () => {
        const currentDoc = this.yjsDocuments.get(roomId);
        if (currentDoc && currentDoc.activeUsers.size === 0) {
          console.log(`🗑️ Cleaning up empty room: ${roomId}`);
          
          // Final save before cleanup
          try {
            await this.saveDocumentStateToDatabase(roomId, 'cleanup');
          } catch (error) {
            console.error(`❌ Failed final save before cleanup for room ${roomId}:`, error);
          }
          
          // Cleanup the room
          this.cleanupYjsDocument(roomId);
        }
      }, 300000); // 5 minutes delay
    }
  } else {
    console.warn(`⚠️ Attempted to remove collaborator from non-existent room: ${roomId}`);
  }
}
  getActiveCollaborators(roomId) {
    const roomDoc = this.yjsDocuments.get(roomId);
    return roomDoc ? Array.from(roomDoc.activeUsers) : [];
  }

  async persistDocumentUpdate(roomId, update) {
    try {
      // Apply update to in-memory doc
      const ydoc = this.getYjsDocument(roomId) || (await this.initializeYjsDocument(roomId)).doc;
      if (ydoc) {
        Y.applyUpdate(ydoc, update);
      }

      // Save binary state snapshot to DB
      const state = Y.encodeStateAsUpdate(ydoc);
      await Room.findOneAndUpdate(
        { $or: [{ roomId }, { joinCode: roomId }] },
        { yjsDocumentState: Buffer.from(state), lastActivity: new Date() },
        { new: true }
      );
    } catch (error) {
      console.error(`Failed to persist document update for room ${roomId}:`, error);
    }
  }

  async loadPersistedDocument(roomId) {
  try {
    const room = await Room.findOne({
      $or: [{ roomId }, { joinCode: roomId }]
    });

    if (!room) {
      console.log(`📂 No room found for ${roomId} - will create new`);
      return null;
    }

    if (!room.yjsDocumentState) {
      console.log(`📝 No Yjs state for room ${roomId}, using fallback code`);
      return {
        hasYjsState: false,
        code: room.code || '',
        language: room.language || 'javascript',
        lastSaved: room.lastSaved,
        saveReason: room.saveReason
      };
    }

    const documentState = new Uint8Array(room.yjsDocumentState);
    
    console.log(`✅ Loaded persisted state for room ${roomId} (${documentState.length} bytes)`);
    
    return {
      hasYjsState: true,
      documentState,
      code: room.code, // Fallback
      language: room.language,
      lastSaved: room.lastSaved,
      saveReason: room.saveReason
    };
    
  } catch (error) {
    console.error(`❌ Error loading persisted document for room ${roomId}:`, error);
    return null;
  }
}


  cleanupYjsDocument(roomId) {
    this.yjsDocuments.delete(roomId);
    console.log(`Yjs document cleaned up for room: ${roomId}`);
  }

  // New helpers used by routes and sockets
  async applyDocumentUpdate(roomId, update, userId) {
    try {
      await this.persistDocumentUpdate(roomId, update);
      this.addActiveCollaborator(roomId, userId);
    } catch (error) {
      console.error(`applyDocumentUpdate error for room ${roomId}:`, error);
    }
  }

  async persistDocumentState(roomId, code, language) {
    try {
      const ydoc = this.getYjsDocument(roomId) || (await this.initializeYjsDocument(roomId)).doc;

      // Update shared types
      const text = ydoc.getText('code');
      const meta = ydoc.getMap('metadata');
      text.delete(0, text.length);
      text.insert(0, code || '');
      if (language) meta.set('language', language);

      // Save binary state
      const state = Y.encodeStateAsUpdate(ydoc);
      await Room.findOneAndUpdate(
        { $or: [{ roomId }, { joinCode: roomId }] },
        {
          code: code || '',
          language: language || 'javascript',
          yjsDocumentState: Buffer.from(state),
          lastActivity: new Date(),
        }
      );
    } catch (error) {
      console.error(`persistDocumentState error for room ${roomId}:`, error);
    }
  }

  async getDocumentState(roomId) {
    try {
      const ydoc = this.getYjsDocument(roomId) || (await this.initializeYjsDocument(roomId)).doc;
      const state = Y.encodeStateAsUpdate(ydoc);
      return state;
    } catch (error) {
      console.error(`getDocumentState error for room ${roomId}:`, error);
      return null;
    }
  }

  async updateAwareness(roomId, userId, awareness) {
    try {
      const ydoc = this.getYjsDocument(roomId) || (await this.initializeYjsDocument(roomId)).doc;
      const awarenessMap = ydoc.getMap('awareness');
      awarenessMap.set(String(userId), awareness || {});
    } catch (error) {
      console.error(`updateAwareness error for room ${roomId}:`, error);
    }
  }

  // Utility Methods
  async searchRooms(query, userId) {
    try {
      const searchRegex = new RegExp(query, 'i');
      
      const rooms = await Room.find({
        $and: [
          {
            $or: [
              { members: userId },
              { isPublic: true }
            ]
          },
          {
            $or: [
              { name: searchRegex },
              { description: searchRegex },
              { language: searchRegex }
            ]
          }
        ]
      })
      .populate('creator', 'username email')
      .populate('members', 'username email')
      .limit(20)
      .lean();

      return rooms;
    } catch (error) {
      throw new Error(`Failed to search rooms: ${error.message}`);
    }
  }

  async getRoomStats() {
    try {
      const totalRooms = await Room.countDocuments();
      const publicRooms = await Room.countDocuments({ isPublic: true });
      const activeRooms = this.yjsDocuments.size;
      
      const languageStats = await Room.aggregate([
        { $group: { _id: '$language', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);

      return {
        totalRooms,
        publicRooms,
        privateRooms: totalRooms - publicRooms,
        activeCollaborationRooms: activeRooms,
        languageDistribution: languageStats
      };
    } catch (error) {
      throw new Error(`Failed to get room stats: ${error.message}`);
    }
  }
}

module.exports = new RoomService();