"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { AuthUser, LoginResponse } from "@/types";

interface AuthContextType {
  user: AuthUser | null;
  accessToken: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    firmName: string;
    sraNumber?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const setAuth = useCallback(
    (data: LoginResponse | null) => {
      if (data) {
        setUser(data.user);
        setAccessToken(data.accessToken);
        // Set cookie for middleware route protection
        document.cookie = `lexsuite_access_token=${data.accessToken}; path=/; max-age=${15 * 60}; samesite=strict`;
      } else {
        setUser(null);
        setAccessToken(null);
        document.cookie =
          "lexsuite_access_token=; path=/; max-age=0; samesite=strict";
      }
    },
    []
  );

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        setAuth(null);
        return false;
      }
      const data: LoginResponse = await res.json();
      setAuth(data);
      return true;
    } catch {
      setAuth(null);
      return false;
    }
  }, [setAuth]);

  // Try to refresh on mount
  useEffect(() => {
    refreshAuth().finally(() => setIsLoading(false));
  }, [refreshAuth]);

  // Auto-refresh token before expiry (every 13 minutes for a 15-min token)
  useEffect(() => {
    if (!accessToken) return;
    const interval = setInterval(
      () => {
        refreshAuth();
      },
      13 * 60 * 1000
    );
    return () => clearInterval(interval);
  }, [accessToken, refreshAuth]);

  const login = async (email: string, password: string) => {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Login failed");
    }

    const data: LoginResponse = await res.json();
    setAuth(data);
    router.push("/dashboard");
  };

  const register = async (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    firmName: string;
    sraNumber?: string;
  }) => {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(data),
    });

    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || "Registration failed");
    }

    const result: LoginResponse = await res.json();
    setAuth(result);
    router.push("/dashboard");
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {},
        credentials: "include",
      });
    } finally {
      setAuth(null);
      router.push("/login");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isLoading,
        login,
        register,
        logout,
        refreshAuth,
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
