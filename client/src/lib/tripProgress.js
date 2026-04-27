/** Heuristic “itinerary progress” for the budget-style bar (not financial truth). */
export function itineraryProgressPercent(trip, messageCount = 0) {
  let p = 10;
  const c = trip?.constraints || {};
  if (c.origin?.trim()) p += 12;
  if (c.startDate) p += 14;
  if (c.endDate) p += 10;
  p += Math.min(52, Number(messageCount) * 8);
  return Math.min(96, Math.round(p));
}

export const STATUS_LABELS = {
  planning: "Planning",
  booked: "Booked",
  dreaming: "Dreaming",
  archived: "Archived",
};
