"use client";

import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import {
  AuthUser,
  UserRole,
  loginApi,
  registerApi,
  fetchCurrentUser,
} from "./api";

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isUser: boolean;
  canManageRoles: boolean;
  login: (email: string, pass: string) => Promise<{ success: boolean; user: AuthUser; message?: string }>;
  register: (name: string, email: string, pass: string) => Promise<{ success: boolean; user: AuthUser; message?: string }>;
  logout: () => void;
  updateUser: (user: AuthUser) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const USER_STORAGE_KEY = "bgs_cloudpos_auth_user";
const TOKEN_STORAGE_KEY = "bgs_cloudpos_auth_token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize from localStorage
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
      const storedUser = localStorage.getItem(USER_STORAGE_KEY);

      if (storedToken && storedUser) {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
        setToken(storedToken);

        // Fetch fresh profile from backend
        fetchCurrentUser(storedToken)
          .then((res) => {
            if (res.success && res.user) {
              setUser(res.user);
              localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
            }
          })
          .catch(() => {
            // Keep local cache if offline
          });
      }
    } catch (e) {
      console.warn("Failed to restore auth session:", e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await loginApi({ email, password: pass });
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
      localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
      localStorage.setItem("owner-logged-in", "true");
      return { success: true, user: res.user, message: res.message };
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (name: string, email: string, pass: string) => {
    setIsLoading(true);
    try {
      const res = await registerApi({ name, email, password: pass });
      setUser(res.user);
      setToken(res.token);
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
      localStorage.setItem(TOKEN_STORAGE_KEY, res.token);
      localStorage.setItem("owner-logged-in", "true");
      return { success: true, user: res.user, message: res.message };
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem(USER_STORAGE_KEY);
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem("owner-logged-in");
  };

  const updateUser = (updated: AuthUser) => {
    setUser(updated);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updated));
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await fetchCurrentUser(token);
      if (res.success && res.user) {
        setUser(res.user);
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(res.user));
      }
    } catch (e) {
      console.warn("Error refreshing user profile:", e);
    }
  };

  const isSuperAdmin = user?.role === "super_admin";
  const isAdmin = user?.role === "admin";
  const isUser = user?.role === "user";
  const canManageRoles = isSuperAdmin || isAdmin;

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isLoggedIn: Boolean(user && token),
        isSuperAdmin,
        isAdmin,
        isUser,
        canManageRoles,
        login,
        register,
        logout,
        updateUser,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
