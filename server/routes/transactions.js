import { Router } from "express";
import mongoose from "mongoose";
import Customer from "../models/Customer.js";
import Product from "../models/Product.js";
import Transaction from "../models/Transaction.js";
import { findBestProduct } from "../matchProduct.js";

const router = Router();

function toProductUnitQuantity(quantity, inputUnit, productUnit) {
  const q = Number(quantity);
  if (!Number.isFinite(q) || q <= 0) return null;

  const normalizeUnit = (u) => {
    const raw = String(u || "").toLowerCase().trim();
    const cleaned = raw.replace(/\d+(\.\d+)?/g, "").replace(/\s+/g, " ").trim();
    if (/^(kilo|kg|kilogram|किलो)$/.test(cleaned)) return "kg";
    if (/^(gram|gm|g|ग्राम)$/.test(cleaned)) return "g";
    if (/^(liter|litre|ltr|लीटर)$/.test(cleaned)) return "liter";
    if (/^(ml)$/.test(cleaned)) return "ml";
    if (/^(pcs|piece|pieces|पीस|नग)$/.test(cleaned)) return "pcs";
    return cleaned;
  };

  const inUnit = normalizeUnit(inputUnit);
  const outUnit = normalizeUnit(productUnit);
  if (!inUnit || !outUnit || inUnit === outUnit) return q;

  // Weight conversions
  if (inUnit === "g" && outUnit === "kg") return q / 1000;
  if (inUnit === "kg" && outUnit === "g") return q * 1000;

  // Volume conversions
  if (inUnit === "ml" && outUnit === "liter") return q / 1000;
  if (inUnit === "liter" && outUnit === "ml") return q * 1000;

  // Unsupported cross-unit conversion
  return null;
}

router.post("/", async (req, res) => {
  const { customerId, items } = req.body || {};
  if (!customerId || !mongoose.isValidObjectId(customerId)) {
    return res.status(400).json({ error: "valid customerId required" });
  }
  if (!Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: "items array required" });
  }

  const customer = await Customer.findById(customerId);
  if (!customer) return res.status(404).json({ error: "customer not found" });

  const products = await Product.find().lean();
  const lines = [];
  const unresolved = [];

  for (const row of items) {
    const qty = Number(row.quantity);
    const name = typeof row.productName === "string" ? row.productName : "";
    const inputUnit = String(row.unit || "").trim().toLowerCase();
    if (!name || !Number.isFinite(qty) || qty <= 0) {
      unresolved.push(row);
      continue;
    }
    const p = findBestProduct(products, name);
    if (!p) {
      unresolved.push({ ...row, reason: "no matching product" });
      continue;
    }
    const billingQty = toProductUnitQuantity(qty, inputUnit || p.unit, p.unit);
    if (!billingQty) {
      unresolved.push({ ...row, reason: "unit conversion not supported" });
      continue;
    }
    const lineTotal = Math.round(billingQty * p.ratePerUnit * 100) / 100;
    lines.push({
      productId: p._id,
      productName: p.name,
      quantity: Math.round(billingQty * 1000) / 1000,
      ratePerUnit: p.ratePerUnit,
      lineTotal,
    });
  }

  if (lines.length === 0) {
    return res.status(400).json({
      error: "no valid lines",
      unresolved,
    });
  }

  const total =
    Math.round(lines.reduce((s, l) => s + l.lineTotal, 0) * 100) / 100;

  let doc = null;
  try {
    const session = await mongoose.startSession();
    try {
      await session.withTransaction(async () => {
        const created = await Transaction.create(
          [
            {
              customerId,
              items: lines,
              total,
            },
          ],
          { session }
        );
        doc = created[0];
        await Customer.findByIdAndUpdate(
          customerId,
          { $inc: { balance: total } },
          { session }
        );
      });
    } finally {
      await session.endSession();
    }
  } catch (err) {
    const msg = String(err?.message || err || "");
    if (!msg.includes("Transaction numbers are only allowed")) {
      throw err;
    }
    // Fallback for standalone/in-memory Mongo where ACID transactions are unavailable.
    const created = await Transaction.create({
      customerId,
      items: lines,
      total,
    });
    doc = created;
    await Customer.findByIdAndUpdate(customerId, { $inc: { balance: total } });
  }
  res.status(201).json({
    transaction: doc,
    unresolved: unresolved.length ? unresolved : undefined,
  });
});

export default router;
