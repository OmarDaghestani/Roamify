import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    settings: {
      homeCurrency: { type: String, default: "USD", uppercase: true, trim: true },
      defaultTripBudget: { type: Number, default: 2000 },
      dashboardTheme: { type: String, enum: ["cinematic-night", "sunlit-editorial"], default: "cinematic-night" },
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);
