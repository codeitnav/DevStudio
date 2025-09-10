import api from "../config/api"

export const adminService = {
  // System Overview
  getOverview: async () => {
    const response = await api.get("/admin/overview")
    return response.data
  },

  // Room Management
  getRooms: async () => {
    const response = await api.get("/admin/rooms")
    return response.data
  },

  getRoom: async (roomId: string) => {
    const response = await api.get(`/admin/rooms/${roomId}`)
    return response.data
  },

  deleteRoom: async (roomId: string) => {
    const response = await api.delete(`/admin/rooms/${roomId}`)
    return response.data
  },

  // User Management
  getUsers: async () => {
    const response = await api.get("/admin/users")
    return response.data
  },

  getUser: async (userId: string) => {
    const response = await api.get(`/admin/users/${userId}`)
    return response.data
  },

  banUser: async (userId: string) => {
    const response = await api.post(`/admin/users/${userId}/ban`)
    return response.data
  },

  unbanUser: async (userId: string) => {
    const response = await api.post(`/admin/users/${userId}/unban`)
    return response.data
  },
}
