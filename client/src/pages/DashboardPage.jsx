import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import NewJourneyModal from "../components/NewJourneyModal.jsx";
import TripCard from "../components/TripCard.jsx";
import { DASHBOARD_HERO_IMAGE } from "../constants/dashboardHero.js";

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, updateMe } = useAuth();
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [bulkDeleting, setBulkDeleting] = useState(false);
  const [confirmDeleteAll, setConfirmDeleteAll] = useState(false);
  const [newJourneyOpen, setNewJourneyOpen] = useState(false);
  const [createJourneyBusy, setCreateJourneyBusy] = useState(false);
  const [createJourneyError, setCreateJourneyError] = useState("");

  const load = useCallback(async () => {
    setError("");
    try {
      const list = await api("/api/trips");
      setTrips(list);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const sortedTrips = useMemo(() => {
    const open = trips.filter((t) => t.status !== "archived");
    const archived = trips.filter((t) => t.status === "archived");
    return [...open, ...archived];
  }, [trips]);

  const latestTripId = sortedTrips.find((t) => t.status !== "archived")?._id || sortedTrips[0]?._id;
  const planningTrips = useMemo(() => sortedTrips.filter((t) => (t.status || "planning") === "planning"), [sortedTrips]);

  function openNewJourneyModal() {
    setCreateJourneyError("");
    setError("");
    setNewJourneyOpen(true);
  }

  async function createTripFromModal({ title, currency, maxTotalBudget, origin, startDate, endDate, partySize }) {
    setCreateJourneyBusy(true);
    setCreateJourneyError("");
    setError("");
    try {
      const trip = await api("/api/trips", {
        method: "POST",
        body: JSON.stringify({
          title,
          constraints: {
            origin: origin ?? "",
            startDate: startDate ?? "",
            endDate: endDate ?? "",
            maxTotalBudget,
            currency,
            partySize: partySize ?? 1,
          },
        }),
      });
      try {
        await updateMe({
          settings: {
            homeCurrency: currency,
            defaultTripBudget: maxTotalBudget,
          },
        });
      } catch {
        /* trip created; profile sync is best-effort for planner defaults */
      }
      setNewJourneyOpen(false);
      navigate(`/trips/${trip._id}`);
    } catch (e) {
      const msg = e.message || "Could not create journey";
      setCreateJourneyError(msg);
      throw e;
    } finally {
      setCreateJourneyBusy(false);
    }
  }

  async function handleDeleteAllPlanningConfirm() {
    if (bulkDeleting || planningTrips.length === 0) return;
    setBulkDeleting(true);
    setError("");
    try {
      const ids = planningTrips.map((t) => String(t._id));
      const results = await Promise.allSettled(ids.map((id) => api(`/api/trips/${id}`, { method: "DELETE" })));
      const deletedIds = ids.filter((_, i) => results[i]?.status === "fulfilled");
      const failed = results.length - deletedIds.length;

      if (deletedIds.length > 0) {
        setTrips((prev) => prev.filter((t) => !deletedIds.includes(String(t._id))));
      }
      if (failed > 0) {
        setError(
          deletedIds.length > 0
            ? `Deleted ${deletedIds.length} planning journeys. ${failed} could not be deleted.`
            : "Could not delete planning journeys."
        );
        throw new Error("Bulk delete incomplete");
      }
    } finally {
      setBulkDeleting(false);
    }
  }

  return (
    <div className="dashboard-page">
      <section className="dashboard-hero" aria-label="Featured destination backdrop">
        <div className="dashboard-hero-bg">
          <img src={DASHBOARD_HERO_IMAGE} alt="" className="dashboard-hero-img" fetchPriority="high" />
          <div className="dashboard-hero-blur" aria-hidden />
        </div>
        <div className="dashboard-hero-scrim" aria-hidden />
        <div className="dashboard-hero-inner">
          <p className="dashboard-eyebrow">Roamify</p>
          <h1 className="dashboard-title">Your journeys</h1>
          <p className="dashboard-lede">
            Curate escapes, set your compass on budget, and let the planner weave weather, FX, and
            languages into every decision.
          </p>
          <div className="dashboard-hero-actions">
            <button type="button" className="btn btn-new-trip" onClick={openNewJourneyModal}>
              <span className="btn-new-trip-glow" aria-hidden />
              <span className="btn-new-trip-inner">New journey</span>
            </button>
            <button
              type="button"
              className="btn btn-delete-all"
              onClick={() => setConfirmDeleteAll(true)}
              disabled={loading || planningTrips.length === 0 || bulkDeleting}
            >
              {bulkDeleting ? "Deleting…" : `Delete all planning (${planningTrips.length})`}
            </button>
          </div>
        </div>
      </section>

      <div className="dashboard-content">
        <div className="dashboard-layout">
          <div className="dashboard-main">
            {loading ? (
              <div className="dashboard-skeleton-grid" aria-hidden>
                <div className="dashboard-sk-card" />
                <div className="dashboard-sk-card" />
                <div className="dashboard-sk-card" />
              </div>
            ) : null}
            {error ? <p className="error">{error}</p> : null}

            {!loading && trips.length === 0 ? (
              <div className="dashboard-empty" role="status">
                <div className="dashboard-empty-map" aria-hidden />
                <h2 className="dashboard-empty-title">The map is yours</h2>
                <p className="dashboard-muted dashboard-empty-copy">
                  Start a journey from the button below, then refine details on the trip page.
                </p>
                <ol className="dashboard-steps">
                  <li>
                    Click <strong>Begin your first journey</strong> and choose currency and budget in the dialog.
                  </li>
                  <li>Add dates, origin, and constraints on the trip page.</li>
                  <li>
                    Open <strong>Planner chat</strong> and ask for destinations within budget. Optional: adjust the
                    dashboard theme in <Link to="/settings">Settings</Link>.
                  </li>
                </ol>
                <button type="button" className="btn btn-new-trip btn-new-trip--inline" onClick={openNewJourneyModal}>
                  <span className="btn-new-trip-glow" aria-hidden />
                  <span className="btn-new-trip-inner">Begin your first journey</span>
                </button>
              </div>
            ) : null}

            {!loading && trips.length > 0 ? (
              <div className="trip-feature-grid" role="list" aria-label="Your journeys">
                {sortedTrips.map((t, index) => (
                  <TripCard
                    key={t._id}
                    trip={t}
                    index={index}
                    onDeleted={(tripId) => setTrips((prev) => prev.filter((x) => String(x._id) !== String(tripId)))}
                    onDeleteError={setError}
                    onTripUpdated={(updated) =>
                      setTrips((prev) =>
                        prev.map((x) => (String(x._id) === String(updated._id) ? { ...x, ...updated } : x))
                      )
                    }
                  />
                ))}
              </div>
            ) : null}
          </div>

          <aside className="concierge-rail" aria-label="Roamify concierge">
            <div className="concierge-rail-inner">
              <div className="concierge-icon" aria-hidden>
                <svg width="28" height="28" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path
                    d="M12 3C8.5 3 5.5 5.5 4 9c2 4 4 9 8 12 4-3 6-8 8-12-1.5-3.5-4.5-6-8-6z"
                    stroke="currentColor"
                    strokeWidth="1.35"
                    strokeLinejoin="round"
                  />
                  <circle cx="12" cy="9" r="2.2" stroke="currentColor" strokeWidth="1.25" />
                </svg>
              </div>
              <h2 className="concierge-heading">Concierge planner</h2>
              <p className="concierge-copy">
                Every journey has a chat workspace—destinations within budget, live weather, FX, and
                language notes.
              </p>
              {latestTripId ? (
                <Link to={`/trips/${latestTripId}#planner-chat`} className="btn concierge-cta">
                  Open planner
                </Link>
              ) : (
                <button type="button" className="btn concierge-cta" onClick={openNewJourneyModal}>
                  Start &amp; open planner
                </button>
              )}
            </div>
          </aside>
        </div>
      </div>

      {latestTripId ? (
        <Link to={`/trips/${latestTripId}#planner-chat`} className="fab-planner" title="Chat with planner">
          <span className="fab-planner-icon" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M8 10h8M8 14h5M5 18l1.5-3H19a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v11z"
                stroke="currentColor"
                strokeWidth="1.35"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>
          <span className="fab-planner-text">Planner</span>
        </Link>
      ) : (
        <button type="button" className="fab-planner fab-planner--solo" onClick={openNewJourneyModal} title="New journey">
          <span className="fab-planner-icon" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path
                d="M12 5v14M5 12h14"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </span>
        </button>
      )}

      <NewJourneyModal
        open={newJourneyOpen}
        onClose={() => {
          setNewJourneyOpen(false);
          setCreateJourneyError("");
        }}
        defaultCurrency={user?.settings?.homeCurrency || "USD"}
        defaultBudget={user?.settings?.defaultTripBudget ?? 2000}
        serverError={createJourneyError}
        createBusy={createJourneyBusy}
        onCreate={createTripFromModal}
      />

      <ConfirmModal
        open={confirmDeleteAll}
        title="Delete all planning journeys?"
        description="This removes every journey currently in planning, including its chat messages. Archived, booked, and dreaming journeys are not deleted."
        confirmLabel={`Delete ${planningTrips.length} planning journeys`}
        variant="danger"
        confirmBusy={bulkDeleting}
        onClose={() => setConfirmDeleteAll(false)}
        onConfirm={handleDeleteAllPlanningConfirm}
      />
    </div>
  );
}
