export interface User {
  _id: string
  name: string
  email: string
  avatar?: string
  createdAt: string
}

export interface Room {
  _id: string
  name: string
  description?: string
  owner: User
  collaborators: User[]
  isPublic: boolean
  createdAt: string
  updatedAt: string
}

export interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  isLoading: boolean
}

export interface EditorState {
  content: string
  language: string
  theme: string
  fontSize: number
}

export interface CollaboratorCursor {
  userId: string
  userName: string
  position: {
    lineNumber: number
    column: number
  }
  color: string
}

export interface SocketEvents {
  "user-joined": (data: { userId: string; userName: string }) => void
  "user-left": (data: { userId: string }) => void
  "cursor-position": (data: CollaboratorCursor) => void
  "room-updated": (room: Room) => void
}
