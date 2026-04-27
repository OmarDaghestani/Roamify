import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";
import BrandMark from "./BrandMark.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>
      <header className="topbar" role="banner">
        <NavLink to="/" className="brand" end>
          <span className="brand-mark-wrap" aria-hidden="true">
            <BrandMark className="brand-mark" />
          </span>
          <span className="brand-text">
            <span className="brand-title">Roamify</span>
            <span className="brand-sub">Summer-ready planning</span>
          </span>
        </NavLink>
        <nav className="nav" aria-label="Primary">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Trips
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "active" : "")}>
            Settings
          </NavLink>
        </nav>
        <div className="user-meta">
          <span className="user-email" title={user?.email || undefined}>
            {user?.email}
          </span>
          <button type="button" className="btn ghost topbar-logout" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main id="main-content" className="main" tabIndex={-1}>
        <Outlet />
      </main>
    </div>
  );
}
