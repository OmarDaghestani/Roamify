/** Client-side checks aligned with server Zod rules (`trips`, `me` routes). */

export function validateTripConstraints(form) {
  const errors = [];
  const origin = (form.origin ?? "").trim();
  if (origin.length > 120) errors.push("Origin must be at most 120 characters.");

  const maxTotalBudget = Number(form.maxTotalBudget);
  if (!Number.isFinite(maxTotalBudget) || maxTotalBudget <= 0) {
    errors.push("Max total budget must be a positive number.");
  } else if (maxTotalBudget > 5_000_000) {
    errors.push("Max total budget cannot exceed 5,000,000.");
  }

  const cur = (form.currency ?? "").trim().toUpperCase();
  if (cur.length !== 3) errors.push("Currency must be exactly 3 letters (ISO 4217).");

  const party = Number(form.partySize);
  if (!Number.isInteger(party) || party < 1 || party > 20) {
    errors.push("Party size must be a whole number from 1 to 20.");
  }

  const sd = (form.startDate ?? "").trim();
  const ed = (form.endDate ?? "").trim();
  if (sd.length > 32 || ed.length > 32) errors.push("Date fields are too long.");

  return { ok: errors.length === 0, errors };
}

/** Matches `server/src/routes/me.js` patch schema. */
export function validateSettings({ homeCurrency, defaultTripBudget }) {
  const errors = [];
  const cur = (homeCurrency ?? "").trim().toUpperCase();
  if (cur.length !== 3) errors.push("Home currency must be exactly 3 letters (ISO 4217).");

  const b = Number(defaultTripBudget);
  if (!Number.isFinite(b) || b <= 0) errors.push("Default trip budget must be a positive number.");
  else if (b > 1_000_000) errors.push("Default trip budget cannot exceed 1,000,000.");

  return { ok: errors.length === 0, errors };
}
