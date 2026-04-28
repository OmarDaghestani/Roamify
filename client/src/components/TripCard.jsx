import React, { useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api.js";
import ConfirmModal from "./ConfirmModal.jsx";
import { itineraryProgressPercent, STATUS_LABELS } from "../lib/tripProgress.js";

export default function TripCard({ trip, index = 0, onDeleted, onDeleteError, onTripUpdated }) {
  const status = trip.status || "planning";
  const label = STATUS_LABELS[status] || STATUS_LABELS.planning;
  const pct = itineraryProgressPercent(trip, trip.messageCount);
  const img = trip.coverImageUrl || "";
  const budget = trip.constraints?.maxTotalBudget;
  const cur = trip.constraints?.currency || "USD";
  const canDelete = status === "planning";
  const canArchive = status !== "archived";
  const [deleting, setDeleting] = useState(false);
  const [archiving, setArchiving] = useState(false);
  const [confirm, setConfirm] = useState(null);

  async function handleDeleteConfirm() {
    if (!canDelete || deleting) return;
    setDeleting(true);
    onDeleteError?.("");
    try {
      await api(`/api/trips/${trip._id}`, { method: "DELETE" });
      setDeleting(false);
      onDeleted?.(trip._id);
    } catch (e) {
      onDeleteError?.(e.data?.error || e.message || "Delete failed");
      setDeleting(false);
      throw e;
    }
  }

  async function handleArchiveConfirm() {
    if (!canArchive || archiving) return;
    setArchiving(true);
    onDeleteError?.("");
    try {
      const updated = await api(`/api/trips/${trip._id}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "archived" }),
      });
      onTripUpdated?.(updated);
    } catch (e) {
      onDeleteError?.(e.data?.error || e.message || "Archive failed");
      throw e;
    } finally {
      setArchiving(false);
    }
  }

  const editorialClass = `trip-feature-card-wrapper trip-feature-card-wrapper--${index % 5}`;

  return (
    <div className={editorialClass} role="listitem">
      <Link to={`/trips/${trip._id}`} className="trip-feature-card">
        <div className="trip-feature-media">
          <div className="trip-feature-media-fallback" aria-hidden />
          {img ? (
            <img src={img} alt="" className="trip-feature-img" loading="lazy" decoding="async" />
          ) : null}
          <span className={`trip-status-badge trip-status-badge--${status}`}>{label}</span>
        </div>
        <div className="trip-feature-body">
          <h3 className="trip-feature-title">{trip.title || "Untitled journey"}</h3>
          <p className="trip-feature-meta">
            {budget != null ? (
              <>
                <span className="trip-feature-budget">
                  {budget.toLocaleString()} {cur}
                </span>
                <span className="trip-feature-dot">·</span>
              </>
            ) : null}
            {trip.constraints?.origin ? <span>From {trip.constraints.origin}</span> : <span>Origin TBD</span>}
          </p>
          <div className="trip-progress" role="img" aria-label={`Planning progress about ${pct} percent`}>
            <div className="trip-progress-track">
              <div className="trip-progress-fill" style={{ width: `${pct}%` }} />
            </div>
            <span className="trip-progress-label">Itinerary progress</span>
            <span className="trip-progress-pct">{pct}%</span>
          </div>
        </div>
      </Link>
      <div className="trip-card-actions">
        {canArchive ? (
          <button
            type="button"
            className="trip-card-archive"
            onClick={() => setConfirm("archive")}
            aria-label={`Archive ${trip.title || "journey"}`}
          >
            Archive
          </button>
        ) : null}
        {canDelete ? (
          <button
            type="button"
            className="trip-card-delete"
            onClick={() => setConfirm("delete")}
            disabled={deleting}
            aria-label={`Delete ${trip.title || "journey"}`}
          >
            {deleting ? "…" : "Delete"}
          </button>
        ) : null}
      </div>

      <ConfirmModal
        open={confirm === "delete"}
        title="Delete this journey?"
        description="Messages and suggestions will be removed. Only planning journeys can be deleted—archive instead if you want to keep history off your board."
        confirmLabel="Delete"
        variant="danger"
        confirmBusy={deleting}
        onClose={() => setConfirm(null)}
        onConfirm={handleDeleteConfirm}
      />
      <ConfirmModal
        open={confirm === "archive"}
        title="Archive this journey?"
        description="Planner chat becomes read-only until you open the trip and restore it."
        confirmLabel="Archive"
        confirmBusy={archiving}
        onClose={() => setConfirm(null)}
        onConfirm={handleArchiveConfirm}
      />
    </div>
  );
}
