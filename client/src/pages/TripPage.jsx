import React, { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../api.js";
import ChatMessage from "../components/ChatMessage.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import { currencySelectOptions, currencySelectValue } from "../constants/currencies.js";
import { validateTripConstraints, validateTripTitle } from "../lib/validation.js";

const MESSAGES_PAGE = 100;

function mergeMessages(olderBatch, existing) {
  const map = new Map();
  for (const m of existing) map.set(String(m._id), m);
  for (const m of olderBatch) map.set(String(m._id), m);
  return [...map.values()].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
}

function formatDateChip(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

function tripStatusLabel(status) {
  switch (status) {
    case "archived":
      return "Archived";
    case "booked":
      return "Booked";
    case "dreaming":
      return "Dreaming";
    default:
      return "Planning";
  }
}

function ManifestChip({ label, children }) {
  return (
    <div className="trip-manifest-chip">
      <span className="trip-manifest-chip__label">{label}</span>
      <span className="trip-manifest-chip__value">{children}</span>
    </div>
  );
}

export default function TripPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [messages, setMessages] = useState([]);
  const [msgPagination, setMsgPagination] = useState(null);
  const [lastSuggestions, setLastSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [sendError, setSendError] = useState("");
  const [chat, setChat] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [confirm, setConfirm] = useState(null);
  const [form, setForm] = useState({
    title: "",
    origin: "",
    startDate: "",
    endDate: "",
    maxTotalBudget: "",
    currency: "USD",
    partySize: 1,
  });

  const load = useCallback(async () => {
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("messagesLimit", String(MESSAGES_PAGE));
      const data = await api(`/api/trips/${id}?${params.toString()}`);
      setTrip(data.trip);
      setMessages(data.messages || []);
      setMsgPagination(data.messagesPagination || null);
      const lastAssistant = [...(data.messages || [])].reverse().find((m) => m.role === "assistant");
      setLastSuggestions(lastAssistant?.metadata?.suggestions || []);
      const c = data.trip?.constraints || {};
      setForm({
        title: data.trip?.title || "",
        origin: c.origin || "",
        startDate: c.startDate || "",
        endDate: c.endDate || "",
        maxTotalBudget: c.maxTotalBudget ?? "",
        currency: c.currency || "USD",
        partySize: c.partySize || 1,
      });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  const loadMoreOlder = useCallback(async () => {
    if (!msgPagination?.hasOlder) return;
    const nextSkip = Math.max(0, msgPagination.skip - msgPagination.limit);
    const nextLimit = Math.min(msgPagination.limit, msgPagination.skip);
    if (nextLimit <= 0) return;
    setLoadingOlder(true);
    setError("");
    try {
      const params = new URLSearchParams();
      params.set("messagesSkip", String(nextSkip));
      params.set("messagesLimit", String(nextLimit));
      const data = await api(`/api/trips/${id}?${params.toString()}`);
      setMessages((prev) => mergeMessages(data.messages || [], prev));
      setMsgPagination(data.messagesPagination || null);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingOlder(false);
    }
  }, [id, msgPagination]);

  useEffect(() => {
    setLoading(true);
    setTrip(null);
    setMessages([]);
    setMsgPagination(null);
    setError("");
    setSendError("");
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loading || !trip) return;
    if (window.location.hash === "#planner-chat") {
      requestAnimationFrame(() => {
        document.getElementById("planner-chat")?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    }
  }, [loading, trip, id]);

  const tripStatusRaw = trip?.status === "draft" ? "planning" : trip?.status || "planning";
  const tripStatusKey = String(tripStatusRaw).toLowerCase();
  const tripStatus =
    tripStatusKey === "booked" || tripStatusKey === "dreaming" || tripStatusKey === "archived" ? tripStatusKey : "planning";
  const isArchived = tripStatus === "archived";
  const canDeleteTrip = trip && tripStatus === "planning";
  const canArchive = trip && !isArchived;
  const canRestore = trip && isArchived;

  async function saveTrip(e) {
    e.preventDefault();
    if (isArchived) {
      setError("Restore this journey before editing constraints.");
      return;
    }
    const titleV = validateTripTitle(form.title);
    if (!titleV.ok) {
      setError(titleV.errors.join(" "));
      return;
    }
    const v = validateTripConstraints(form);
    if (!v.ok) {
      setError(v.errors.join(" "));
      return;
    }
    setError("");
    try {
      const updated = await api(`/api/trips/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          title: form.title.trim(),
          constraints: {
            origin: form.origin,
            startDate: form.startDate,
            endDate: form.endDate,
            maxTotalBudget: Number(form.maxTotalBudget) || 0,
            currency: form.currency.toUpperCase(),
            partySize: Number(form.partySize) || 1,
          },
        }),
      });
      setTrip(updated);
    } catch (e) {
      setError(e.data?.error || e.message || "Save failed");
    }
  }

  async function submitChatText(text) {
    const trimmed = text.trim();
    if (!trimmed || sending || isArchived) return;
    setSending(true);
    setSendError("");
    setError("");
    setChat("");
    try {
      const data = await api(`/api/trips/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ text: trimmed }),
      });
      setLastSuggestions(data.suggestions || []);
      await load();
    } catch (e) {
      setSendError(e.data?.error || e.message || "Send failed");
      setChat(trimmed);
    } finally {
      setSending(false);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    await submitChatText(chat);
  }

  async function deleteTrip() {
    if (!trip || !canDeleteTrip || deleting) return;
    setDeleting(true);
    setError("");
    try {
      await api(`/api/trips/${id}`, { method: "DELETE" });
      navigate("/", { replace: true });
    } catch (e) {
      setError(e.data?.error || e.message || "Delete failed");
      throw e;
    } finally {
      setDeleting(false);
    }
  }

  async function archiveTrip() {
    if (!trip || archiving) return;
    setArchiving(true);
    setError("");
    try {
      const updated = await api(`/api/trips/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "archived" }),
      });
      setTrip(updated);
      setConfirm(null);
    } catch (e) {
      setError(e.data?.error || e.message || "Archive failed");
      throw e;
    } finally {
      setArchiving(false);
    }
  }

  async function restoreTrip() {
    if (!trip || archiving) return;
    setArchiving(true);
    setError("");
    try {
      const updated = await api(`/api/trips/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "planning" }),
      });
      setTrip(updated);
    } catch (e) {
      setError(e.data?.error || e.message || "Restore failed");
    } finally {
      setArchiving(false);
    }
  }

  if (loading) {
    return (
      <div className="page trip-layout trip-page trip-page--loading">
        <div className="trip-atmosphere" aria-hidden />
        <header className="trip-hero trip-hero--skeleton" aria-hidden>
          <div className="sk-line sk-line--breadcrumb" />
          <div className="sk-line sk-line--eyebrow" />
          <div className="sk-line sk-line--title" />
          <div className="sk-line sk-line--manifest" />
        </header>
        <div className="trip-page-skeleton trip-page-skeleton--body" aria-hidden>
          <div className="sk-grid">
            <div className="sk-card" />
            <div className="sk-card sk-card--tall" />
          </div>
        </div>
        <p className="muted sr-only">Loading trip…</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="page trip-page">
        <p className="error">{error || "Trip not found"}</p>
        <Link to="/">Back</Link>
      </div>
    );
  }

  const c = trip.constraints || {};
  const budgetLabel =
    c.maxTotalBudget != null ? `${Number(c.maxTotalBudget).toLocaleString()} ${c.currency || "USD"}` : "—";

  return (
    <div className="page trip-layout trip-page">
      <div className="trip-atmosphere" aria-hidden />
      <header className="trip-hero">
        <nav className="breadcrumb muted small trip-hero-breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Trips</Link>
          <span className="trip-hero-breadcrumb-sep" aria-hidden>
            /
          </span>
          <span className="trip-hero-breadcrumb-current">{trip.title}</span>
        </nav>
        <p className="trip-hero-eyebrow">Journey</p>
        <div className="trip-hero-head">
          <h1 className="trip-hero-title">{trip.title}</h1>
          <div className="trip-hero-actions">
            {canRestore ? (
              <button type="button" className="btn secondary" onClick={restoreTrip} disabled={archiving}>
                {archiving ? "…" : "Restore journey"}
              </button>
            ) : null}
            {canArchive ? (
              <button type="button" className="btn secondary" onClick={() => setConfirm("archive")} disabled={archiving}>
                Archive journey
              </button>
            ) : null}
            {canDeleteTrip ? (
              <button type="button" className="btn danger trip-delete-page" onClick={() => setConfirm("delete")} disabled={deleting}>
                Delete journey
              </button>
            ) : null}
          </div>
        </div>
        <div className="trip-hero-manifest" aria-label="Journey summary">
          <ManifestChip label="Origin">{c.origin?.trim() ? c.origin : "TBD"}</ManifestChip>
          <ManifestChip label="Dates">
            {formatDateChip(c.startDate)} → {formatDateChip(c.endDate)}
          </ManifestChip>
          <ManifestChip label="Budget">{budgetLabel}</ManifestChip>
          <ManifestChip label="Party">{c.partySize ?? 1}</ManifestChip>
          <span className={`trip-status-pill trip-status-pill--${tripStatus}`}>{tripStatusLabel(tripStatus)}</span>
        </div>
      </header>

      <div className="trip-hero-tear" aria-hidden />

      {isArchived ? (
        <p className="callout callout--muted trip-archived-callout" role="status">
          This journey is archived. Planner chat is read-only until you restore it.
        </p>
      ) : null}

      <div className="trip-body">
      <div className="trip-grid">
        <section className="card trip-constraints-card">
          <p className="trip-panel-eyebrow">Brief</p>
          <h2>Trip constraints</h2>
          <p className="muted small">Used when you ask for destinations “within budget”. Figures are estimates only.</p>
          <form onSubmit={saveTrip} className="form compact">
            <label>
              Journey title
              <input
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                maxLength={120}
                disabled={isArchived}
                autoComplete="off"
              />
            </label>
            <label>
              Origin (city or airport code)
              <input
                value={form.origin}
                onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))}
                disabled={isArchived}
              />
            </label>
            <div className="row-2">
              <label>
                Start date
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))}
                  disabled={isArchived}
                />
              </label>
              <label>
                End date
                <input
                  type="date"
                  value={form.endDate}
                  onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))}
                  disabled={isArchived}
                />
              </label>
            </div>
            <div className="row-2">
              <label>
                Max total budget
                <input
                  type="number"
                  min={1}
                  value={form.maxTotalBudget}
                  onChange={(e) => setForm((f) => ({ ...f, maxTotalBudget: e.target.value }))}
                  disabled={isArchived}
                />
              </label>
              <label>
                Currency
                <select
                  value={currencySelectValue(form.currency)}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                  disabled={isArchived}
                >
                  {currencySelectOptions(form.currency).map(({ code, label }) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Party size
              <input
                type="number"
                min={1}
                max={20}
                value={form.partySize}
                onChange={(e) => setForm((f) => ({ ...f, partySize: e.target.value }))}
                disabled={isArchived}
              />
            </label>
            <button type="submit" className="btn secondary" disabled={isArchived}>
              Save constraints
            </button>
          </form>
        </section>

        <section id="planner-chat" className="card chat-card trip-chat-card">
          <p className="trip-panel-eyebrow">Live line</p>
          <h2>Planner chat</h2>
          <p className="muted small">Try: “Suggest summer destinations within my budget for a beach trip.”</p>

          <div className="planner-context" aria-label="Active planner constraints">
            <span className="planner-chip">
              <span className="planner-chip-label">Budget</span> {budgetLabel}
            </span>
            <span className="planner-chip">
              <span className="planner-chip-label">Dates</span> {formatDateChip(c.startDate)} → {formatDateChip(c.endDate)}
            </span>
            <span className="planner-chip">
              <span className="planner-chip-label">Origin</span> {c.origin?.trim() ? c.origin : "TBD"}
            </span>
            <span className="planner-chip">
              <span className="planner-chip-label">Party</span> {c.partySize ?? 1}
            </span>
          </div>

          <div className="chat-log">
            {msgPagination?.hasOlder ? (
              <button type="button" className="btn ghost chat-load-older" onClick={loadMoreOlder} disabled={loadingOlder}>
                {loadingOlder ? "Loading…" : "Load older messages"}
              </button>
            ) : null}
            {messages.map((m) => (
              <ChatMessage key={m._id} message={m} />
            ))}
          </div>

          {sendError ? (
            <div className="chat-send-error" role="alert">
              <span>{sendError}</span>
              <button type="button" className="btn secondary chat-retry" onClick={() => submitChatText(chat)} disabled={sending || !chat.trim()}>
                Retry send
              </button>
            </div>
          ) : null}
          {error ? <p className="error">{error}</p> : null}

          <form onSubmit={sendMessage} className="chat-input-row">
            <input
              value={chat}
              onChange={(e) => setChat(e.target.value)}
              placeholder={isArchived ? "Restore journey to send messages…" : "Ask the planner…"}
              disabled={sending || isArchived}
            />
            <button type="submit" className="btn primary" disabled={sending || isArchived}>
              {sending ? "…" : "Send"}
            </button>
          </form>
        </section>
      </div>

      <section className="card suggestions trip-destinations">
        <p className="trip-panel-eyebrow">Concierge atlas</p>
        <h2>Destination cards</h2>
        <p className="muted small">
          Weather (Open-Meteo), FX (Frankfurter), and language notes are indicative only—not booking advice. Model cost
          ranges are rough ballparks; confirm flights and lodging separately.
        </p>
        <div className="card-grid">
          {lastSuggestions.length === 0 ? <p className="muted">Send a message to populate suggestions.</p> : null}
          {lastSuggestions.map((s, i) => (
            <article key={`${s.name}-${i}`} className="dest-card">
              <header>
                <h3>{s.name}</h3>
                <p className="muted small">
                  {s.country} · est. {s.estCostMin}–{s.estCostMax} {s.currency}
                </p>
              </header>
              {s.rationale ? <p className="small">{s.rationale}</p> : null}
              <dl className="facts">
                <dt>Weather</dt>
                <dd>{s.weather}</dd>
                <dt>FX</dt>
                <dd>{s.fxNote}</dd>
                <dt>Languages</dt>
                <dd>{s.languages}</dd>
              </dl>
            </article>
          ))}
        </div>
      </section>
      </div>

      <ConfirmModal
        open={confirm === "delete"}
        title="Delete this journey?"
        description="All planner messages and destination cards for this trip will be removed. This cannot be undone."
        confirmLabel="Delete"
        variant="danger"
        confirmBusy={deleting}
        onClose={() => setConfirm(null)}
        onConfirm={deleteTrip}
      />
      <ConfirmModal
        open={confirm === "archive"}
        title="Archive this journey?"
        description="It will move out of your active planning flow and planner chat will be read-only until you restore it from the trip page."
        confirmLabel="Archive"
        confirmBusy={archiving}
        onClose={() => setConfirm(null)}
        onConfirm={archiveTrip}
      />
    </div>
  );
}
