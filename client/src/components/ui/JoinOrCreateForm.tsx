"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { nanoid } from 'nanoid'; 

const JoinOrCreateForm = () => {
  const [view, setView] = useState<"initial" | "join">("initial");
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleCreateRoom = () => {
    const newRoomId = nanoid(7); 
    router.push(`/editor/${newRoomId}`);
  };

  const handleJoinRoomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomId.trim()) {
      setError("Room ID cannot be empty.");
      return;
    }
    // In a real application, you would first verify if the room ID exists on your backend.
    // For this example, we will just navigate directly.
    // If the backend check fails, you would use setError("Wrong room id entered").
    router.push(`/editor/${roomId.trim()}`);
  };

  const renderInitialView = () => (
    <div>
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Start Collaborating</h2>
      <div className="space-y-4">
        <button
          onClick={handleCreateRoom}
          className="w-full bg-[#166EC1] text-white py-3 rounded-md hover:bg-[#145ca5] transition-colors text-lg font-semibold"
        >
          Create Room
        </button>
        <button
          onClick={() => setView("join")}
          className="w-full bg-gray-200 text-gray-800 py-3 rounded-md hover:bg-gray-300 transition-colors text-lg font-semibold"
        >
          Join Room
        </button>
      </div>
    </div>
  );

  const renderJoinView = () => (
    <div>
       <button onClick={() => setView("initial")} className="absolute top-4 left-4 text-gray-500 hover:text-gray-800">
          <ArrowLeft size={24} />
       </button>
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">Join a Room</h2>
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
        />
         {error && <p className="text-red-500 text-sm text-center">{error}</p>}
        <button
          type="submit"
          className="w-full bg-[#166EC1] text-white py-3 rounded-md hover:bg-[#145ca5] transition-colors text-lg font-semibold"
        >
          Enter
        </button>
      </form>
    </div>
  );

  return (
    <div className="relative">
      {view === "initial" ? renderInitialView() : renderJoinView()}
    </div>
  );
};

export default JoinOrCreateForm;