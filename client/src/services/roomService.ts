import api from "../config/api"

export interface CreateRoomRequest {
  roomName: string
  description?: string
  language?: string
  isPrivate?: boolean
  maxMembers?: number
  password?: string
}

export interface JoinRoomRequest {
  username?: string
  password?: string
}

export interface SaveRoomRequest {
  code: string
  language?: string
}

export interface UpdateRoomSettingsRequest {
  settings: {
    allowGuests?: boolean
    allowCodeDownload?: boolean
    autoSave?: boolean
    theme?: string
  }
}

export const roomService = {
  // Room Management
  createRoom: async (data: CreateRoomRequest) => {
    const response = await api.post("/room/create", data)
    return response.data
  },

  getRoom: async (roomId: string, password?: string) => {
    const params = password ? { password } : {}
    const response = await api.get(`/room/${roomId}`, { params })
    return response.data
  },

  joinRoom: async (roomId: string, data: JoinRoomRequest) => {
    const response = await api.post(`/room/${roomId}/join`, data)
    return response.data
  },

  leaveRoom: async (roomId: string, userId?: string) => {
    const response = await api.delete(`/room/${roomId}/leave`, {
      data: userId ? { userId } : {},
    })
    return response.data
  },

  deleteRoom: async (roomId: string) => {
    const response = await api.delete(`/room/${roomId}`)
    return response.data
  },

  // Content Management
  saveRoom: async (roomId: string, data: SaveRoomRequest) => {
    const response = await api.post(`/room/${roomId}/save`, data)
    return response.data
  },

  // Members and Collaboration
  getRoomMembers: async (roomId: string) => {
    const response = await api.get(`/room/${roomId}/members`)
    return response.data
  },

  getCollaborationInfo: async (roomId: string) => {
    const response = await api.get(`/room/${roomId}/collaboration`)
    return response.data
  },

  getDocumentState: async (roomId: string) => {
    const response = await api.get(`/room/${roomId}/document-state`)
    return response.data
  },

  // Settings
  updateRoomSettings: async (roomId: string, data: UpdateRoomSettingsRequest) => {
    const response = await api.put(`/room/${roomId}/settings`, data)
    return response.data
  },
}
