import React, { useState } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../auth/AuthContext.jsx";

export default function RegisterPage() {
  const { user, register } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  if (user) return <Navigate to="/" replace />;

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await register({ email, password });
    } catch (err) {
      const d = err.data?.error;
      setError(typeof d === "string" ? d : err.message || "Registration failed");
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>Create account</h1>
        <p className="muted">Set a budget later in Settings</p>
        <form onSubmit={onSubmit} className="form">
          <label>
            Email
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" />
          </label>
          <label>
            Password (min 8)
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete="new-password"
            />
          </label>
          {error ? <p className="error">{typeof error === "string" ? error : "Validation error"}</p> : null}
          <button type="submit" className="btn primary">
            Register
          </button>
        </form>
        <p className="muted small">
          Have an account? <Link to="/login">Sign in</Link>
        </p>
      </div>
    </div>
  );
}
