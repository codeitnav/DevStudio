"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Send, Sparkles, Loader2, ServerCrash, User, Bot } from "lucide-react"
import type { Text as YText } from "yjs"
import * as api from "@/lib/services/api"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"

interface Message {
  id: string
  sender: "user" | "ai"
  text: string
}

interface AIChatPanelProps {
  currentFileYText: YText | null
  isCollapsed: boolean
  onToggle: () => void
}

const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.sender === "user"
  return (
    <div className={`flex items-start space-x-2 mb-3 sm:mb-4 text-xs sm:text-sm ${isUser ? "justify-end" : ""}`}>
      <div
        className={`flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-blue-600 text-blue-100" : "bg-gray-700 text-gray-300"
        }`}
      >
        {isUser ? <User size={14} className="sm:w-5 sm:h-5" /> : <Bot size={14} className="sm:w-5 sm:h-5" />}
      </div>
      <div
        className={`p-2 sm:p-3 rounded-lg max-w-xs ${isUser ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"}`}
      >
        <div className="prose prose-sm prose-invert prose-p:my-0 prose-pre:my-1 prose-pre:bg-gray-800 prose-code:text-white text-xs sm:text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{message.text}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}

const LoadingIndicator = () => (
  <div className="flex items-start space-x-2 mb-4">
    <div className="flex-shrink-0 w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center bg-gray-700 text-gray-300">
      <Bot size={14} className="sm:w-5 sm:h-5" />
    </div>
    <div className="p-2 sm:p-3 rounded-lg bg-gray-700 text-gray-200">
      <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
    </div>
  </div>
)

export const AIChatPanel: React.FC<AIChatPanelProps> = ({ currentFileYText, isCollapsed, onToggle }) => {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(scrollToBottom, [messages, isLoading])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userQuery = input.trim()
    const codeContext = currentFileYText ? currentFileYText.toString() : ""

    setMessages((prev) => [...prev, { id: Date.now().toString(), sender: "user", text: userQuery }])
    setInput("")
    setIsLoading(true)
    setError(null)

    try {
      const response = await api.askAI({ query: userQuery, codeContext })
      const aiResponse = response.data.message

      setMessages((prev) => [...prev, { id: Date.now().toString() + "-ai", sender: "ai", text: aiResponse }])
    } catch (err: any) {
      console.error("Failed to get AI response:", err)
      const errorMsg = err.response?.data?.message || "An unexpected error occurred. Please try again."
      setError(errorMsg)
      setMessages((prev) => [...prev, { id: Date.now().toString() + "-err", sender: "ai", text: `Error: ${errorMsg}` }])
    } finally {
      setIsLoading(false)
    }
  }

  if (isCollapsed) {
    return (
      <div
        className="h-full bg-gray-900 text-white flex flex-col items-center p-2 cursor-pointer hover:bg-gray-800 transition-colors"
        onClick={onToggle}
        title="Expand AI Chat"
      >
        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mt-2 text-gray-400 hover:text-blue-400" />
      </div>
    )
  }

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col p-2 sm:p-3">
      {/* Header */}
      <div
        className="flex items-center justify-between mb-2 p-2 cursor-pointer hover:bg-gray-800 rounded transition-colors"
        onClick={onToggle}
        title="Collapse AI Chat"
      >
        <h2 className="flex items-center text-sm sm:text-lg font-semibold text-gray-300 min-w-0">
          <Sparkles className="w-3.5 h-3.5 sm:w-5 sm:h-5 mr-1 sm:mr-2 text-blue-400 flex-shrink-0" />
          <span className="hidden sm:inline">AI Assistant</span>
          <span className="sm:hidden">AI</span>
        </h2>
        <span className="text-gray-500 hover:text-white text-xs">−</span>
      </div>

      {/* Message Display Area */}
      <div className="flex-grow overflow-y-auto pr-1 sm:pr-2 space-y-2 sm:space-y-4 min-h-0">
        {messages.length === 0 && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 text-xs sm:text-sm px-2">
            <Bot size={24} className="mb-2" />
            <p>Ask about your code!</p>
          </div>
        )}

        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && <LoadingIndicator />}

        {error && !isLoading && (
          <div className="flex items-start space-x-2 p-2 sm:p-3 rounded-lg bg-red-900 bg-opacity-30 text-red-300 text-xs sm:text-sm">
            <ServerCrash size={16} className="flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 mt-2 p-2 border-t border-gray-700">
        <div className="flex items-center bg-gray-800 rounded-lg gap-1">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask..."
            className="flex-grow bg-transparent p-1.5 sm:p-2 text-xs sm:text-sm text-gray-200 placeholder-gray-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="p-1.5 sm:p-2 text-gray-400 hover:text-blue-400 disabled:text-gray-600 disabled:cursor-not-allowed flex-shrink-0"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-4 w-4 sm:h-5 sm:w-5" />
            ) : (
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  )
}