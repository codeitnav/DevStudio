import api from "../config/api"

export interface LoginRequest {
  email: string
  password: string
}

export interface SignupRequest {
  name: string
  email: string
  password: string
}

export interface ForgotPasswordRequest {
  email: string
}

export interface ResetPasswordRequest {
  password: string
  confirmPassword: string
}

export interface UpdateProfileRequest {
  name?: string
  email?: string
  avatar?: string
}

export interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  confirmPassword: string
}

export const authService = {
  // Authentication
  signup: async (data: SignupRequest) => {
    const response = await api.post("/auth/signup", data)
    return response.data
  },

  login: async (data: LoginRequest) => {
    const response = await api.post("/auth/login", data)
    return response.data
  },

  logout: async () => {
    const response = await api.post("/auth/logout")
    return response.data
  },

  logoutAllDevices: async () => {
    const response = await api.post("/auth/logout-all")
    return response.data
  },

  // Password Management
  forgotPassword: async (data: ForgotPasswordRequest) => {
    const response = await api.post("/auth/forgot-password", data)
    return response.data
  },

  resetPassword: async (token: string, data: ResetPasswordRequest) => {
    const response = await api.post(`/auth/reset-password/${token}`, data)
    return response.data
  },

  changePassword: async (data: ChangePasswordRequest) => {
    const response = await api.put("/auth/change-password", data)
    return response.data
  },

  // Profile Management
  getProfile: async () => {
    const response = await api.get("/auth/me")
    return response.data
  },

  updateProfile: async (data: UpdateProfileRequest) => {
    const response = await api.put("/auth/me", data)
    return response.data
  },
}
