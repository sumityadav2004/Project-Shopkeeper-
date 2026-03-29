import Product from "./models/Product.js";

const DEFAULT_PRODUCTS = [
  { name: "Chini", unit: "kg", ratePerUnit: 45 },
  { name: "Aata", unit: "kg", ratePerUnit: 32 },
  { name: "Chawal", unit: "kg", ratePerUnit: 55 },
  { name: "Tel", unit: "liter", ratePerUnit: 180 },
  { name: "Namak", unit: "kg", ratePerUnit: 22 },
  { name: "Dal (Masoor)", unit: "kg", ratePerUnit: 120 },
  { name: "Sabun", unit: "pcs", ratePerUnit: 35 },
];

export async function seedProductsIfEmpty() {
  const count = await Product.countDocuments();
  if (count > 0) return;
  await Product.insertMany(DEFAULT_PRODUCTS);
  console.log("Seeded default products.");
}
