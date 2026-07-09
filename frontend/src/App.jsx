import { useState } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./Dashboard";
import MemberDetail from "./pages/MemberDetail";
import Reports from "./pages/Reports";
import Settings from "./pages/Settings";
import MemberProfile from "./pages/MemberProfile";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import PortalSelect from "./pages/PortalSelect";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
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
        {!authUser && (
          <>
            <Route path="/" element={<PortalSelect />} />
            <Route
              path="/login/:portal"
              element={<LoginPage onLogin={handleLogin} />}
            />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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