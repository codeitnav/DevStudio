"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import * as api from "@/lib/services/api"; // Make sure this path is correct

const JoinOrCreateForm = () => {
  // The view can now be 'initial', 'join', or 'create'
  const [view, setView] = useState<"initial" | "join" | "create">("initial");
  
  // State for joining a room
  const [roomId, setRoomId] = useState("");
  
  // State for creating a room
  const [projectName, setProjectName] = useState("");

  // Shared loading and error state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const router = useRouter();

  // --- Handlers ---

  const handleJoinRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) {
      setError("Room ID cannot be empty.");
      return;
    }
    
    setIsLoading(true);
    setError("");
    
    try {
      // --- THIS IS THE FIX ---
      // Call the API to add the user to the room's member list
      await api.joinRoom(roomId.trim());
      
      // On success, navigate to the playground
      router.push(`/playground/${roomId.trim()}`);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to join room. Check the Room ID.');
      setIsLoading(false); // Only stop loading on error
    }
    // On success, we navigate away, so no need to set isLoading(false)
  };

  const handleCreateRoomSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectName.trim()) {
      setError("Project name cannot be empty.");
      return;
    }
    setIsLoading(true);
    setError("");
    try {
      // Call the API to create the room
      const response = await api.createRoom(projectName);
      const newRoom = response.data;
      
      // Redirect to the new playground on success
      router.push(`/playground/${newRoom.roomId}`);
      
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to create project. Please try again.');
      setIsLoading(false); // Only stop loading on error
    }
  };
  
  const changeView = (newView: "initial" | "join" | "create") => {
      setView(newView);
      // Clear all form states when changing views
      setError("");
      setRoomId("");
      setProjectName("");
      setIsLoading(false);
  }

  // --- Render Functions for each view ---

  const renderInitialView = () => (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Start Collaborating</h2>
      <div className="space-y-4">
        <button
          onClick={() => changeView("create")}
          className="w-full bg-[#166EC1] text-white py-3 rounded-md hover:bg-[#145ca5] transition-colors text-lg font-semibold"
        >
          Create Project
        </button>
        <button
          onClick={() => changeView("join")}
          className="w-full bg-gray-200 text-gray-800 py-3 rounded-md hover:bg-gray-300 transition-colors text-lg font-semibold"
        >
          Join Project
        </button>
      </div>
    </div>
  );
  
  const renderCreateView = () => (
    <div>
       <button onClick={() => changeView("initial")} className="absolute top-4 left-4 text-gray-500 hover:text-gray-800" disabled={isLoading}>
          <ArrowLeft size={24} />
       </button>
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">New Project</h2>
      <form onSubmit={handleCreateRoomSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Enter project name..."
          value={projectName}
          onChange={(e) => setProjectName(e.target.value)}
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#166EC1] text-lg"
          required
          autoFocus
          disabled={isLoading}
        />
         {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#166EC1] text-white py-3 rounded-md hover:bg-[#145ca5] transition-colors text-lg font-semibold flex items-center justify-center disabled:bg-gray-400"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : 'Create and Go'}
        </button>
      </form>
    </div>
  );

  const renderJoinView = () => (
    <div>
       <button onClick={() => changeView("initial")} className="absolute top-4 left-4 text-gray-500 hover:text-gray-800" disabled={isLoading}>
          <ArrowLeft size={24} />
       </button>
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Join a Project</h2>
      <form onSubmit={handleJoinRoomSubmit} className="space-y-4">
        <input
          type="text"
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => {
            setRoomId(e.target.value);
            setError("");
          }}
          className="w-full px-4 py-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#166EC1] text-lg"
          required
          autoFocus
          disabled={isLoading}
        />
         {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-[#166EC1] text-white py-3 rounded-md hover:bg-[#145ca5] transition-colors text-lg font-semibold flex items-center justify-center disabled:bg-gray-400"
        >
          {isLoading ? <Loader2 className="animate-spin" /> : 'Enter'}
        </button>
      </form>
    </div>
  );

  const renderContent = () => {
      switch(view) {
          case 'create':
              return renderCreateView();
          case 'join':
              return renderJoinView();
          case 'initial':
          default:
              return renderInitialView();
      }
  }

  return (
    <div className="relative p-2" style={{minWidth: '350px'}}>
      {renderContent()}
    </div>
  );
};

export default JoinOrCreateForm;

