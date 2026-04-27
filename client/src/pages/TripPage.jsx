import React, { useCallback, useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api } from "../api.js";

export default function TripPage() {
  const { id } = useParams();
  const [trip, setTrip] = useState(null);
  const [messages, setMessages] = useState([]);
  const [lastSuggestions, setLastSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [chat, setChat] = useState("");
  const [form, setForm] = useState({
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
      const data = await api(`/api/trips/${id}`);
      setTrip(data.trip);
      setMessages(data.messages || []);
      const lastAssistant = [...(data.messages || [])].reverse().find((m) => m.role === "assistant");
      setLastSuggestions(lastAssistant?.metadata?.suggestions || []);
      const c = data.trip?.constraints || {};
      setForm({
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

  async function saveTrip(e) {
    e.preventDefault();
    setError("");
    try {
      const updated = await api(`/api/trips/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
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
      setError(e.message);
    }
  }

  async function sendMessage(e) {
    e.preventDefault();
    if (!chat.trim() || sending) return;
    setSending(true);
    setError("");
    const text = chat.trim();
    setChat("");
    try {
      const data = await api(`/api/trips/${id}/messages`, {
        method: "POST",
        body: JSON.stringify({ text }),
      });
      setLastSuggestions(data.suggestions || []);
      await load();
    } catch (e) {
      setError(e.message);
      setChat(text);
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="page">
        <p className="muted">Loading trip…</p>
      </div>
    );
  }

  if (!trip) {
    return (
      <div className="page">
        <p className="error">{error || "Trip not found"}</p>
        <Link to="/">Back</Link>
      </div>
    );
  }

  return (
    <div className="page trip-layout">
      <div className="breadcrumb muted small">
        <Link to="/">Trips</Link> / {trip.title}
      </div>
      <h1>{trip.title}</h1>

      <div className="trip-grid">
        <section className="card">
          <h2>Trip constraints</h2>
          <p className="muted small">Used when you ask for destinations “within budget”.</p>
          <form onSubmit={saveTrip} className="form compact">
            <label>
              Origin (city or airport code)
              <input value={form.origin} onChange={(e) => setForm((f) => ({ ...f, origin: e.target.value }))} />
            </label>
            <div className="row-2">
              <label>
                Start date
                <input type="date" value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
              </label>
              <label>
                End date
                <input type="date" value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
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
                />
              </label>
              <label>
                Currency
                <input
                  value={form.currency}
                  maxLength={3}
                  onChange={(e) => setForm((f) => ({ ...f, currency: e.target.value }))}
                />
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
              />
            </label>
            <button type="submit" className="btn secondary">
              Save constraints
            </button>
          </form>
        </section>

        <section id="planner-chat" className="card chat-card">
          <h2>Planner chat</h2>
          <p className="muted small">Try: “Suggest summer destinations within my budget for a beach trip.”</p>
          <div className="chat-log">
            {messages.map((m) => (
              <div key={m._id} className={`bubble ${m.role}`}>
                <div className="bubble-meta">{m.role}</div>
                <div className="bubble-body">{m.content}</div>
              </div>
            ))}
          </div>
          {error ? <p className="error">{error}</p> : null}
          <form onSubmit={sendMessage} className="chat-input-row">
            <input
              value={chat}
              onChange={(e) => setChat(e.target.value)}
              placeholder="Ask the planner…"
              disabled={sending}
            />
            <button type="submit" className="btn primary" disabled={sending}>
              {sending ? "…" : "Send"}
            </button>
          </form>
        </section>
      </div>

      <section className="card suggestions">
        <h2>Destination cards</h2>
        <p className="muted small">Weather (Open-Meteo), FX (Frankfurter), and language notes are appended after the model picks spots.</p>
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
  );
}
