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

/** Matches `server/src/routes/me.js` patch schema (theme only from Settings UI). */
export function validateSettings({ dashboardTheme }) {
  const errors = [];
  if (dashboardTheme && !["cinematic-night", "sunlit-editorial"].includes(dashboardTheme)) {
    errors.push("Theme must be Cinematic Night or Sunlit Editorial.");
  }
  return { ok: errors.length === 0, errors };
}

/** Journey title for PATCH (`server/src/routes/trips.js` title max 120). */
export function validateTripTitle(title) {
  const errors = [];
  const t = (title ?? "").trim();
  if (!t.length) errors.push("Journey title is required.");
  else if (t.length > 120) errors.push("Title must be at most 120 characters.");
  return { ok: errors.length === 0, errors };
}

/** New journey modal — title length + full constraints (`server/src/routes/trips.js`). */
export function validateNewJourneyModal(fields) {
  const errors = [];
  const t = (fields.title ?? "").trim();
  if (t.length > 120) errors.push("Title must be at most 120 characters.");

  const partyRaw = fields.partySize;
  const partyNum =
    partyRaw === "" || partyRaw === undefined || partyRaw === null ? 1 : Number(partyRaw);

  const tc = validateTripConstraints({
    origin: fields.origin ?? "",
    startDate: fields.startDate ?? "",
    endDate: fields.endDate ?? "",
    maxTotalBudget: Number(fields.maxTotalBudget),
    currency: fields.currency,
    partySize: partyNum,
  });
  if (!tc.ok) errors.push(...tc.errors);

  return { ok: errors.length === 0, errors };
}
