import React, { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";

export default function SettingsPage() {
  const { user, updateMe } = useAuth();
  const [homeCurrency, setHomeCurrency] = useState("USD");
  const [defaultTripBudget, setDefaultTripBudget] = useState(2000);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user) return;
    setHomeCurrency(user.settings?.homeCurrency || "USD");
    setDefaultTripBudget(user.settings?.defaultTripBudget ?? 2000);
  }, [user]);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setSaved(false);
    try {
      await updateMe({
        settings: {
          homeCurrency: homeCurrency.toUpperCase(),
          defaultTripBudget: Number(defaultTripBudget),
        },
      });
      setSaved(true);
    } catch (err) {
      setError(err.message || "Save failed");
    }
  }

  return (
    <div className="page narrow">
      <h1>Settings</h1>
      <p className="muted">Home currency and default trip budget feed the AI planner.</p>
      <form onSubmit={onSubmit} className="form card">
        <label>
          Home currency (ISO 4217)
          <input value={homeCurrency} onChange={(e) => setHomeCurrency(e.target.value)} maxLength={3} />
        </label>
        <label>
          Default trip budget
          <input
            type="number"
            min={1}
            step={1}
            value={defaultTripBudget}
            onChange={(e) => setDefaultTripBudget(e.target.value)}
          />
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
