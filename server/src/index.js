import express from "express";
import cors from "cors";
import morgan from "morgan";
import { config } from "./config.js";
import { connectDb } from "./db.js";
import authRoutes from "./routes/auth.js";
import meRoutes from "./routes/me.js";
import tripRoutes from "./routes/trips.js";
import { Trip } from "./models/Trip.js";

const app = express();
const defaultCorsOrigins = ["http://localhost:5173", "http://127.0.0.1:5173"];

function isHttpsVercelAppOrigin(origin) {
  if (!config.corsAllowVercelSubdomains) return false;
  try {
    const u = new URL(origin);
    if (u.protocol !== "https:") return false;
    return u.hostname === "vercel.app" || u.hostname.endsWith(".vercel.app");
  } catch {
    return false;
  }
}

app.use(
  cors({
    origin(origin, callback) {
      if (!origin) return callback(null, true);
      const normalized = origin.replace(/\/+$/, "");
      if (defaultCorsOrigins.includes(normalized)) return callback(null, true);
      if (config.corsOrigins.includes(normalized)) return callback(null, true);
      if (isHttpsVercelAppOrigin(normalized)) return callback(null, true);
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json({ limit: "1mb" }));
app.use(morgan("dev"));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api/me", meRoutes);
app.use("/api/trips", tripRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

async function migrateLegacyTrips() {
  const r = await Trip.updateMany({ status: "draft" }, { $set: { status: "planning" } });
  if (r.modifiedCount) console.log(`[db] migrated ${r.modifiedCount} trip(s) draft → planning`);
}

async function boot() {
  await connectDb();
  await migrateLegacyTrips();
  app.listen(config.port, () => {
    console.log(`API http://localhost:${config.port}`);
  });
}

boot().catch((err) => {
  console.error(err);
  process.exit(1);
});
