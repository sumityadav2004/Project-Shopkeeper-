import { Router } from "express";
import ReminderLog from "../models/ReminderLog.js";

const router = Router();

router.get("/", async (_req, res) => {
  const list = await ReminderLog.find().sort({ createdAt: -1 }).limit(50).lean();
  res.json(list);
});

export default router;
