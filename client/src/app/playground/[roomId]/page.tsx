"use client"

import type React from "react"
import { useState, useEffect, useMemo, useRef } from "react"
import { useParams } from "next/navigation"
import { Panel, PanelGroup, PanelResizeHandle, type ImperativePanelHandle } from "react-resizable-panels"
import * as Y from "yjs"
import type { Text as YText } from "yjs"
import { WebsocketProvider } from "y-websocket"
import { Folder, FileText, Loader2, GripVertical, LayoutDashboard, Share2 } from "lucide-react"
import Link from "next/link"

import FileExplorer from "@/components/FileExplorer"
import { CodeEditor } from "@/components/CodeEditor"
import ActiveMembers from "@/components/ActiveMembers"
import { AIChatPanel } from "@/components/AIChatPanel"
import { useYjs, type SharedFileSystemMap } from "@/hooks/useYjs" // [MOD] Import SharedFileSystemMap
import { useAuth } from "@/context/AuthContext"
import { getToken } from "@/lib/auth"
import * as api from "@/lib/services/api"
import { CODE_SNIPPETS, LANGUAGE_MAPPING } from "@/constants"

export const getFileRoomName = (roomId: string): string => `files-${roomId}`
export const getFileDocName = (fileContentId: string): string => `file-${fileContentId}`

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:5000"

const LoadingSpinner = () => (
  <div className="flex h-screen w-full items-center justify-center bg-gray-900 text-white">
    <Loader2 className="animate-spin h-6 w-6 text-blue-400" />
    <p className="ml-4 text-sm sm:text-lg">Connecting to workspace...</p>
  </div>
)

const ProjectHeader: React.FC<{
  projectName: string
  roomId: string
  isLoading: boolean
}> = ({ projectName, roomId, isLoading }) => {
  const [isCopied, setIsCopied] = useState(false)

  const handleShare = () => {
    navigator.clipboard.writeText(roomId).then(
      () => {
        setIsCopied(true)
        setTimeout(() => setIsCopied(false), 2000)
      },
      (err) => {
        console.error("Failed to copy room ID: ", err)
      },
    )
  }

  return (
    <div className="flex-shrink-0 bg-gray-900 text-white p-2 sm:p-3 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-gray-700">
      <div className="flex items-center min-w-0 w-full sm:w-auto">
        <Link href="/dashboard" passHref>
          <span
            className="p-2 rounded-md hover:bg-gray-700 transition-colors cursor-pointer flex-shrink-0"
            title="Back to Dashboard"
          >
            <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
          </span>
        </Link>
        <span className="text-gray-600 mx-1 sm:mx-2">/</span>
        {isLoading ? (
          <div className="h-5 w-32 sm:w-48 bg-gray-700 rounded-md animate-pulse"></div>
        ) : (
          <h1 className="text-base sm:text-lg font-semibold text-gray-200 truncate" title={projectName}>
            {projectName}
          </h1>
        )}
      </div>
      <button
        onClick={handleShare}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded-md text-xs sm:text-sm flex items-center transition-all flex-shrink-0"
        title="Copy Room ID to share"
      >
        <Share2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1" />
        <span className="hidden sm:inline">{isCopied ? "Copied!" : "Share"}</span>
        <span className="sm:hidden">{isCopied ? "✓" : "Share"}</span>
      </button>
    </div>
  )
}

