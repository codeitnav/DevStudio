import api from "../config/api"

export interface CreateFileSystemItemRequest {
  type: "file" | "folder"
  name: string
  parentId?: string
  content?: string
  extension?: string
}

export interface UpdateFileContentRequest {
  content: string
}

export const fileSystemService = {
  // File/Folder Operations
  createItem: async (projectId: string, data: CreateFileSystemItemRequest) => {
    const response = await api.post(`/projects/${projectId}/files`, data)
    return response.data
  },

  deleteItem: async (projectId: string, fileId: string) => {
    const response = await api.delete(`/projects/${projectId}/files/${fileId}`)
    return response.data
  },

  renameItem: async (projectId: string, fileId: string, name: string) => {
    const response = await api.put(`/projects/${projectId}/files/${fileId}`, { name })
    return response.data
  },

  // File System Structure
  getFileSystemStructure: async (projectId: string) => {
    const response = await api.get(`/projects/${projectId}/files`)
    return response.data
  },

  // File Content
  getFileContent: async (projectId: string, fileId: string) => {
    const response = await api.get(`/projects/${projectId}/files/${fileId}/content`)
    return response.data
  },

  updateFileContent: async (projectId: string, fileId: string, data: UpdateFileContentRequest) => {
    const response = await api.put(`/projects/${projectId}/files/${fileId}/content`, data)
    return response.data
  },
}
