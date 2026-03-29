import { Router } from "express";
import Customer from "../models/Customer.js";
import mongoose from "mongoose";
import Transaction from "../models/Transaction.js";

const router = Router();

router.get("/", async (_req, res) => {
  const list = await Customer.find().sort({ name: 1 }).lean();
  res.json(list);
});

router.post("/", async (req, res) => {
  const { name, phone } = req.body || {};
  if (!name || typeof name !== "string") {
    return res.status(400).json({ error: "name required" });
  }
  const c = await Customer.create({
    name: name.trim(),
    phone: typeof phone === "string" ? phone.trim() : "",
  });
  res.status(201).json(c);
});

router.get("/:id/details", async (req, res) => {
  const { id } = req.params;
  if (!mongoose.isValidObjectId(id)) {
    return res.status(400).json({ error: "valid customer id required" });
  }

  const customer = await Customer.findById(id).lean();
  if (!customer) {
    return res.status(404).json({ error: "customer not found" });
  }

  const transactions = await Transaction.find({ customerId: id })
    .sort({ createdAt: -1 })
    .limit(30)
    .lean();

  res.json({ customer, transactions });
});

export default router;
