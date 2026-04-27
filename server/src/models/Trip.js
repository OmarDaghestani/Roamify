import mongoose from "mongoose";

const tripSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, default: "" },
    status: {
      type: String,
      enum: ["planning", "booked", "dreaming", "archived"],
      default: "planning",
    },
    coverImageUrl: { type: String, default: "" },
    constraints: {
      origin: { type: String, default: "" },
      startDate: { type: String, default: "" },
      endDate: { type: String, default: "" },
      maxTotalBudget: { type: Number, default: 0 },
      currency: { type: String, default: "USD", uppercase: true },
      partySize: { type: Number, default: 1, min: 1 },
    },
  },
  { timestamps: true }
);

export const Trip = mongoose.model("Trip", tripSchema);
