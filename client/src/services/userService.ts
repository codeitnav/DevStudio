import api from "../config/api"

export interface UpdateUserProfileRequest {
  name?: string
  email?: string
  avatar?: string
  bio?: string
}

export interface ChangeUserPasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export const userService = {
  // Profile Management
  getUserProfile: async () => {
    const response = await api.get("/users/profile")
    return response.data
  },

  updateUserProfile: async (data: UpdateUserProfileRequest) => {
    const response = await api.put("/users/profile", data)
    return response.data
  },

  changePassword: async (data: ChangeUserPasswordRequest) => {
    const response = await api.put("/users/change-password", data)
    return response.data
  },

  // User Rooms
  getUserRooms: async () => {
    const response = await api.get("/users/rooms")
    return response.data
  },

  // Account Management
  deleteUserAccount: async () => {
    const response = await api.delete("/users/account")
    return response.data
  },
}
