import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LandingPage } from "@/pages/landing-page";
import { AuthPage } from "@/components/auth-page";
import { IntakeAppPage } from "@/pages/intake-app-page";

// Strip the trailing slash from Vite's BASE_URL so react-router routes resolve
// correctly whether the app is served from "/" (dev) or "/<repo>/" (Pages).
const basename = import.meta.env.BASE_URL.replace(/\/$/, "") || "/"

export default function App() {
  return (
    <BrowserRouter basename={basename}>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/app" element={<IntakeAppPage />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
