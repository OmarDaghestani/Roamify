import dotenv from "dotenv";

dotenv.config();

export const config = {
  port: Number(process.env.PORT) || 5000,
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/travel-mvp",
  jwtSecret: process.env.JWT_SECRET || "dev-only-change-me",
  openaiApiKey: process.env.OPENAI_API_KEY || "",
  openaiBaseUrl: (process.env.OPENAI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, ""),
  openaiModel: process.env.OPENAI_MODEL || "gpt-4o-mini",
};
