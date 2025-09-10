import { create } from "zustand"
import type { EditorState, CollaboratorCursor } from "../types"

interface EditorStore extends EditorState {
  collaborators: CollaboratorCursor[]
  isConnected: boolean
  roomId: string | null
  setContent: (content: string) => void
  setLanguage: (language: string) => void
  setTheme: (theme: string) => void
  setFontSize: (fontSize: number) => void
  addCollaborator: (collaborator: CollaboratorCursor) => void
  removeCollaborator: (userId: string) => void
  updateCollaboratorCursor: (userId: string, position: { lineNumber: number; column: number }) => void
  setConnected: (connected: boolean) => void
  setRoomId: (roomId: string | null) => void
  reset: () => void
}

export const useEditorStore = create<EditorStore>((set, get) => ({
  content: "",
  language: "javascript",
  theme: "vs-dark",
  fontSize: 14,
  collaborators: [],
  isConnected: false,
  roomId: null,

  setContent: (content: string) => set({ content }),

  setLanguage: (language: string) => set({ language }),

  setTheme: (theme: string) => set({ theme }),

  setFontSize: (fontSize: number) => set({ fontSize }),

  addCollaborator: (collaborator: CollaboratorCursor) => {
    const { collaborators } = get()
    const existing = collaborators.find((c) => c.userId === collaborator.userId)
    if (!existing) {
      set({ collaborators: [...collaborators, collaborator] })
    }
  },

  removeCollaborator: (userId: string) => {
    const { collaborators } = get()
    set({ collaborators: collaborators.filter((c) => c.userId !== userId) })
  },

  updateCollaboratorCursor: (userId: string, position: { lineNumber: number; column: number }) => {
    const { collaborators } = get()
    set({
      collaborators: collaborators.map((c) => (c.userId === userId ? { ...c, position } : c)),
    })
  },

  setConnected: (connected: boolean) => set({ isConnected: connected }),

  setRoomId: (roomId: string | null) => set({ roomId }),

  reset: () =>
    set({
      content: "",
      language: "javascript",
      theme: "vs-dark",
      fontSize: 14,
      collaborators: [],
      isConnected: false,
      roomId: null,
    }),
}))
