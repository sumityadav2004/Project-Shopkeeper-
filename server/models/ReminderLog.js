import mongoose from "mongoose";

const reminderLogSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ["weekly", "monthly"], required: true },
    message: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.ReminderLog || mongoose.model("ReminderLog", reminderLogSchema);
