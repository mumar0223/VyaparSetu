"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import type { AuthUser } from "@/lib/auth-types";

interface SessionData {
  user: AuthUser;
}

interface AuthContextType {
  user: AuthUser | null;
  session: SessionData | null;
  status: "authenticated" | "unauthenticated" | "loading";
  setUser: (user: AuthUser | null) => void;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  status: "unauthenticated",
  setUser: () => {},
  logout: async () => {},
});

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: React.ReactNode;
  initialUser?: AuthUser | null;
}) {
  const [user, setUser] = useState<AuthUser | null>(initialUser);

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      setUser(null);
      window.location.href = "/";
    }
  }, []);

  const session = user ? { user } : null;
  const status = user ? "authenticated" : "unauthenticated";

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        status,
        setUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function useSession() {
  const { session, status } = useContext(AuthContext);
  return {
    data: session,
    status,
  };
}
