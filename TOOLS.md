# Roamify — tools and APIs

Reference for **development tooling**, **npm dependencies**, **environment configuration**, the **Roamify HTTP API**, and **third-party HTTP APIs** the server calls.

---

## Development toolchain

| Tool | Role |
|------|------|
| **Node.js** | Runtime (18+ recommended; see README). |
| **npm** | Package manager; root scripts orchestrate `server/` and `client/`. |
| **concurrently** (root devDependency) | Runs API and Vite dev servers together via `npm run dev`. |
| **MongoDB** | Primary data store; default URI `mongodb://127.0.0.1:27017/roamify`. |
| **Vite** | Client dev server (port **5173**) and production build. |
| **`node --watch`** | Server auto-restart in dev (`server` npm script). |

### Monorepo-style scripts (repo root)

- **`npm run install:all`** — installs root, `server/`, and `client/` dependencies.
- **`npm run dev`** — starts Express on **5000** and Vite on **5173** together.

### Client dev proxy

Vite proxies **`/api`** → `http://localhost:5000` (see `client/vite.config.js`). With the proxy, the browser can use relative `/api/...` paths; set **`VITE_API_URL`** when the UI is not served by Vite (e.g. static build on another origin).

---

## Server dependencies (`server/package.json`)

| Package | Use in Roamify |
|---------|----------------|
| **express** | HTTP API and JSON body parsing (`limit: 1mb`). |
| **mongoose** | MongoDB models and queries. |
| **jsonwebtoken** | JWT issuance and verification for protected routes. |
| **bcryptjs** | Password hashing at registration; compare at login. |
| **cors** | Allows `localhost:5173` / `127.0.0.1:5173` with credentials. |
| **morgan** | HTTP request logging (`dev` format). |
| **dotenv** | Loads `server/.env` via `config.js`. |
| **zod** | Request body validation on auth, user settings, trips, and messages. |

No official OpenAI SDK: chat calls use **`fetch`** to the configured base URL + `/chat/completions`.

---

## Client dependencies (`client/package.json`)

| Package | Use in Roamify |
|---------|----------------|
| **react** / **react-dom** | UI. |
| **react-router-dom** | Client-side routing. |
| **vite** / **@vitejs/plugin-react** | Bundler and React plugin. |

The client talks to the backend with **`fetch`** and a small wrapper in `client/src/api.js` (JWT from `localStorage`, optional `VITE_API_URL` base).

---

## Environment variables

### Server (`server/.env` — see `server/.env.example`)

| Variable | Purpose |
|----------|---------|
| **`PORT`** | API listen port (default **5000**). |
| **`MONGODB_URI`** | Mongo connection string. |
| **`JWT_SECRET`** | Secret for signing JWTs (required for anything beyond local dev). |
| **`OPENAI_API_KEY`** | If empty, planner uses **mock** suggestions; enrichment still runs. |
| **`OPENAI_BASE_URL`** | OpenAI-compatible API root, **no trailing slash** (default `https://api.openai.com/v1`). |
| **`OPENAI_MODEL`** | Chat model id (default `gpt-4o-mini`). |

### Client (`client/.env` — optional; see `client/.env.example`)

| Variable | Purpose |
|----------|---------|
| **`VITE_API_URL`** | Full API origin (e.g. `http://localhost:5000`) when not using Vite’s `/api` proxy. Unset in local monorepo dev for same-origin relative `/api` paths. |

---

## Roamify HTTP API (Express)

Base path: **`/api`**. JSON request/response unless noted.

### Health

| Method | Path | Auth | Description |
|--------|------|------|-------------|
| **GET** | `/api/health` | No | `{ ok: true }`. |

### Auth (`/api/auth`)

| Method | Path | Body | Description |
|--------|------|------|-------------|
| **POST** | `/api/auth/register` | `{ email, password }` (password min 8) | Creates user; returns **JWT** + user profile. |
| **POST** | `/api/auth/login` | `{ email, password }` | Returns **JWT** + user profile. |

Protected routes expect: **`Authorization: Bearer <token>`**.

### Current user (`/api/me`)

All routes require auth.

| Method | Path | Body | Description |
|--------|------|------|-------------|
| **GET** | `/api/me` | — | `{ id, email, settings }`. |
| **PATCH** | `/api/me` | `{ settings?: { homeCurrency?, defaultTripBudget? } }` | Updates user settings (ISO 4217 length-3 for currency). |

### Trips (`/api/trips`)

All routes require auth. `:id` is MongoDB trip id.

| Method | Path | Query / body | Description |
|--------|------|--------------|-------------|
| **GET** | `/api/trips` | — | Lists user’s trips (sorted by `updatedAt`, max 50) with normalized `status`, `coverImageUrl`, `messageCount`. |
| **POST** | `/api/trips` | `{ title?, constraints? }` | Creates trip; constraints default from user settings. |
| **GET** | `/api/trips/:id` | `messagesLimit` (1–200, default 100), `messagesSkip` (optional) | Trip + **paginated** messages + `messagesPagination` metadata. |
| **PATCH** | `/api/trips/:id` | `{ title?, status?, constraints? }` | Update trip; **archived** trips cannot patch constraints until restored. |
| **DELETE** | `/api/trips/:id` | — | **204** only if status is **planning**; otherwise **403**. Deletes trip messages then trip. |
| **POST** | `/api/trips/:id/messages` | `{ text }` (1–8000 chars) | Saves user message, runs assistant (AI or mock) + **enrichment**, saves assistant message; returns `{ reply, suggestions, messageId }`. **403** if trip is **archived**. |

On errors, responses are typically JSON `{ error: ... }` or Zod **`flatten()`** shapes for **400** validation failures.

---

## External HTTP APIs (server)

The server uses **`fetch`** (no extra npm packages for these).

### OpenAI-compatible chat completions

- **When:** `OPENAI_API_KEY` is set and the model call succeeds.
- **URL:** `{OPENAI_BASE_URL}/chat/completions` (see `server/src/services/ai.js`).
- **Method:** POST; **Bearer** auth; JSON body includes `model`, `messages`, `response_format: { type: "json_object" }`, `temperature`.
- **Expected JSON shape** from model: `{ reply: string, suggestions: array }` per system prompt; invalid or failed calls fall back to **built-in mock** data.

### Open-Meteo — geocoding

- **URL:** `https://geocoding-api.open-meteo.com/v1/search`  
- **Query params:** `name`, `count`, `language`, `format` (see `server/src/services/enrich.js`).
- **Use:** Resolve city + country to `latitude` / `longitude` for weather.

### Open-Meteo — weather forecast

- **URL:** `https://api.open-meteo.com/v1/forecast`  
- **Query params:** `latitude`, `longitude`, `timezone`, `daily` (temperature and precipitation fields), optional `start_date` / `end_date` aligned to trip dates.
- **Use:** Short natural-language weather summary for enriched suggestions.

### Frankfurter — exchange rates

- **URL:** `https://api.frankfurter.app/latest`  
- **Query params:** `from`, `to` (ISO 4217).
- **Use:** Indicative FX notes (ECB-sourced rates as described in copy) between trip currency, suggestion currency, and user **home** currency.

---

## Data that is not an HTTP API

- **Language notes** for destinations come from a **static map** in `server/src/services/languages.js` (ISO country code → traveler-facing string), not from a live language API.

---

## Quick port reference

| Service | Default port |
|---------|----------------|
| Roamify API | **5000** |
| Vite dev UI | **5173** |
| MongoDB | **27017** (typical local install) |

For setup steps and product behavior (archive/delete, pagination), see **`README.md`**.
