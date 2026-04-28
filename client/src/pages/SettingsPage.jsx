import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { validateSettings } from "../lib/validation.js";

export default function SettingsPage() {
  const { user, updateMe } = useAuth();
  const [dashboardTheme, setDashboardTheme] = useState("cinematic-night");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setDashboardTheme(user.settings?.dashboardTheme || "cinematic-night");
  }, [user]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    const v = validateSettings({ dashboardTheme });
    if (!v.ok) {
      setError(v.errors.join(" "));
      return;
    }
    try {
      await updateMe({
        settings: {
          dashboardTheme,
        },
      });
      setSaved(true);
    } catch (err) {
      setError(err.message || "Save failed");
    }
  }

  return (
    <div className="page narrow settings-page">
      <h1>Settings</h1>
      <p className="muted">Choose how the dashboard looks. Currency and trip budget are set when you create a new journey.</p>
      <div className="callout callout--muted settings-disclaimer" role="note">
        Budgets and planner outputs are <strong>estimates</strong> for exploration—not quotes, availability, or financial
        advice. Confirm fares, lodging, and FX with real providers before you book.
      </div>
      <form onSubmit={onSubmit} className="form card">
        <label>
          Dashboard visual theme
          <select value={dashboardTheme} onChange={(e) => setDashboardTheme(e.target.value)}>
            <option value="cinematic-night">Cinematic Night</option>
            <option value="sunlit-editorial">Sunlit Editorial</option>
          </select>
        </label>
        {error ? <p className="error">{error}</p> : null}
        {saved ? <p className="success">Saved</p> : null}
        <button type="submit" className="btn primary">
          Save
        </button>
      </form>
    </div>
  );
}
