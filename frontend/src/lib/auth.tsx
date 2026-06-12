import type React from "react";
import { createContext, useContext, useState } from "react";

// DEMO-ONLY auth. The site is a static GitHub Pages build, so this is a
// client-side gate with a single hardcoded firm account — NOT real security.
// Real auth would live on the FastAPI backend with a users table + sessions.
export const FIRM_EMAIL = "firm@legalintake.ai";
const FIRM_PASSWORD = "Intake2026!";
const STORAGE_KEY = "firm_auth";

interface AuthContextValue {
  isFirm: boolean;
  login: (email: string, password: string) => boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isFirm, setIsFirm] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem(STORAGE_KEY) === "1";
  });

  const login = (email: string, password: string): boolean => {
    if (email.trim().toLowerCase() === FIRM_EMAIL && password === FIRM_PASSWORD) {
      localStorage.setItem(STORAGE_KEY, "1");
      setIsFirm(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem(STORAGE_KEY);
    setIsFirm(false);
  };

  return <AuthContext.Provider value={{ isFirm, login, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
