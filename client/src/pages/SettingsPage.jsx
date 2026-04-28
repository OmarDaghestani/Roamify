import React, { useEffect, useId, useState } from "react";
import { useAuth } from "../auth/AuthContext.jsx";
import { validateSettings } from "../lib/validation.js";

const THEMES = [
  {
    value: "cinematic-night",
    label: "Cinematic Night",
    hint: "Moon, starfield, and meteors behind your journeys.",
    previewClass: "settings-theme-card__preview--night",
  },
  {
    value: "sunlit-editorial",
    label: "Sunlit Editorial",
    hint: "Warm sky, illustrated clouds, and parchment cards.",
    previewClass: "settings-theme-card__preview--sun",
  },
];

export default function SettingsPage() {
  const { user, updateMe } = useAuth();
  const [dashboardTheme, setDashboardTheme] = useState("cinematic-night");
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const themeGroupId = useId();

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
    <div className="page settings-page">
      <header className="settings-hero">
        <p className="settings-eyebrow">Roamify</p>
        <h1 className="settings-title">Settings</h1>
        <p className="settings-lede">
          Shape the dashboard atmosphere. Currency and trip budgets are chosen when you start a new journey.
        </p>
      </header>

      <div className="callout callout--muted settings-disclaimer" role="note">
        Budgets and planner outputs are <strong>estimates</strong> for exploration—not quotes, availability, or financial
        advice. Confirm fares, lodging, and FX with real providers before you book.
      </div>

      <form onSubmit={onSubmit} className="form card settings-form">
        <fieldset className="settings-theme-fieldset">
          <legend id={`${themeGroupId}-legend`} className="settings-theme-legend">
            Dashboard appearance
          </legend>
          <div className="settings-theme-cards" role="radiogroup" aria-labelledby={`${themeGroupId}-legend`}>
            {THEMES.map((t) => {
              const selected = dashboardTheme === t.value;
              return (
                <button
                  key={t.value}
                  type="button"
                  className={`settings-theme-card${selected ? " is-selected" : ""}`}
                  onClick={() => {
                    setDashboardTheme(t.value);
                    setSaved(false);
                  }}
                  aria-pressed={selected}
                  aria-label={`${t.label}. ${t.hint}`}
                >
                  <span className={`settings-theme-card__preview ${t.previewClass}`} aria-hidden />
                  <span className="settings-theme-card__label">{t.label}</span>
                  <span className="settings-theme-card__hint">{t.hint}</span>
                </button>
              );
            })}
          </div>
        </fieldset>

        {error ? <p className="error">{error}</p> : null}
        {saved ? <p className="success settings-saved">Saved — your dashboard is using this look now.</p> : null}

        <div className="settings-form__actions">
          <button type="submit" className="btn primary settings-save-btn">
            Save appearance
          </button>
        </div>
      </form>
    </div>
  );
}
