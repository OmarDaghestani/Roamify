import { Router } from "express";
import { z } from "zod";
import { authRequired, loadUser } from "../middleware/auth.js";

const router = Router();

router.use(authRequired, loadUser);

router.get("/", (req, res) => {
  res.json({
    id: req.user._id,
    email: req.user.email,
    settings: req.user.settings,
  });
});

const patchSchema = z.object({
  settings: z
    .object({
      homeCurrency: z.string().length(3).optional(),
      defaultTripBudget: z.number().positive().max(1_000_000).optional(),
    })
    .optional(),
});

router.patch("/", async (req, res) => {
  const parsed = patchSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

  const { settings } = parsed.data;
  if (settings?.homeCurrency) req.user.settings.homeCurrency = settings.homeCurrency.toUpperCase();
  if (settings?.defaultTripBudget != null) req.user.settings.defaultTripBudget = settings.defaultTripBudget;
  await req.user.save();

  res.json({
    id: req.user._id,
    email: req.user.email,
    settings: req.user.settings,
  });
});

export default router;
