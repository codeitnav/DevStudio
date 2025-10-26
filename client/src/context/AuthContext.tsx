"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import {
  getProfile,
  loginUser,
  signupUser,
  guestLogin,
  User,
  AuthResponse,
  UserCredentials,
  SignupData
} from "@/lib/services/api";
import { getToken } from "@/lib/auth"; 

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  error: string | null;
  login: (credentials: UserCredentials) => Promise<void>;
  signup: (userData: SignupData) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => getToken());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Handle successful authentication and persist session
  const handleAuthResponse = useCallback((response: AuthResponse) => {
    const { token, ...userData } = response;
    setUser(userData);
    setToken(token);
    localStorage.setItem("userToken", token);
    setError(null);
  }, []);

  // Restore user session from localStorage on initial load
  useEffect(() => {
    const loadUserFromToken = async () => {
      if (token) {
        try {
          const { data: userProfile } = await getProfile();
          setUser(userProfile);
        } catch (err) {
          setUser(null);
          setToken(null);
          localStorage.removeItem("userToken");
          console.error("Session restore failed:", err);
        }
      }
      setIsLoading(false);
    };
    loadUserFromToken();
  }, [token]);

  // Log in an existing user
  const login = useCallback(async (credentials: UserCredentials) => {
    try {
      const { data } = await loginUser(credentials);
      handleAuthResponse(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
      throw err;
    }
  }, [handleAuthResponse]);

  // Register a new user
  const signup = useCallback(async (userData: SignupData) => {
    try {
      const { data } = await signupUser(userData);
      handleAuthResponse(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Signup failed. Please try again.");
      throw err;
    }
  }, [handleAuthResponse]);

  // Log in as a guest user
  const loginAsGuest = useCallback(async () => {
    try {
      const { data } = await guestLogin();
      handleAuthResponse(data);
    } catch (err: any) {
      setError(err.response?.data?.message || "Could not create a guest session.");
      throw err;
    }
  }, [handleAuthResponse]);

  // Log out and clear session
  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("userToken");
  }, []);

  const value = {
    user,
    token,
    isLoading,
    error,
    login,
    signup,
    loginAsGuest,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to access authentication context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};