export default function PlaygroundPage() {
  const params = useParams()
  const roomId = params.roomId as string
  const { user } = useAuth()

  const [selectedFileId, setSelectedFileId] = useState<string | null>(null)
  const [selectedFileContentId, setSelectedFileContentId] = useState<string | null>(null)
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null)

  const [fileProvider, setFileProvider] = useState<WebsocketProvider | null>(null)
  const [fileYText, setFileYText] = useState<YText | null>(null)

  const [isMobile, setIsMobile] = useState(false)
  const [isMembersPanelCollapsed, setIsMembersPanelCollapsed] = useState(true)
  const [isAIChatPanelCollapsed, setIsAIChatPanelCollapsed] = useState(true)
  const [isFileExplorerCollapsed, setIsFileExplorerCollapsed] = useState(false)

  const membersPanelRef = useRef<ImperativePanelHandle>(null)
  const aiChatPanelRef = useRef<ImperativePanelHandle>(null)
  const fileExplorerPanelRef = useRef<ImperativePanelHandle>(null)
  const rightPanelGroupRef = useRef<ImperativePanelHandle>(null)

  const [projectName, setProjectName] = useState("")
  const [isLoadingProject, setIsLoadingProject] = useState(true)

  const fileRoomName = useMemo(() => getFileRoomName(roomId), [roomId])

  const {
    ydoc: fileSystemDoc,
    provider: fileSystemProvider,
    yNodeMap,
    connectionStatus: fileSystemStatus,
  } = useYjs(fileRoomName, user || null, roomId)

  useEffect(() => {
    const checkMobile = () => {
      const isMobileView = window.innerWidth < 768
      setIsMobile(isMobileView)
      if (isMobileView) {
        setIsFileExplorerCollapsed(true)
        setIsMembersPanelCollapsed(true)
        setIsAIChatPanelCollapsed(true)
      }
    }

    checkMobile()
    window.addEventListener("resize", checkMobile)
    return () => window.removeEventListener("resize", checkMobile)
  }, [])

  useEffect(() => {
    if (roomId && user) {
      const fetchProjectName = async () => {
        try {
          setIsLoadingProject(true)
          const response = await api.getRoom(roomId)
          setProjectName(response.data.name)
        } catch (error) {
          console.error("Failed to fetch room details:", error)
          setProjectName("Untitled Project")
        } finally {
          setIsLoadingProject(false)
        }
      }
      fetchProjectName()
    }
  }, [roomId, user])

  useEffect(() => {
    if (fileProvider) {
      fileProvider.disconnect()
      fileProvider.doc.destroy()
      setFileProvider(null)
      setFileYText(null)
    }

    if (selectedFileContentId && user && selectedFileName) {
      const fileDocName = getFileDocName(selectedFileContentId)
      const fileDoc = new Y.Doc()
      const token = getToken()
      const params = { token: token || "", roomId }
      const newProvider = new WebsocketProvider(WS_URL, fileDocName, fileDoc, {
        params,
      })

      const newYText = fileDoc.getText("file-content")

      const handleSync = (isSynced: boolean) => {
        if (isSynced && newYText.length === 0) {
          const ext = "." + selectedFileName.split(".").pop()
          const language = (LANGUAGE_MAPPING as Record<string, string>)[ext] || "javascript"
          const snippet = CODE_SNIPPETS[language as keyof typeof CODE_SNIPPETS]
          if (snippet) {
            fileDoc.transact(() => {
              newYText.insert(0, snippet)
            })
          }
        }
        newProvider.off("sync", handleSync)
      }

      newProvider.on("sync", handleSync)
      setFileProvider(newProvider)
      setFileYText(newYText)
    }

    return () => {
      if (fileProvider) {
        fileProvider.disconnect()
        fileProvider.doc.destroy()
      }
    }
  }, [selectedFileContentId, selectedFileName, user, roomId])

  const handleFileSelect = (fileId: string, fileContentId: string, fileName: string) => {
    setSelectedFileId(fileId)
    setSelectedFileContentId(fileContentId)
    setSelectedFileName(fileName)
    if (isMobile) {
      setIsFileExplorerCollapsed(true)
    }
  }

  const toggleMembersPanel = () => {
    const panel = membersPanelRef.current
    if (panel) {
      panel.isCollapsed() ? panel.expand() : panel.collapse()
    }
  }

  const toggleAIChatPanel = () => {
    const panel = aiChatPanelRef.current
    if (panel) {
      panel.isCollapsed() ? panel.expand() : panel.collapse()
    }
  }

  if (fileSystemStatus !== "connected" || !yNodeMap || isLoadingProject) {
    return <LoadingSpinner />
  }

  const isHorizontalLayout = !isMobile

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-800 flex flex-col">
      <ProjectHeader projectName={projectName} roomId={roomId} isLoading={isLoadingProject} />
      <PanelGroup direction={isHorizontalLayout ? "horizontal" : "vertical"} className="flex-grow min-h-0">
        {/* File Explorer Panel */}
        <Panel
          ref={fileExplorerPanelRef}
          defaultSize={isHorizontalLayout ? 15 : 20}
          minSize={15}
          collapsible={true}
          collapsedSize={isMobile ? 0 : 4}
          onCollapse={() => setIsFileExplorerCollapsed(true)}
          onExpand={() => setIsFileExplorerCollapsed(false)}
          className="min-w-[150px] md:min-w-[200px]"
        >
          <div className="h-full p-2 bg-gray-900 text-white flex flex-col">
            <h2 className="flex items-center text-xs sm:text-lg font-semibold mb-2 p-2 text-gray-300 flex-shrink-0">
              <Folder className="w-3 h-3 sm:w-5 sm:h-5 mr-2 text-gray-500" />
              <span className="hidden sm:inline">Files</span>
            </h2>
            <FileExplorer
              yNodeMap={yNodeMap}
              ydoc={fileSystemDoc!}
              provider={fileSystemProvider}
              onFileSelect={handleFileSelect}
              selectedFileId={selectedFileId}
            />
          </div>
        </Panel>

        <PanelResizeHandle className="flex w-2 items-center justify-center bg-gray-800 hover:bg-blue-600 transition-colors data-[resizing]:bg-blue-600 hidden md:flex">
          <GripVertical className="w-2.5 h-8 text-gray-500" />
        </PanelResizeHandle>

        {/* Code Editor Panel */}
        <Panel defaultSize={isHorizontalLayout ? 65 : 60} minSize={30}>
          {selectedFileId && fileYText && fileProvider && selectedFileName ? (
            <CodeEditor
              yText={fileYText}
              provider={fileProvider}
              fileName={selectedFileName}
              roomId={roomId}
              yNodeMap={yNodeMap}
              selectedFileId={selectedFileId}
              fileContentId={selectedFileContentId}
              onFileSelect={handleFileSelect}
            />
          ) : (
            <div className="flex h-full flex-col items-center justify-center bg-gray-900 text-gray-600 p-4">
              <FileText className="w-12 h-12 sm:w-16 sm:h-16 mb-4" />
              <p className="text-sm sm:text-lg text-gray-500 text-center">Select a file to start editing.</p>
            </div>
          )}
        </Panel>

        <PanelResizeHandle className="flex w-2 items-center justify-center bg-gray-800 hover:bg-blue-600 transition-colors data-[resizing]:bg-blue-600 hidden md:flex">
          <GripVertical className="w-2.5 h-8 text-gray-500" />
        </PanelResizeHandle>

        <Panel
          ref={rightPanelGroupRef}
          defaultSize={isHorizontalLayout ? 20 : 20}
          minSize={15}
          collapsible={true}
          collapsedSize={isMobile ? 0 : 4}
          className="min-w-[60px]"
        >
          <PanelGroup direction="vertical">
            {/* Active Members Panel */}
            <Panel
              ref={membersPanelRef}
              defaultSize={50}
              minSize={20}
              collapsible={true}
              collapsedSize={4}
              onCollapse={() => setIsMembersPanelCollapsed(true)}
              onExpand={() => setIsMembersPanelCollapsed(false)}
            >
              <ActiveMembers
                provider={fileSystemProvider}
                currentUser={user}
                isCollapsed={isMembersPanelCollapsed}
                onToggle={toggleMembersPanel}
              />
            </Panel>

            <PanelResizeHandle className="flex h-2 items-center justify-center bg-gray-800 hover:bg-blue-600 transition-colors data-[resizing]:bg-blue-600">
              <GripVertical className="w-8 h-2.5 text-gray-500" />
            </PanelResizeHandle>

            {/* AI Chat Panel */}
            <Panel
              ref={aiChatPanelRef}
              defaultSize={50}
              minSize={20}
              collapsible={true}
              collapsedSize={4}
              onCollapse={() => setIsAIChatPanelCollapsed(true)}
              onExpand={() => setIsAIChatPanelCollapsed(false)}
            >
              <AIChatPanel
                currentFileYText={fileYText}
                isCollapsed={isAIChatPanelCollapsed}
                onToggle={toggleAIChatPanel}
              />
            </Panel>
          </PanelGroup>
        </Panel>
      </PanelGroup>
    </div>
  )
}