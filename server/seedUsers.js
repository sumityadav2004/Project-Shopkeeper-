import bcrypt from "bcryptjs";
import User from "./models/User.js";

const SALT_ROUNDS = 12;

/**
 * Creates the first user from AUTH_USERNAME / AUTH_PASSWORD when the users collection is empty.
 */
export async function ensureInitialAdminUser() {
  const count = await User.countDocuments();
  if (count > 0) return;

  const username = String(process.env.AUTH_USERNAME || "admin")
    .trim()
    .toLowerCase();
  const password = String(process.env.AUTH_PASSWORD || "admin123");

  if (!/^[a-z0-9_]{3,32}$/.test(username)) {
    console.warn(
      "AUTH_USERNAME must be 3–32 chars: lowercase letters, digits, underscore. Skipping default user seed."
    );
    return;
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);
  await User.create({ username, passwordHash, email: "" });
  console.log(
    `Seeded default operator: username="${username}" (set AUTH_USERNAME / AUTH_PASSWORD in server/.env).`
  );
}
