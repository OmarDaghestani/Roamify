import React, { useEffect, useId, useRef, useState } from "react";
import { currencySelectOptions, currencySelectValue } from "../constants/currencies.js";
import { validateNewJourneyModal } from "../lib/validation.js";

/**
 * Native `<dialog>` for creating a journey with title, constraints, and budget.
 */
export default function NewJourneyModal({
  open,
  onClose,
  defaultCurrency = "USD",
  defaultBudget = 2000,
  serverError = "",
  onCreate,
  createBusy = false,
}) {
  const ref = useRef(null);
  const titleId = useId();
  const errId = useId();
  const [title, setTitle] = useState("");
  const [origin, setOrigin] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [partySize, setPartySize] = useState("1");
  const [currency, setCurrency] = useState("USD");
  const [maxTotalBudget, setMaxTotalBudget] = useState(String(defaultBudget));
  const [error, setError] = useState("");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open) {
      if (!el.open) el.showModal();
    } else if (el.open) {
      el.close();
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setOrigin("");
    setStartDate("");
    setEndDate("");
    setPartySize("1");
    setCurrency((defaultCurrency || "USD").toUpperCase());
    setMaxTotalBudget(String(defaultBudget ?? 2000));
    setError("");
  }, [open, defaultCurrency, defaultBudget]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    const partyNum = partySize === "" ? 1 : Number(partySize);
    const v = validateNewJourneyModal({
      title,
      origin,
      startDate,
      endDate,
      currency,
      maxTotalBudget,
      partySize: partyNum,
    });
    if (!v.ok) {
      setError(v.errors.join(" "));
      return;
    }
    const trimmedTitle = (title || "").trim();
    const resolvedTitle =
      trimmedTitle ||
      `Journey — ${new Date().toLocaleDateString(undefined, { dateStyle: "medium" })}`;
    try {
      await onCreate?.({
        title: resolvedTitle,
        currency: currency.toUpperCase(),
        maxTotalBudget: Number(maxTotalBudget),
        origin: origin.trim(),
        startDate,
        endDate,
        partySize: Number.isInteger(partyNum) && partyNum >= 1 && partyNum <= 20 ? partyNum : 1,
      });
      ref.current?.close();
    } catch {
      /* parent sets error; keep dialog open */
    }
  }

  return (
    <dialog
      ref={ref}
      className="confirm-dialog new-journey-dialog"
      aria-labelledby={titleId}
      aria-describedby={error || serverError ? errId : undefined}
      onClose={() => onClose?.()}
    >
      <form className="confirm-dialog-inner new-journey-dialog-inner" onSubmit={handleSubmit}>
        <h2 id={titleId} className="confirm-dialog-title">
          New journey
        </h2>
        <p className="confirm-dialog-desc muted new-journey-dialog-lede">
          Set how this trip should appear to the planner. You can change everything later on the trip page.
        </p>
        <div className="new-journey-dialog-fields">
          <label className="new-journey-field">
            <span className="new-journey-label">Title (optional)</span>
            <input
              type="text"
              maxLength={120}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Summer in the Med"
              disabled={createBusy}
              autoComplete="off"
            />
          </label>
          <label className="new-journey-field">
            <span className="new-journey-label">Origin (city or airport code)</span>
            <input
              type="text"
              maxLength={120}
              value={origin}
              onChange={(e) => setOrigin(e.target.value)}
              placeholder="Optional for now"
              disabled={createBusy}
              autoComplete="off"
            />
          </label>
          <div className="row-2 new-journey-row-2">
            <label className="new-journey-field">
              <span className="new-journey-label">Start date</span>
              <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} disabled={createBusy} />
            </label>
            <label className="new-journey-field">
              <span className="new-journey-label">End date</span>
              <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} disabled={createBusy} />
            </label>
          </div>
          <div className="row-2 new-journey-row-2">
            <label className="new-journey-field">
              <span className="new-journey-label">Budget currency</span>
              <select
                value={currencySelectValue(currency)}
                onChange={(e) => setCurrency(e.target.value)}
                disabled={createBusy}
              >
                {currencySelectOptions(currency).map(({ code, label }) => (
                  <option key={code} value={code}>
                    {label}
                  </option>
                ))}
              </select>
            </label>
            <label className="new-journey-field">
              <span className="new-journey-label">Trip budget</span>
              <input
                type="number"
                min={1}
                step={1}
                value={maxTotalBudget}
                onChange={(e) => setMaxTotalBudget(e.target.value)}
                disabled={createBusy}
              />
            </label>
          </div>
          <label className="new-journey-field">
            <span className="new-journey-label">Party size</span>
            <input
              type="number"
              min={1}
              max={20}
              step={1}
              value={partySize}
              onChange={(e) => setPartySize(e.target.value)}
              disabled={createBusy}
            />
          </label>
        </div>
        {error || serverError ? (
          <p id={errId} className="error new-journey-dialog-error" role="alert">
            {error || serverError}
          </p>
        ) : null}
        <div className="confirm-dialog-actions">
          <button type="button" className="btn secondary" onClick={() => ref.current?.close()} disabled={createBusy}>
            Cancel
          </button>
          <button type="submit" className="btn primary" disabled={createBusy}>
            {createBusy ? "…" : "Create journey"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
