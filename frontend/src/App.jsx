import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import MemberDetail from "./pages/MemberDetail";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import MemberProfile from "./pages/MemberProfile";
import LoginPage from "./pages/LoginPage";
import LandingPage from "./pages/LandingPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import VerifyCertificate from "./pages/VerifyCertificate";
import { getUserFromToken } from "./utils/authUtils.js";

export default function App() {
  // authUser is the decoded JWT payload: { userId, role, iat, exp } or null
  const [authUser, setAuthUser] = useState(() => getUserFromToken());

  const handleLogin = () => setAuthUser(getUserFromToken());
  const handleLogout = () => {
    localStorage.removeItem("token");
    setAuthUser(null);
  };

  return (
    <BrowserRouter>
      <Routes>
        {/* Public regardless of login state — this is what a certificate's
            QR code links to, so it must work whether the visitor is
            logged out, an admin, or a member. Placed before the auth-gated
            blocks below so it matches before any of their "*" redirects. */}
        <Route path="/verify" element={<VerifyCertificate />} />
        <Route path="/verify/:certificateId" element={<VerifyCertificate />} />

        {!authUser && (
          <>
            <Route path="/" element={<LandingPage />} />
            <Route
              path="/login/:portal"
              element={<LoginPage onLogin={handleLogin} />}
            />


            <Route
              path="/login/:portal/verify-email"
              element={<LoginPage onLogin={handleLogin} />}
            />
            <Route
              path="/login/:portal/verify-email/confirm"
              element={<LoginPage onLogin={handleLogin} />}
            />


            {/* <Route path="/forgot-password" element={<ForgotPasswordPage />} /> */}


            <Route
              path="/forgot-password/:portal"
              element={<ForgotPasswordPage />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {authUser?.role === "ADMIN" && (
          <>
            <Route path="/" element={<Dashboard onLogout={handleLogout} />} />
            <Route
              path="/members/:id"
              element={<MemberDetail onLogout={handleLogout} />}
            />
            <Route
              path="/reports"
              element={<Reports onLogout={handleLogout} />}
            />
            <Route
              path="/settings"
              element={<Settings onLogout={handleLogout} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}

        {authUser?.role === "MEMBER" && (
          <>
            <Route
              path="/"
              element={<MemberProfile onLogout={handleLogout} />}
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </>
        )}
      </Routes>
    </BrowserRouter>
  );
}