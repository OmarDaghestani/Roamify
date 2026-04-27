import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    tripId: { type: mongoose.Schema.Types.ObjectId, ref: "Trip", required: true, index: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

messageSchema.index({ tripId: 1, createdAt: 1 });

export const Message = mongoose.model("Message", messageSchema);
