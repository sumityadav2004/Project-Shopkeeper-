import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    unit: { type: String, default: "kg" },
    ratePerUnit: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

productSchema.index({ name: 1 });

export default mongoose.models.Product || mongoose.model("Product", productSchema);
