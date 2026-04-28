import dotenv from "dotenv";

dotenv.config();

/** Extra allowed browser origins (comma-separated), e.g. https://your-app.vercel.app */
function parseCorsOrigins(raw) {
  if (!raw || typeof raw !== "string") return [];
  return raw
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .map((s) => {
      if (!s) return "";
      try {
        return new URL(s).origin;
      } catch {
        return s.replace(/\/+$/, "");
      }
    })
    .filter(Boolean);
}

function envBool(v) {
  return /^(1|true|yes)$/i.test(String(v ?? "").trim());
}

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/roamify",
  corsOrigins: parseCorsOrigins(process.env.CORS_ORIGINS),
  /** When true, allow any https origin whose host ends with `.vercel.app` (preview + production deploys). */
  corsAllowVercelSubdomains: envBool(process.env.CORS_ALLOW_VERCEL_SUBDOMAINS),
  jwtSecret: process.env.JWT_SECRET || "dev-only-change-me",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiBaseUrl: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
};
