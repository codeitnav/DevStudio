import { create } from "zustand"
import { persist } from "zustand/middleware"
import Cookies from "js-cookie"
import { authService } from "../services/authService"
import type { User, AuthState } from "../types"
import toast from "react-hot-toast"

interface AuthStore extends AuthState {
  login: (email: string, password: string) => Promise<void>
  register: (name: string, email: string, password: string) => Promise<void>
  logout: () => void
  checkAuth: () => Promise<void>
  updateUser: (user: Partial<User>) => void
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: true,

      login: async (email: string, password: string) => {
        try {
          const response = await authService.login({ email, password })
          const { user, token } = response.data

          Cookies.set("token", token, { expires: 7 })
          set({ user, token, isAuthenticated: true })
          toast.success("Login successful!")
        } catch (error: any) {
          const message = error.response?.data?.message || "Login failed"
          toast.error(message)
          throw error
        }
      },

      register: async (name: string, email: string, password: string) => {
        try {
          const response = await authService.signup({ name, email, password })
          const { user, token } = response.data

          Cookies.set("token", token, { expires: 7 })
          set({ user, token, isAuthenticated: true })
          toast.success("Registration successful!")
        } catch (error: any) {
          const message = error.response?.data?.message || "Registration failed"
          toast.error(message)
          throw error
        }
      },

      logout: () => {
        authService.logout().catch(() => {
          // Continue with client-side logout even if server call fails
        })

        Cookies.remove("token")
        set({ user: null, token: null, isAuthenticated: false })
        toast.success("Logged out successfully")
      },

      checkAuth: async () => {
        try {
          const token = Cookies.get("token")
          if (!token) {
            set({ isLoading: false })
            return
          }

          const response = await authService.getProfile()
          const user = response.data

          set({ user, token, isAuthenticated: true, isLoading: false })
        } catch (error) {
          Cookies.remove("token")
          set({ user: null, token: null, isAuthenticated: false, isLoading: false })
        }
      },

      updateUser: (userData: Partial<User>) => {
        const { user } = get()
        if (user) {
          set({ user: { ...user, ...userData } })
        }
      },
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

// Initialize auth check
useAuthStore.getState().checkAuth()
