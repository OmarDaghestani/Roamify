# Travel MVP (MERN, local)

Budget-aware trip planning with a chat assistant. Destinations suggested by the model are enriched with **weather** (Open-Meteo), **FX** (Frankfurter), and **language** notes.

## Prerequisites

- **Node.js 18+**
- **MongoDB** running locally, e.g. `mongodb://127.0.0.1:27017/travel-mvp`  
  - [MongoDB Community](https://www.mongodb.com/try/download/community) or Docker:  
    `docker run -d -p 27017:27017 --name travel-mongo mongo:7`

## Setup

From the repo root (`Cap`):

```bash
npm run install:all
```

Copy the server environment file and edit secrets:

```bash
cp server/.env.example server/.env
```

Set `JWT_SECRET` to a long random string. Optionally set `OPENAI_API_KEY` for live model responses; without it, the API uses built-in mock suggestions (enrichment still runs).

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
- OpenAI-compatible endpoints are supported via `OPENAI_BASE_URL` (e.g. Azure OpenAI resource URL + `/openai/deployments/...` requires different request shape; this MVP targets the standard Chat Completions URL).
