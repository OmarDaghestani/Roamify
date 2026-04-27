import { Router } from "express";
import { z } from "zod";
import { authRequired, loadUser } from "../middleware/auth.js";
import { Trip } from "../models/Trip.js";
import { Message } from "../models/Message.js";
import { TRIP_COVER_IMAGES } from "../constants/coverImages.js";
import { generateAssistantReply } from "../services/ai.js";
import { User } from "../models/User.js";

const router = Router();
router.use(authRequired, loadUser);

const constraintsSchema = z.object({
  origin: z.string().max(120).optional(),
  startDate: z.string().max(32).optional(),
  endDate: z.string().max(32).optional(),
  maxTotalBudget: z.number().positive().max(5_000_000).optional(),
  currency: z.string().length(3).optional(),
  partySize: z.number().int().min(1).max(20).optional(),
});

const createTripSchema = z.object({
  title: z.string().max(120).optional(),
  constraints: constraintsSchema.optional(),
});

router.get("/", async (req, res) => {
  const trips = await Trip.find({ userId: req.user._id }).sort({ updatedAt: -1 }).limit(50).lean();
  const ids = trips.map((t) => t._id);
  let countByTrip = new Map();
  if (ids.length) {
    const counts = await Message.aggregate([
      { $match: { tripId: { $in: ids } } },
      { $group: { _id: "$tripId", n: { $sum: 1 } } },
    ]);
    countByTrip = new Map(counts.map((c) => [String(c._id), c.n]));
  }
  const normalized = trips.map((t) => {
    let status = t.status === "draft" ? "planning" : t.status;
    if (!["planning", "booked", "dreaming", "archived"].includes(status)) status = "planning";
    const messageCount = countByTrip.get(String(t._id)) || 0;
    const cover =
      t.coverImageUrl ||
      TRIP_COVER_IMAGES[Number.parseInt(String(t._id).slice(-6), 16) % TRIP_COVER_IMAGES.length];
    return { ...t, status, coverImageUrl: cover, messageCount };
  });
  res.json(normalized);
});

router.post("/", async (req, res) => {
  const parsed = createTripSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const defaults = req.user.settings || {};
  const c = parsed.data.constraints || {};
  const coverImageUrl =
    TRIP_COVER_IMAGES[Math.floor(Math.random() * TRIP_COVER_IMAGES.length)];
  const trip = await Trip.create({
    userId: req.user._id,
    title: parsed.data.title || "New trip",
    status: "planning",
    coverImageUrl,
    constraints: {
      origin: c.origin ?? "",
      startDate: c.startDate ?? "",
      endDate: c.endDate ?? "",
      maxTotalBudget: c.maxTotalBudget ?? defaults.defaultTripBudget ?? 2000,
      currency: (c.currency ?? defaults.homeCurrency ?? "USD").toUpperCase(),
      partySize: c.partySize ?? 1,
    },
  });
  res.status(201).json(trip);
});

router.get("/:id", async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id }).lean();
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  const reqLimit = parseInt(String(req.query.messagesLimit || "100"), 10);
  const messagesLimit = Math.min(200, Math.max(1, Number.isFinite(reqLimit) ? reqLimit : 100));
  const messagesTotal = await Message.countDocuments({ tripId: trip._id });
  const maxSkip = Math.max(0, messagesTotal - messagesLimit);
  let messagesSkip;
  if (req.query.messagesSkip !== undefined && req.query.messagesSkip !== "") {
    const p = parseInt(String(req.query.messagesSkip), 10);
    messagesSkip = Number.isFinite(p) ? Math.max(0, Math.min(maxSkip, p)) : maxSkip;
  } else {
    messagesSkip = maxSkip;
  }
  const messages = await Message.find({ tripId: trip._id })
    .sort({ createdAt: 1 })
    .skip(messagesSkip)
    .limit(messagesLimit)
    .lean();

  let status = trip.status === "draft" ? "planning" : trip.status;
  if (!["planning", "booked", "dreaming", "archived"].includes(status)) status = "planning";
  const cover =
    trip.coverImageUrl ||
    TRIP_COVER_IMAGES[Number.parseInt(String(trip._id).slice(-6), 16) % TRIP_COVER_IMAGES.length];
  res.json({
    trip: { ...trip, status, coverImageUrl: cover, messageCount: messagesTotal },
    messages,
    messagesPagination: {
      total: messagesTotal,
      skip: messagesSkip,
      limit: messagesLimit,
      returned: messages.length,
      hasOlder: messagesSkip > 0,
    },
  });
});

