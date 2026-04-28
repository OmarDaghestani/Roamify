import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, resolveImageUrl } from "../api.js";
import { useAuth } from "../auth/AuthContext.jsx";
import ConfirmModal from "../components/ConfirmModal.jsx";
import DashboardCloudIllustration from "../components/DashboardCloudIllustration.jsx";
import DashboardSunIllustration from "../components/DashboardSunIllustration.jsx";
import NewJourneyModal from "../components/NewJourneyModal.jsx";
import TripCard from "../components/TripCard.jsx";
import { DASHBOARD_HERO_IMAGE } from "../constants/dashboardHero.js";

export default function DashboardPage() {
  const heroImageUrl = resolveImageUrl(DASHBOARD_HERO_IMAGE);
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
  const [tripListFilter, setTripListFilter] = useState("all");

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
    const openRank = (s) => {
      const v = s === "draft" ? "planning" : s || "planning";
      if (v === "planning") return 0;
      if (v === "booked") return 1;
      if (v === "dreaming") return 2;
      return 3;
    };
    const byUpdatedDesc = (a, b) => new Date(b.updatedAt || 0) - new Date(a.updatedAt || 0);
    const open = trips.filter((t) => t.status !== "archived");
    const archived = trips.filter((t) => t.status === "archived");
    const openSorted = [...open].sort((a, b) => {
      const ra = openRank(a.status);
      const rb = openRank(b.status);
      if (ra !== rb) return ra - rb;
      return byUpdatedDesc(a, b);
    });
    const archivedSorted = [...archived].sort(byUpdatedDesc);
    return [...openSorted, ...archivedSorted];
  }, [trips]);

  const tripFilterCounts = useMemo(() => {
    const planning = trips.filter((t) => (t.status === "draft" ? "planning" : t.status || "planning") === "planning").length;
    const archived = trips.filter((t) => t.status === "archived").length;
    return { all: trips.length, planning, archived };
  }, [trips]);

  const filteredTrips = useMemo(() => {
    if (tripListFilter === "planning") {
      return sortedTrips.filter((t) => (t.status === "draft" ? "planning" : t.status || "planning") === "planning");
    }
    if (tripListFilter === "archived") {
      return sortedTrips.filter((t) => t.status === "archived");
    }
    return sortedTrips;
  }, [sortedTrips, tripListFilter]);

  const latestTripId = sortedTrips.find((t) => t.status !== "archived")?._id || sortedTrips[0]?._id;
  const planningTrips = useMemo(
    () => sortedTrips.filter((t) => (t.status === "draft" ? "planning" : t.status || "planning") === "planning"),
    [sortedTrips]
  );

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
      <section className="dashboard-hero dashboard-hero--above-atmosphere" aria-label="Featured destination backdrop">
        <div className="dashboard-hero-bg">
          <img src={heroImageUrl} alt="" className="dashboard-hero-img" fetchPriority="high" />
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

      <div className="dashboard-content-wrap">
        <div className="dashboard-atmosphere" aria-hidden="true">
          <div className="dashboard-atmosphere__night">
            <div className="dashboard-atmosphere__moon" />
            <div className="dashboard-atmosphere__starfield" />
            <div className="dashboard-atmosphere__meteors">
              <span className="dashboard-meteor dashboard-meteor--1" />
              <span className="dashboard-meteor dashboard-meteor--2" />
              <span className="dashboard-meteor dashboard-meteor--3" />
              <span className="dashboard-meteor dashboard-meteor--4" />
              <span className="dashboard-meteor dashboard-meteor--5" />
              <span className="dashboard-meteor dashboard-meteor--6" />
              <span className="dashboard-meteor dashboard-meteor--7 dashboard-meteor--alt" />
              <span className="dashboard-meteor dashboard-meteor--8 dashboard-meteor--alt" />
              <span className="dashboard-meteor dashboard-meteor--9" />
              <span className="dashboard-meteor dashboard-meteor--10 dashboard-meteor--alt" />
              <span className="dashboard-meteor dashboard-meteor--11" />
              <span className="dashboard-meteor dashboard-meteor--12 dashboard-meteor--alt" />
            </div>
          </div>
          <div className="dashboard-atmosphere__day">
            <div className="dashboard-atmosphere__sun">
              <DashboardSunIllustration />
            </div>
            <div className="dashboard-atmosphere__clouds">
              <div className="dashboard-cloud dashboard-cloud--1">
                <DashboardCloudIllustration variant="leading" />
              </div>
              <div className="dashboard-cloud dashboard-cloud--2">
                <DashboardCloudIllustration variant="mid" />
              </div>
              <div className="dashboard-cloud dashboard-cloud--3">
                <DashboardCloudIllustration variant="bank" />
              </div>
            </div>
          </div>
        </div>

        <div className="dashboard-sky-actors" aria-hidden>
          <div className="dashboard-sky-actors__night">
            <div className="dashboard-sky-ufo">
              <svg
                className="dashboard-ufo-svg"
                width="120"
                height="78"
                viewBox="0 0 56 36"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <ellipse cx="28" cy="24" rx="22" ry="7" fill="url(#dashboard-ufo-disc)" opacity="0.95" />
                <ellipse cx="28" cy="17" rx="14" ry="10" fill="url(#dashboard-ufo-dome)" />
                <ellipse cx="28" cy="13" rx="8" ry="5" fill="#e2e8f0" opacity="0.55" />
                <circle cx="14" cy="24" r="2" fill="#4ade80" className="dashboard-ufo-light" />
                <circle cx="28" cy="26" r="2.2" fill="#2dd4bf" className="dashboard-ufo-light" />
                <circle cx="42" cy="24" r="2" fill="#4ade80" className="dashboard-ufo-light" />
                <defs>
                  <linearGradient id="dashboard-ufo-disc" x1="6" y1="24" x2="50" y2="24" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#475569" />
                    <stop offset="0.5" stopColor="#64748b" />
                    <stop offset="1" stopColor="#334155" />
                  </linearGradient>
                  <linearGradient id="dashboard-ufo-dome" x1="14" y1="10" x2="42" y2="22" gradientUnits="userSpaceOnUse">
                    <stop stopColor="#94a3b8" />
                    <stop offset="1" stopColor="#cbd5e1" />
                  </linearGradient>
                </defs>
              </svg>
            </div>
          </div>
        </div>

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
              <>
                {trips.length >= 2 ? (
                  <div className="dashboard-trip-filter" role="tablist" aria-label="Filter journeys">
                    <button
                      type="button"
                      className={`dashboard-trip-filter__btn${tripListFilter === "all" ? " is-active" : ""}`}
                      role="tab"
                      aria-selected={tripListFilter === "all"}
                      onClick={() => setTripListFilter("all")}
                    >
                      All
                      <span className="dashboard-trip-filter__count">{tripFilterCounts.all}</span>
                    </button>
                    <button
                      type="button"
                      className={`dashboard-trip-filter__btn${tripListFilter === "planning" ? " is-active" : ""}`}
                      role="tab"
                      aria-selected={tripListFilter === "planning"}
                      onClick={() => setTripListFilter("planning")}
                    >
                      Planning
                      <span className="dashboard-trip-filter__count">{tripFilterCounts.planning}</span>
                    </button>
                    <button
                      type="button"
                      className={`dashboard-trip-filter__btn${tripListFilter === "archived" ? " is-active" : ""}`}
                      role="tab"
                      aria-selected={tripListFilter === "archived"}
                      onClick={() => setTripListFilter("archived")}
                    >
                      Archive
                      <span className="dashboard-trip-filter__count">{tripFilterCounts.archived}</span>
                    </button>
                  </div>
                ) : null}
                {filteredTrips.length === 0 ? (
                  <div className="dashboard-filter-empty" role="status">
                    <p className="dashboard-filter-empty__text">
                      {tripListFilter === "planning"
                        ? "No journeys are in planning right now."
                        : "No archived journeys yet."}
                    </p>
                    <button type="button" className="btn secondary dashboard-filter-empty__reset" onClick={() => setTripListFilter("all")}>
                      Show all journeys
                    </button>
                  </div>
                ) : (
                  <div className="trip-feature-grid" role="list" aria-label="Your journeys">
                    {filteredTrips.map((t, index) => (
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
                )}
              </>
            ) : null}
          </div>
          </div>
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
