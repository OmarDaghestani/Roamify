import { languageNoteForCountry } from "./languages.js";

async function geocodeCity(name, countryCode) {
  const q = countryCode ? `${name},${countryCode}` : name;
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=3&language=en&format=json`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const data = await res.json();
  const r = data.results?.[0];
  if (!r) return null;
  return { lat: r.latitude, lon: r.longitude, label: r.name, countryCode: r.country_code };
}

async function fetchWeatherSummary(lat, lon, startDate, endDate) {
  const params = new URLSearchParams({
    latitude: String(lat),
    longitude: String(lon),
    timezone: "auto",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,weathercode",
  });
  if (startDate) params.set("start_date", startDate.slice(0, 10));
  if (endDate) params.set("end_date", endDate.slice(0, 10));
  const url = `https://api.open-meteo.com/v1/forecast?${params.toString()}`;
  const res = await fetch(url);
  if (!res.ok) return "Weather unavailable.";
  const j = await res.json();
  const d = j.daily;
  if (!d?.temperature_2m_max?.length) return "Typical season conditions—check closer to travel.";
  const maxT = d.temperature_2m_max;
  const minT = d.temperature_2m_min;
  const avgMax = Math.round(maxT.reduce((a, b) => a + b, 0) / maxT.length);
  const avgMin = Math.round(minT.reduce((a, b) => a + b, 0) / minT.length);
  const rain = d.precipitation_probability_max?.length
    ? Math.max(...d.precipitation_probability_max)
    : null;
  const rainBit = rain != null ? ` Peak daily rain chance ~${rain}%.` : "";
  return `Forecast window: highs ~${avgMax}°C, lows ~${avgMin}°C.${rainBit}`;
}

async function fetchFxNote(fromCurrency, toCurrency) {
  if (!fromCurrency || !toCurrency || fromCurrency === toCurrency) {
    return "No conversion needed (same currency).";
  }
  const url = `https://api.frankfurter.app/latest?from=${encodeURIComponent(fromCurrency)}&to=${encodeURIComponent(toCurrency)}`;
  const res = await fetch(url);
  if (!res.ok) return `FX: could not load rate (${fromCurrency}→${toCurrency}).`;
  const j = await res.json();
  const rate = j.rates?.[toCurrency];
  if (!rate) return `FX: rate not available for ${toCurrency}.`;
  return `1 ${fromCurrency} ≈ ${Number(rate).toFixed(4)} ${toCurrency} (ECB via Frankfurter, indicative).`;
}

/**
 * @param {object} s - raw suggestion from model
 * @param {{ homeCurrency: string, tripCurrency: string, startDate: string, endDate: string }} ctx
 */
export async function enrichSuggestion(s, ctx) {
  const countryCode = s.countryCode || "";
  const geo = await geocodeCity(s.name, countryCode);
  let weather = "Weather: enable dates for a tighter forecast.";
  if (geo && (ctx.startDate || ctx.endDate)) {
    weather = await fetchWeatherSummary(geo.lat, geo.lon, ctx.startDate, ctx.endDate);
  } else if (geo) {
    weather = await fetchWeatherSummary(geo.lat, geo.lon, "", "");
  }
  const fxToTrip = await fetchFxNote(ctx.tripCurrency, s.currency || ctx.tripCurrency);
  const fxToHome =
    ctx.homeCurrency && (s.currency || ctx.tripCurrency) !== ctx.homeCurrency
      ? await fetchFxNote(s.currency || ctx.tripCurrency, ctx.homeCurrency)
      : null;

  return {
    name: s.name,
    country: s.country,
    countryCode: countryCode || geo?.countryCode || "",
    estCostMin: s.estCostMin,
    estCostMax: s.estCostMax,
    currency: s.currency || ctx.tripCurrency,
    rationale: s.rationale || "",
    weather,
    fxNote: [fxToTrip, fxToHome].filter(Boolean).join(" "),
    languages: languageNoteForCountry(countryCode || geo?.countryCode),
  };
}
