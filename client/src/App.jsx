import React from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";
import Layout from "./components/Layout.jsx";
import LoginPage from "./pages/LoginPage.jsx";
import RegisterPage from "./pages/RegisterPage.jsx";
import SettingsPage from "./pages/SettingsPage.jsx";
import DashboardPage from "./pages/DashboardPage.jsx";
import TripPage from "./pages/TripPage.jsx";

function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="center muted" style={{ padding: "3rem" }}>
        Loading…
      </div>
    );
  }
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="trips/:id" element={<TripPage />} />
      </Route>
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
