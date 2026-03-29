import cron from "node-cron";
import ReminderLog from "./models/ReminderLog.js";

const TZ = process.env.TZ || "Asia/Kolkata";

export function startScheduler() {
  cron.schedule(
    "0 9 * * 1",
    async () => {
      const message =
        "Weekly reminder: Reports aur pending bills check karein; zarurat ho to SMS/WhatsApp bhejein.";
      console.log("[cron weekly]", new Date().toISOString(), message);
      await ReminderLog.create({ kind: "weekly", message });
    },
    { timezone: TZ }
  );

  cron.schedule(
    "0 9 1 * *",
    async () => {
      const message =
        "Monthly reminder: Final billing aur customers ko messages process karein.";
      console.log("[cron monthly]", new Date().toISOString(), message);
      await ReminderLog.create({ kind: "monthly", message });
    },
    { timezone: TZ }
  );

  console.log(
    "Scheduler: har Monday 09:00 aur har mahine 1 ko 09:00 — TZ:",
    TZ
  );
}
