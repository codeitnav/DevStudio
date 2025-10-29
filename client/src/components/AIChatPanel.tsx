"use client";

import React, { useState, useRef, useEffect } from "react";
import { Send, Sparkles, Loader2, ServerCrash, User, Bot } from "lucide-react";
import { Text as YText } from "yjs";
import * as api from "@/lib/services/api"; // --- [FIXED] Changed to relative path
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Type Definitions ---
interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
}

interface AIChatPanelProps {
  currentFileYText: YText | null;
  isCollapsed: boolean;
  onToggle: () => void;
}

// --- Helper Components ---
const ChatMessage: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.sender === "user";
  return (
    <div className={`flex items-start space-x-3 mb-4 ${isUser ? "justify-end" : ""}`}>
      <div 
        className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? "bg-blue-600 text-blue-100" : "bg-gray-700 text-gray-300"
        }`}
      >
        {isUser ? <User size={18} /> : <Bot size={18} />}
      </div>
      <div 
        className={`p-3 rounded-lg max-w-xs md:max-w-md ${
          isUser ? "bg-blue-600 text-white" : "bg-gray-700 text-gray-200"
        }`}
      >
        <div className="prose prose-sm prose-invert prose-p:my-0 prose-pre:my-2 prose-pre:bg-gray-800 prose-code:text-white">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {message.text}
          </ReactMarkdown>
        </div>
      </div>
    </div>
  );
};

const LoadingIndicator = () => (
  <div className="flex items-start space-x-3 mb-4">
    <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-gray-700 text-gray-300">
      <Bot size={18} />
    </div>
    <div className="p-3 rounded-lg bg-gray-700 text-gray-200">
      <Loader2 className="animate-spin h-5 w-5" />
    </div>
  </div>
);

// --- Main Component ---
export const AIChatPanel: React.FC<AIChatPanelProps> = ({
  currentFileYText,
  isCollapsed,
  onToggle,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages, isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userQuery = input.trim();
    const codeContext = currentFileYText ? currentFileYText.toString() : "";

    // Add user message to state
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), sender: "user", text: userQuery },
    ]);
    setInput("");
    setIsLoading(true);
    setError(null);

    try {
      // 3. Data Fetching
      const response = await api.askAI({ query: userQuery, codeContext });
      const aiResponse = response.data.message;

      // Add AI response to state
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "-ai", sender: "ai", text: aiResponse },
      ]);
    } catch (err: any) {
      console.error("Failed to get AI response:", err);
      const errorMsg =
        err.response?.data?.message ||
        "An unexpected error occurred. Please try again.";
      setError(errorMsg);
      // Optional: Add error message to chat
      setMessages((prev) => [
        ...prev,
        { id: Date.now().toString() + "-err", sender: "ai", text: `Error: ${errorMsg}` },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isCollapsed) {
    return (
      <div 
        className="h-full bg-gray-900 text-white flex flex-col items-center p-2 cursor-pointer"
        onClick={onToggle}
        title="Expand AI Chat"
      >
        <Sparkles className="w-5 h-5 mt-2 text-gray-400 hover:text-blue-400" />
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900 text-white flex flex-col p-2">
      {/* Header */}
      <div 
        className="flex items-center justify-between mb-2 p-2 cursor-pointer"
        onClick={onToggle}
        title="Collapse AI Chat"
      >
        <h2 className="flex items-center text-lg font-semibold text-gray-300">
          <Sparkles className="w-5 h-5 mr-2 text-blue-400" />
          AI Assistant
        </h2>
        <span className="text-gray-500 hover:text-white">&mdash;</span>
      </div>

      {/* Message Display Area */}
      <div className="flex-grow overflow-y-auto pr-2 space-y-4 min-h-0">
        {messages.length === 0 && !isLoading && !error && (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500">
            <Bot size={32} className="mb-2" />
            <p>Ask me anything about your code!</p>
            <p className="text-xs mt-2">
              e.g., "Explain this function" or "How do I optimize this loop?"
            </p>
          </div>
        )}
        
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} />
        ))}

        {isLoading && <LoadingIndicator />}
        
        {error && !isLoading && (
          <div className="flex items-center space-x-3 p-3 rounded-lg bg-red-900 bg-opacity-30 text-red-300">
            <ServerCrash size={20} className="flex-shrink-0" />
            <p className="text-sm">{error}</p>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="flex-shrink-0 mt-2 p-2 border-t border-gray-700">
        <div className="flex items-center bg-gray-800 rounded-lg">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask AI..."
            className="flex-grow bg-transparent p-2 text-gray-200 placeholder-gray-500 focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="p-2 text-gray-400 hover:text-blue-400 disabled:text-gray-600 disabled:cursor-not-allowed"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? (
              <Loader2 className="animate-spin h-5 w-5" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </form>
    </div>
  );
};