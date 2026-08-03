"use client";

// Stage 04
// Step 08
//
// Purpose: authentication context. Persists the JWT in localStorage and
// restores the session on load by calling the protected /me endpoint —
// this is the "session persistence" half of Stage 4.

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import * as api from "@/lib/api";
import { User } from "@/lib/types";

interface AuthContextValue {
  user: User | null;
  token: string | null;
  loading: boolean;
  signup: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "lagos-auth-token";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const stored = window.localStorage.getItem(TOKEN_KEY);
    if (!stored) {
      setLoading(false);
      return;
    }
    api
      .fetchMe(stored)
      .then((me) => {
        setToken(stored);
        setUser(me);
      })
      .catch(() => window.localStorage.removeItem(TOKEN_KEY))
      .finally(() => setLoading(false));
  }, []);

  const applyAuth = useCallback((newToken: string, newUser: User) => {
    window.localStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setUser(newUser);
  }, []);

  const signup = useCallback(
    async (name: string, email: string, password: string) => {
      const res = await api.signup(name, email, password);
      applyAuth(res.token, res.user);
    },
    [applyAuth]
  );

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.login(email, password);
      applyAuth(res.token, res.user);
    },
    [applyAuth]
  );

  const logout = useCallback(() => {
    window.localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
