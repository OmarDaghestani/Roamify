import React from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function Layout() {
  const { user, logout } = useAuth();
  return (
    <div className="app-shell">
      <header className="topbar">
        <NavLink to="/" className="brand" end>
          <span className="brand-icon" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M21 8.5c0 1.5-.8 2.8-2 3.5L15 14l-1 6-2-4-4 1 3-4-4-1 6-1 2-4c.7-1.2 2-2 3.5-2z"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinejoin="round"
              />
              <path d="M3 12h5l2-2" stroke="currentColor" strokeWidth="1.35" strokeLinecap="round" />
            </svg>
          </span>
          <span className="brand-text">
            <span className="brand-title">Travel MVP</span>
            <span className="brand-sub">Summer-ready planning</span>
          </span>
        </NavLink>
        <nav className="nav">
          <NavLink to="/" end className={({ isActive }) => (isActive ? "active" : "")}>
            Trips
          </NavLink>
          <NavLink to="/settings" className={({ isActive }) => (isActive ? "active" : "")}>
            Settings
          </NavLink>
        </nav>
        <div className="user-meta">
          <span className="muted">{user?.email}</span>
          <button type="button" className="btn ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  );
}
