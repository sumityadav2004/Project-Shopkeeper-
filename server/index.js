import "dotenv/config";
import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import authRoutes from "./routes/auth.js";
import productRoutes from "./routes/products.js";
import customerRoutes from "./routes/customers.js";
import transactionRoutes from "./routes/transactions.js";
import reminderRoutes from "./routes/reminders.js";
import { authMiddleware } from "./auth.js";
import { MongoMemoryServer } from "mongodb-memory-server";
import { seedProductsIfEmpty } from "./seed.js";
import { ensureInitialAdminUser } from "./seedUsers.js";
import { startScheduler } from "./scheduler.js";

const PORT = Number(process.env.PORT) || 4000;

async function resolveMongoUri() {
  const raw = process.env.MONGODB_URI;
  if (!raw) {
    console.error("Missing MONGODB_URI (server/.env). Use `memory` for local demo.");
    process.exit(1);
  }
  if (raw === "memory") {
    const mongo = await MongoMemoryServer.create();
    const uri = mongo.getUri();
    console.log(
      "In-memory MongoDB (MONGODB_URI=memory). Data clears when server stops."
    );
    return uri;
  }
  return raw;
}

const app = express();
app.use(
  cors({
    origin: (origin, callback) => {
      const raw = process.env.CORS_ORIGIN?.trim();
      if (raw) {
        const allowed = raw.split(",").map((s) => s.trim());
        if (!origin || allowed.includes(origin)) return callback(null, true);
        return callback(new Error("Not allowed by CORS"));
      }
      // Dev: allow any localhost / 127.0.0.1 port (Next picks 3001+ if 3000 busy)
      if (!origin) return callback(null, true);
      if (/^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin)) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
  })
);
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

app.use("/api/auth", authRoutes);
app.use("/api", authMiddleware);
app.use("/api/products", productRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/transactions", transactionRoutes);
app.use("/api/reminders", reminderRoutes);

async function main() {
  const mongoUri = await resolveMongoUri();
  await mongoose.connect(mongoUri, {
    serverSelectionTimeoutMS: 8000,
  });
  console.log("MongoDB connected.");
  await ensureInitialAdminUser();
  await seedProductsIfEmpty();
  startScheduler();

  app.listen(PORT, () => {
    console.log(`API listening on http://localhost:${PORT}`);
  });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