const patchTripSchema = z.object({
  title: z.string().max(120).optional(),
  status: z.enum(["planning", "booked", "dreaming", "archived"]).optional(),
  constraints: constraintsSchema.optional(),
});

router.patch("/:id", async (req, res) => {
  const parsed = patchTripSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  let currentStatus = trip.status === "draft" ? "planning" : trip.status;
  if (!["planning", "booked", "dreaming", "archived"].includes(currentStatus)) currentStatus = "planning";
  const restoring =
    parsed.data.status && ["planning", "booked", "dreaming"].includes(parsed.data.status);
  if (currentStatus === "archived" && parsed.data.constraints && !restoring) {
    return res.status(403).json({ error: "Restore this journey before editing constraints." });
  }

  if (parsed.data.title != null) trip.title = parsed.data.title;
  if (parsed.data.status) trip.status = parsed.data.status;
  if (parsed.data.constraints) {
    const c = parsed.data.constraints;
    if (c.origin !== undefined) trip.constraints.origin = c.origin;
    if (c.startDate !== undefined) trip.constraints.startDate = c.startDate;
    if (c.endDate !== undefined) trip.constraints.endDate = c.endDate;
    if (c.maxTotalBudget !== undefined) trip.constraints.maxTotalBudget = c.maxTotalBudget;
    if (c.currency !== undefined) trip.constraints.currency = c.currency.toUpperCase();
    if (c.partySize !== undefined) trip.constraints.partySize = c.partySize;
  }
  await trip.save();
  res.json(trip);
});

router.delete("/:id", async (req, res) => {
  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  let status = trip.status === "draft" ? "planning" : trip.status;
  if (!["planning", "booked", "dreaming", "archived"].includes(status)) status = "planning";
  if (status !== "planning") {
    return res.status(403).json({ error: "Only journeys in planning can be deleted." });
  }

  await Message.deleteMany({ tripId: trip._id });
  await trip.deleteOne();
  res.status(204).send();
});

const messageSchema = z.object({
  text: z.string().min(1).max(8000),
});

router.post("/:id/messages", async (req, res) => {
  const parsed = messageSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const trip = await Trip.findOne({ _id: req.params.id, userId: req.user._id });
  if (!trip) return res.status(404).json({ error: "Trip not found" });

  let tripStatus = trip.status === "draft" ? "planning" : trip.status;
  if (!["planning", "booked", "dreaming", "archived"].includes(tripStatus)) tripStatus = "planning";
  if (tripStatus === "archived") {
    return res.status(403).json({
      error: "This journey is archived. Restore it from the trip header to send messages.",
    });
  }

  const userDoc = await User.findById(req.user._id);
  if (!userDoc) return res.status(401).json({ error: "User not found" });

  await Message.create({
    tripId: trip._id,
    userId: req.user._id,
    role: "user",
    content: parsed.data.text,
  });

  const priorMessages = await Message.find({ tripId: trip._id }).sort({ createdAt: -1 }).limit(20);
  priorMessages.reverse();

  const { reply, suggestions } = await generateAssistantReply({
    user: userDoc,
    trip,
    userText: parsed.data.text,
    priorMessages: priorMessages.filter((m) => m.role !== "system"),
  });

  const assistantMsg = await Message.create({
    tripId: trip._id,
    userId: req.user._id,
    role: "assistant",
    content: reply,
    metadata: { suggestions },
  });

  res.json({
    reply: assistantMsg.content,
    suggestions,
    messageId: assistantMsg._id,
  });
});

export default router;
