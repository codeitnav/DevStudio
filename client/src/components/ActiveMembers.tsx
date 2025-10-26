"use client";

import React, { useState, useEffect } from "react";
import { WebsocketProvider } from "y-websocket";
import { User } from "@/lib/services/api";
import Avatar from "boring-avatars";
import { Users, PanelLeftClose, PanelRightClose } from "lucide-react";

interface AwarenessState {
  user: {
    name: string;
    email: string;
    color: string;
  };
}

interface ActiveMembersProps {
  provider: WebsocketProvider | null;
  currentUser: User | null;
  isCollapsed: boolean;
  onToggle: () => void;
}

const ActiveMembers: React.FC<ActiveMembersProps> = ({
  provider,
  currentUser,
  isCollapsed,
  onToggle,
}) => {
  const [activeUsers, setActiveUsers] = useState<AwarenessState["user"][]>([]);

  useEffect(() => {
    if (!provider) return;

    const updateUserList = () => {
      const states = Array.from(provider.awareness.getStates().values()) as AwarenessState[];
      const users = states
        .map((state) => state.user)
        .filter((user): user is AwarenessState["user"] => !!user);

      if (currentUser) {
        users.sort((a, b) => {
          if (a.name === currentUser.username) return -1;
          if (b.name === currentUser.username) return 1;
          return a.name.localeCompare(b.name);
        });
      }
      setActiveUsers(users);
    };

    provider.awareness.on("change", updateUserList);
    updateUserList();

    return () => {
      provider.awareness.off("change", updateUserList);
    };
  }, [provider, currentUser]);

  // Render only the expand icon when collapsed
  if (isCollapsed) {
    return (
      <div className="h-full bg-gray-900 flex items-center justify-center">
        <button
          onClick={onToggle}
          className="p-2 text-gray-400 hover:text-white hover:bg-gray-800 rounded-md"
          title="Expand Panel"
        >
          <PanelLeftClose size={20} />
        </button>
      </div>
    );
  }

  // Render the full panel when not collapsed
  return (
    <div className="h-full p-2 bg-gray-900 text-white flex flex-col">
      <div className="flex items-center justify-between p-2 text-gray-300 flex-shrink-0">
        <h2 className="flex items-center text-lg font-semibold truncate">
          <Users className="w-5 h-5 mr-2 text-gray-500 flex-shrink-0" />
          Active Members
        </h2>
        <button
          onClick={onToggle}
          className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded-md"
          title="Collapse Panel"
        >
          <PanelRightClose size={18} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto space-y-3 pr-2 mt-2">
        {activeUsers.map((user) => (
          <div key={user.email} className="flex items-center space-x-3 p-1 rounded-md">
            <Avatar
              size={32}
              name={user.name}
              variant="beam"
              colors={[user.color, "#145ca5", "#F0AB3D", "#C271B4", "#C20D90"]}
            />
            <span className="text-sm font-medium text-gray-200 truncate">
              {user.name}
              {user.name === currentUser?.username && " (You)"}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ActiveMembers;