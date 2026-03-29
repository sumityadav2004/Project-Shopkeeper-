import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      minlength: 3,
      maxlength: 32,
      match: /^[a-z0-9_]+$/,
    },
    passwordHash: { type: String, required: true },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      default: "",
      maxlength: 254,
      // no unique: many accounts may omit email
    },
    resetTokenHash: { type: String, default: "" },
    resetExpires: { type: Date, default: null },
  },
  { timestamps: true }
);

userSchema.index({ resetTokenHash: 1, resetExpires: 1 });

export default mongoose.models.User || mongoose.model("User", userSchema);
