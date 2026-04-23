"use client";

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { loginApi, logoutApi, meApi, registerApi } from '@/lib/api/auth';
import { AuthUser, LoginRequest, RegisterRequest } from '@/lib/api/types';

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  register: (payload: RegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshSession: () => Promise<void>;
  updateUser: (updated: AuthUser) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const response = await meApi();
    setUser(response.user);
  }, []);

  const bootstrap = useCallback(async () => {
    try {
      await refreshSession();
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, [refreshSession]);

  useEffect(() => {
    void bootstrap();
  }, [bootstrap]);

  const login = useCallback(async (payload: LoginRequest) => {
    const response = await loginApi(payload);
    setUser(response.user);
  }, []);

  const register = useCallback(async (payload: RegisterRequest) => {
    const response = await registerApi(payload);
    setUser(response.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutApi();
    } finally {
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((updated: AuthUser) => {
    setUser(updated);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      login,
      register,
      logout,
      refreshSession,
      updateUser,
    }),
    [user, isLoading, login, register, logout, refreshSession, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
}
