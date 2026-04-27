import React from "react";
import { Link } from "react-router-dom";
import { itineraryProgressPercent, STATUS_LABELS } from "../lib/tripProgress.js";

export default function TripCard({ trip }) {
  const status = trip.status || "planning";
  const label = STATUS_LABELS[status] || STATUS_LABELS.planning;
  const pct = itineraryProgressPercent(trip, trip.messageCount);
  const img = trip.coverImageUrl || "";
  const budget = trip.constraints?.maxTotalBudget;
  const cur = trip.constraints?.currency || "USD";

  return (
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
  );
}
