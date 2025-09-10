import api from "../config/api"

export interface InitializeGuestRequest {
  username?: string
  sessionData?: any
}

export interface JoinRoomAsGuestRequest {
  roomId: string
  username: string
  password?: string
}

export interface ConvertGuestToUserRequest {
  name: string
  email: string
  password: string
}

export const guestService = {
  // Guest Session Management
  initializeGuestSession: async (data: InitializeGuestRequest) => {
    const response = await api.post("/guest/initialize", data)
    return response.data
  },

  validateGuestSession: async (guestSessionId: string) => {
    const response = await api.post("/guest/validate", { guestSessionId })
    return response.data
  },

  getGuestSessionInfo: async (guestSessionId: string) => {
    const response = await api.get(`/guest/session/${guestSessionId}`)
    return response.data
  },

  // Room Operations
  joinRoomAsGuest: async (data: JoinRoomAsGuestRequest) => {
    const response = await api.post("/guest/join-room", data)
    return response.data
  },

  // Account Conversion
  convertGuestToUser: async (data: ConvertGuestToUserRequest) => {
    const response = await api.post("/guest/convert-to-user", data)
    return response.data
  },
}
