const TOKEN_KEY = "roamify_token";

/** Absolute API base (no trailing slash) or empty string to use same-origin / relative paths. */
export function getApiBase() {
  const raw = import.meta.env.VITE_API_URL;
  if (raw == null || String(raw).trim() === "") return "";
  return String(raw).replace(/\/$/, "");
}

export function apiUrl(path) {
  const p = path.startsWith("/") ? path : `/${path}`;
  const base = getApiBase();
  return base ? `${base}${p}` : p;
}

/**
 * Normalize image URLs for production deployments:
 * - relative paths resolve against API base (when configured)
 * - protocol-relative URLs inherit current protocol
 * - http URLs are upgraded on https pages to avoid mixed-content blocking
 */
export function resolveImageUrl(rawUrl) {
  const value = String(rawUrl ?? "").trim();
  if (!value) return "";

  if (value.startsWith("//")) {
    if (typeof window !== "undefined" && window.location?.protocol) {
      return `${window.location.protocol}${value}`;
    }
    return `https:${value}`;
  }

  if (/^https?:\/\//i.test(value)) {
    if (typeof window !== "undefined" && window.location?.protocol === "https:" && value.startsWith("http://")) {
      return `https://${value.slice("http://".length)}`;
    }
    return value;
  }

  return apiUrl(value.startsWith("/") ? value : `/${value}`);
}

export function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export async function api(path, options = {}) {
  const headers = { ...(options.headers || {}) };
  if (options.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(apiUrl(path), { ...options, headers });
  const text = await res.text();
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text || "Invalid JSON" };
  }
  if (!res.ok) {
    const err = new Error(data?.error || res.statusText);
    err.status = res.status;
    err.data = data;
    throw err;
  }
  return data;
}
