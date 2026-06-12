import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "@/lib/theme";
import { AuthProvider } from "@/lib/auth";
import { ProtectedRoute } from "@/components/protected-route";
import { LandingPage } from "@/pages/landing-page";
import { LoginPage } from "@/components/auth-page";
import { IntakeAppPage } from "@/pages/intake-app-page";
import { MyClaimsPage } from "@/pages/my-claims-page";
import { ClaimDetailPage } from "@/pages/claim-detail-page";
import { DashboardPage } from "@/pages/dashboard-page";
import { DashboardDetailPage } from "@/pages/dashboard-detail-page";

// Strip the trailing slash from Vite's BASE_URL so react-router routes resolve
// correctly whether the app is served from "/" (dev) or "/<repo>/" (Pages).
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/";

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter basename={basename}>
          <Routes>
            <Route path="/" element={<LandingPage />} />

            {/* Claimant (public) */}
            <Route path="/app" element={<IntakeAppPage />} />
            <Route path="/claims" element={<MyClaimsPage />} />
            <Route path="/claims/:id" element={<ClaimDetailPage />} />

            {/* Firm (auth required) */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/auth" element={<Navigate to="/login" replace />} />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/dashboard/:id"
              element={
                <ProtectedRoute>
                  <DashboardDetailPage />
                </ProtectedRoute>
              }
            />

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
