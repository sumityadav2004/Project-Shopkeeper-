import { Router } from "express";
import crypto from "crypto";
import bcrypt from "bcryptjs";
import { createAuthToken } from "../auth.js";
import User from "../models/User.js";

const router = Router();
const SALT_ROUNDS = 12;
const RESET_TTL_MS = 60 * 60 * 1000; // 1 hour

function hashResetToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

function validateUsername(raw) {
  const u = String(raw || "").trim().toLowerCase();
  if (!/^[a-z0-9_]{3,32}$/.test(u)) {
    return {
      ok: false,
      message:
        "Username: 3–32 characters, lowercase letters, numbers, or underscore only.",
    };
  }
  return { ok: true, username: u };
}

function validatePassword(pw) {
  const p = String(pw || "");
  if (p.length < 8) {
    return { ok: false, message: "Password must be at least 8 characters." };
  }
  if (!/[a-zA-Z]/.test(p) || !/[0-9]/.test(p)) {
    return {
      ok: false,
      message: "Password must include at least one letter and one number.",
    };
  }
  return { ok: true, password: p };
}

function validateEmail(raw) {
  const e = String(raw || "").trim().toLowerCase();
  if (!e) return { ok: true, email: "" };
  if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) {
    return { ok: false, message: "Invalid email address." };
  }
  return { ok: true, email: e };
}

router.post("/register", async (req, res) => {
  if (process.env.DISABLE_PUBLIC_SIGNUP === "true") {
    res.status(403).json({
      message: "New sign-ups are disabled. Contact your administrator.",
    });
    return;
  }

  const u = validateUsername(req.body?.username);
  if (!u.ok) {
    res.status(400).json({ message: u.message });
    return;
  }
  const p = validatePassword(req.body?.password);
  if (!p.ok) {
    res.status(400).json({ message: p.message });
    return;
  }
  const em = validateEmail(req.body?.email);
  if (!em.ok) {
    res.status(400).json({ message: em.message });
    return;
  }

  try {
    const passwordHash = await bcrypt.hash(p.password, SALT_ROUNDS);
    await User.create({
      username: u.username,
      passwordHash,
      email: em.email,
    });
    const token = createAuthToken(u.username);
    res.status(201).json({
      token,
      user: { username: u.username },
    });
  } catch (err) {
    if (err?.code === 11000) {
      res.status(409).json({ message: "That username is already taken." });
      return;
    }
    console.error(err);
    res.status(500).json({ message: "Could not create account." });
  }
});

router.post("/login", async (req, res) => {
  const username = String(req.body?.username || "").trim().toLowerCase();
  const password = String(req.body?.password || "");

  if (!username || !password) {
    res.status(400).json({ message: "Username and password are required." });
    return;
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      res.status(401).json({ message: "Invalid username or password." });
      return;
    }
    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      res.status(401).json({ message: "Invalid username or password." });
      return;
    }
    const token = createAuthToken(user.username);
    res.json({
      token,
      user: { username: user.username },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed." });
  }
});

router.post("/forgot-password", async (req, res) => {
  const username = String(req.body?.username || "").trim().toLowerCase();
  const generic = {
    message:
      "If this username is registered, a one-time reset link was printed in the API server console (valid 1 hour).",
  };

  if (!username) {
    res.status(400).json({ message: "Username is required." });
    return;
  }

  try {
    const user = await User.findOne({ username });
    const debug = process.env.PASSWORD_RESET_DEBUG === "true";
    const frontend =
      process.env.FRONTEND_URL || "http://localhost:3000";

    if (!user) {
      res.json(generic);
      return;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const resetTokenHash = hashResetToken(rawToken);
    user.resetTokenHash = resetTokenHash;
    user.resetExpires = new Date(Date.now() + RESET_TTL_MS);
    await user.save();

    const resetUrl = `${frontend.replace(/\/$/, "")}/?reset=${encodeURIComponent(rawToken)}`;
    console.log(
      `[Shopkeeper] Password reset for "${username}" (expires in 1h)\n  ${resetUrl}`
    );

    if (debug) {
      res.json({
        ...generic,
        debugResetToken: rawToken,
        debugResetUrl: resetUrl,
      });
      return;
    }

    res.json(generic);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not process request." });
  }
});

router.post("/reset-password", async (req, res) => {
  const token = String(req.body?.token || "").trim();
  const p = validatePassword(req.body?.newPassword);

  if (!token) {
    res.status(400).json({ message: "Reset token is required." });
    return;
  }
  if (!p.ok) {
    res.status(400).json({ message: p.message });
    return;
  }

  try {
    const resetTokenHash = hashResetToken(token);
    const user = await User.findOne({
      resetTokenHash,
      resetExpires: { $gt: new Date() },
    });

    if (!user) {
      res.status(400).json({
        message: "Invalid or expired reset link. Request a new reset.",
      });
      return;
    }

    user.passwordHash = await bcrypt.hash(p.password, SALT_ROUNDS);
    user.resetTokenHash = "";
    user.resetExpires = null;
    await user.save();

    res.json({ message: "Password updated. You can sign in now." });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Could not reset password." });
  }
});

export default router;
