# Roamify (MERN, local)

Budget-aware trip planning with a chat assistant. Destinations suggested by the model are enriched with **weather** (Open-Meteo), **FX** (Frankfurter), and **language** notes.

## Prerequisites

- **Node.js 18+**
- **MongoDB** running locally, e.g. `mongodb://127.0.0.1:27017/roamify`  
  - [MongoDB Community](https://www.mongodb.com/try/download/community) or Docker:  
    `docker run -d -p 27017:27017 --name roamify-mongo mongo:7`

## Setup

From the repo root:

```bash
npm run install:all
```

Copy the server environment file and edit secrets:

```bash
cp server/.env.example server/.env
```

Optional client env (see `client/.env.example`):

```bash
cp client/.env.example client/.env
```

- **`VITE_API_URL`** — Set to your API origin (e.g. `http://localhost:5000`) when the UI is **not** served by Vite’s dev proxy (e.g. static build opened from another host). Leave unset for `npm run dev` at the repo root so `/api` is proxied to the server.

Set `JWT_SECRET` to a long random string. Optionally set `OPENAI_API_KEY` for live model responses; without it, the API uses built-in mock suggestions (enrichment still runs).

**Security note:** The MVP stores the JWT in `localStorage`, which is simple for local development but is **XSS-sensitive**. For production, prefer `httpOnly` cookies plus CSRF protection and a tight Content Security Policy.

## Run (two terminals or one)

**Option A — single command (after `npm install` at root):**

```bash
npm run dev
```

**Option B — separate processes:**

```bash
# Terminal 1
cd server && npm run dev

# Terminal 2
cd client && npm run dev
```

- **API:** http://localhost:5000/api/health  
- **App:** http://localhost:5173  

Register, open **Settings** (budget + home currency), create a **New trip**, set dates/origin if you like, then use **Planner chat**.

## Project layout

- `server/` — Express, Mongoose, JWT auth, `/api/trips/:id/messages` orchestrates AI + enrichment  
- `client/` — Vite + React + React Router  

## Notes

- Cost figures are **estimates** unless you integrate a real fares API later.  
- **Archive vs delete:** Only **planning** journeys can be **deleted**. Any non-archived journey can be **archived** from the dashboard card or trip page; archived trips are read-only in planner chat until you **restore** them.
- Planner messages load in pages (default last 100); use **Load older messages** on the trip page for long threads.
- OpenAI-compatible endpoints are supported via `OPENAI_BASE_URL` (e.g. Azure OpenAI resource URL + `/openai/deployments/...` requires different request shape; Roamify targets the standard Chat Completions URL).
