import type React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/lib/auth";

/** Gates firm-only routes. Redirects to /login when not signed in. */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isFirm } = useAuth();
  const location = useLocation();
  if (!isFirm) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }
  return <>{children}</>;
}
