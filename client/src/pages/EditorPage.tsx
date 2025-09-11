"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useParams, useNavigate } from "react-router-dom"
import Editor from "@monaco-editor/react"
import { useEditorStore } from "../store/editorStore"
import { useAuthStore } from "../store/authStore"
import { socketManager } from "../config/socket"
import Button from "../components/ui/Button"
import LoadingSpinner from "../components/ui/LoadingSpinner"
import { ArrowLeft, Users, Settings, Download, Share, Save } from "lucide-react"
import toast from "react-hot-toast"
import * as Y from "yjs"
import { WebsocketProvider } from "y-websocket"
import { roomService } from "../services/roomService"

const EditorPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>()
  const navigate = useNavigate()
  const { user } = useAuthStore()
  const {
    content,
    language,
    theme,
    fontSize,
    collaborators,
    isConnected,
    setContent,
    setLanguage,
    setTheme,
    setFontSize,
    addCollaborator,
    removeCollaborator,
    updateCollaboratorCursor,
    setConnected,
    setRoomId,
    reset,
  } = useEditorStore()

  const [room, setRoom] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [yjsDoc, setYjsDoc] = useState<Y.Doc | null>(null)
  const [provider, setProvider] = useState<WebsocketProvider | null>(null)
  const [showSettings, setShowSettings] = useState(false)

  useEffect(() => {
    if (!roomId) {
      navigate("/dashboard")
      return
    }

    initializeRoom()
    setupCollaboration()

    return () => {
      cleanup()
    }
  }, [roomId])

  const initializeRoom = async () => {
    try {
      const response = await roomService.getRoom(roomId!)
      setRoom(response.room)
      setRoomId(roomId!)

      if (response.room.code) {
        setContent(response.room.code)
      }
      if (response.room.language) {
        setLanguage(response.room.language)
      }
    } catch (error) {
      toast.error("Failed to load room")
      navigate("/dashboard")
    } finally {
      setLoading(false)
    }
  }

  const setupCollaboration = async () => {
    // Initialize Yjs document
    const doc = new Y.Doc()
    setYjsDoc(doc)

    // Fetch collaboration info for correct websocket URL
    const collab = await roomService.getCollaborationInfo(roomId!)
    const wsUrl = collab?.collaboration?.websocketUrl || `ws://localhost:5000/yjs?room=${roomId}`

    // Setup WebSocket provider for Yjs
    const wsProvider = new WebsocketProvider(wsUrl.replace(/\?room=.*/,'/yjs'), roomId!, doc)
    setProvider(wsProvider)

    // Get shared text type
    const yText = doc.getText("code")

    // Setup Monaco editor binding
    yText.observe(() => {
      setContent(yText.toString())
    })

    // Setup Socket.IO for real-time features
    const socket = socketManager.connect()

    socket.emit("join-room", { roomId })

    socket.on("user-joined-room", (data: any) => {
      addCollaborator({
        userId: data.userId,
        userName: data.username,
        position: { lineNumber: 1, column: 1 },
        color: generateUserColor(String(data.userId)),
      })
    })

    socket.on("user-left-room", (data: any) => {
      removeCollaborator(String(data.userId))
    })

    socket.on("cursor-update", (data: any) => {
      updateCollaboratorCursor(String(data.userId), data.position)
    })

    wsProvider.on("status", (event: any) => {
      setConnected(event.status === "connected")
    })

    setConnected(true)
  }

  const cleanup = () => {
    if (provider) {
      provider.destroy()
    }
    if (yjsDoc) {
      yjsDoc.destroy()
    }
    socketManager.disconnect()
    reset()
  }

  const generateUserColor = (userId: string): string => {
    const colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FFEAA7", "#DDA0DD", "#98D8C8", "#F7DC6F"]
    const index = userId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0)
    return colors[index % colors.length]
  }

  const handleEditorChange = (value: string | undefined) => {
    if (value !== undefined && yjsDoc) {
      const yText = yjsDoc.getText("monaco")
      // Only update if content is different to avoid infinite loops
      if (yText.toString() !== value) {
        yText.delete(0, yText.length)
        yText.insert(0, value)
      }
    }
  }

  const handleCursorPositionChange = (position: any) => {
    const socket = socketManager.getSocket()
    if (socket && position) {
      socket.emit("cursor-update", {
        roomId,
        userId: user?._id,
        position: {
          lineNumber: position.lineNumber,
          column: position.column,
        },
      })
    }
  }

  const handleSave = async () => {
    try {
      await roomService.saveRoom(roomId!, {
        code: content,
        language: language,
      })
      toast.success("Document saved!")
    } catch (error) {
      toast.error("Failed to save document")
    }
  }

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href)
    toast.success("Room link copied to clipboard!")
  }

  const handleDownload = () => {
    const element = document.createElement("a")
    const file = new Blob([content], { type: "text/plain" })
    element.href = URL.createObjectURL(file)
    element.download = `${room?.name || "code"}.${getFileExtension(language)}`
    document.body.appendChild(element)
    element.click()
    document.body.removeChild(element)
  }

  const getFileExtension = (lang: string): string => {
    const extensions: Record<string, string> = {
      javascript: "js",
      typescript: "ts",
      python: "py",
      java: "java",
      cpp: "cpp",
      html: "html",
      css: "css",
      json: "json",
    }
    return extensions[lang] || "txt"
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col bg-gray-900">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              icon={ArrowLeft}
              onClick={() => navigate("/dashboard")}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              Back
            </Button>

            <div>
              <h1 className="text-lg font-medium text-white">{room?.name}</h1>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
                <span>{isConnected ? "Connected" : "Disconnected"}</span>
                <span>•</span>
                <div className="flex items-center">
                  <Users className="w-4 h-4 mr-1" />
                  {collaborators.length + 1} online
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              icon={Save}
              onClick={handleSave}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              Save
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={Download}
              onClick={handleDownload}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              Download
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={Share}
              onClick={handleShare}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              Share
            </Button>

            <Button
              variant="ghost"
              size="sm"
              icon={Settings}
              onClick={() => setShowSettings(!showSettings)}
              className="text-gray-300 hover:text-white hover:bg-gray-700"
            >
              Settings
            </Button>
          </div>
        </div>
      </header>

      {/* Settings Panel */}
      {showSettings && (
        <div className="bg-gray-800 border-b border-gray-700 px-4 py-3">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">Language:</label>
              <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
              >
                <option value="javascript">JavaScript</option>
                <option value="typescript">TypeScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="html">HTML</option>
                <option value="css">CSS</option>
                <option value="json">JSON</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">Theme:</label>
              <select
                value={theme}
                onChange={(e) => setTheme(e.target.value)}
                className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
              >
                <option value="vs-dark">Dark</option>
                <option value="light">Light</option>
                <option value="hc-black">High Contrast</option>
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <label className="text-sm text-gray-300">Font Size:</label>
              <select
                value={fontSize}
                onChange={(e) => setFontSize(Number(e.target.value))}
                className="bg-gray-700 text-white text-sm rounded px-2 py-1 border border-gray-600"
              >
                <option value={12}>12px</option>
                <option value={14}>14px</option>
                <option value={16}>16px</option>
                <option value={18}>18px</option>
                <option value={20}>20px</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 relative">
        <Editor
          height="100%"
          language={language}
          theme={theme}
          value={content}
          onChange={handleEditorChange}
          onMount={(editor) => {
            // Setup cursor position tracking
            editor.onDidChangeCursorPosition((e) => {
              handleCursorPositionChange(e.position)
            })
          }}
          options={{
            fontSize,
            minimap: { enabled: true },
            wordWrap: "on",
            automaticLayout: true,
            scrollBeyondLastLine: false,
            renderWhitespace: "selection",
            selectOnLineNumbers: true,
            roundedSelection: false,
            readOnly: false,
            cursorStyle: "line",
          }}
        />

        {/* Collaborator Cursors */}
        {collaborators.map((collaborator) => (
          <div
            key={collaborator.userId}
            className="absolute pointer-events-none z-10"
            style={{
              // Position would be calculated based on Monaco editor coordinates
              // This is a simplified version
              top: `${collaborator.position.lineNumber * 18}px`,
              left: `${collaborator.position.column * 7}px`,
            }}
          >
            <div className="w-0.5 h-5" style={{ backgroundColor: collaborator.color }} />
            <div
              className="text-xs text-white px-1 py-0.5 rounded mt-1 whitespace-nowrap"
              style={{ backgroundColor: collaborator.color }}
            >
              {collaborator.userName}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default EditorPage
