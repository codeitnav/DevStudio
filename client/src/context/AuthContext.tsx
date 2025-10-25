"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
// Removed API/JWT imports, as we are no longer authenticating
// import { getProfile, loginUser, signupUser } from "@/lib/services/api";
// import { jwtDecode } from 'jwt-decode';

// Simplified User interface
interface User {
  _id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  // Removed login, signup, logout, token, error
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Helper to generate a random user ID
const guestId = () => `guest_${Math.random().toString(36).substr(2, 9)}`;

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // FIX: Instead of loading from token, create a simple guest user
    // This user object is only for Yjs Awareness (e.g., cursor name)
    const guestUser: User = {
      _id: guestId(),
      username: `Guest ${guestId().substring(6, 10)}`,
      email: "guest@example.com"
    };
    
    setUser(guestUser);
    setIsLoading(false);
    
    // Removed all token loading logic
  }, []);

  // Removed login, signup, and logout functions

  const value = { user, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
