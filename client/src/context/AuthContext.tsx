"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { getProfile, loginUser, signupUser } from "@/lib/services/api";
import { jwtDecode } from 'jwt-decode';

interface User {
  _id: string;
  username: string;
  email: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (credentials: any) => Promise<void>;
  signup: (userData: any) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  error: string | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadUserFromToken = async () => {
      const storedToken = localStorage.getItem("userToken");
      if (storedToken) {
        try {
          const decoded: { id: string, exp: number } = jwtDecode(storedToken);
          if (decoded.exp * 1000 > Date.now()) {
            setToken(storedToken);
            const response = await getProfile();
            setUser(response.data);
          } else {
            localStorage.removeItem("userToken");
          }
        } catch (err) {
          localStorage.removeItem("userToken");
          console.error("Failed to load user from token:", err);
        }
      }
      setIsLoading(false);
    };

    loadUserFromToken();
  }, []);

  const login = async (credentials: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await loginUser(credentials);
      setUser(response.data);
      setToken(response.data.token);
      localStorage.setItem("userToken", response.data.token);
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to login");
    } finally {
      setIsLoading(false);
    }
  };
  

  const signup = async (userData: any) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await signupUser(userData);
      setUser(response.data);
      setToken(response.data.token);
      localStorage.setItem("userToken", response.data.token);
    } catch (err: any) {
        setError(err.response?.data?.message || "Failed to sign up");
    } finally {
        setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("userToken");
  };

  const value = { user, token, login, signup, logout, isLoading, error };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};