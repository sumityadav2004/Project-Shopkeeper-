import { Router } from "express";
import Product from "../models/Product.js";

const router = Router();

router.get("/", async (_req, res) => {
  const list = await Product.find().sort({ name: 1 }).lean();
  res.json(list);
});

router.post("/", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const unit = String(req.body?.unit || "").trim();
  const ratePerUnit = Number(req.body?.ratePerUnit);

  if (!name) {
    return res.status(400).json({ error: "name required" });
  }
  if (!unit) {
    return res.status(400).json({ error: "unit required" });
  }
  if (!Number.isFinite(ratePerUnit) || ratePerUnit < 0) {
    return res.status(400).json({ error: "valid ratePerUnit required" });
  }

  const created = await Product.create({
    name,
    unit,
    ratePerUnit,
  });
  res.status(201).json(created);
});

export default router;
