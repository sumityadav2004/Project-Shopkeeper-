"use client";

import { useCallback, useEffect, useState } from "react";
import { apiJson, errorMessageFromUnknown } from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";

type Product = { _id: string; name: string; unit: string; ratePerUnit: number };

const UNIT_GROUPS: { label: string; options: { value: string; label: string }[] }[] = [
  {
    label: "Weight",
    options: [
      { value: "kg", label: "Kilogram (kg)" },
      { value: "g", label: "Gram (g)" },
      { value: "quintal", label: "Quintal" },
    ],
  },
  {
    label: "Volume",
    options: [
      { value: "liter", label: "Litre (L)" },
      { value: "ml", label: "Millilitre (ml)" },
    ],
  },
  {
    label: "Count & pack",
    options: [
      { value: "pcs", label: "Piece (pcs)" },
      { value: "dozen", label: "Dozen" },
      { value: "packet", label: "Packet" },
      { value: "box", label: "Box" },
      { value: "bag", label: "Bag" },
      { value: "bottle", label: "Bottle" },
      { value: "pair", label: "Pair" },
      { value: "meter", label: "Metre (m)" },
    ],
  },
];

const fieldClass =
  "h-10 w-full rounded-md border border-input bg-card px-3 text-sm text-foreground shadow-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";

export default function ItemsHub() {
  const [products, setProducts] = useState<Product[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [itemName, setItemName] = useState("");
  const [measureChoice, setMeasureChoice] = useState("kg");
  const [customUnit, setCustomUnit] = useState("");
  const [itemPrice, setItemPrice] = useState("");

  const load = useCallback(async () => {
    setError(null);
    const list = await apiJson<Product[]>("/api/products");
    setProducts(list);
  }, []);

  useEffect(() => {
    load().catch((e: unknown) => setError(errorMessageFromUnknown(e)));
  }, [load]);

  const resolvedUnit = () => {
    if (measureChoice === "__other__") return customUnit.trim();
    return measureChoice;
  };

  const createProduct = async () => {
    const rate = Number(itemPrice);
    const unit = resolvedUnit();
    if (!itemName.trim() || !unit || !Number.isFinite(rate) || rate < 0) {
      setError(
        measureChoice === "__other__" && !customUnit.trim()
          ? "Please enter a custom unit or pick one from the list."
          : "Please enter a valid item name, unit, and price."
      );
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiJson<Product>("/api/products", {
        method: "POST",
        body: JSON.stringify({
          name: itemName.trim(),
          unit,
          ratePerUnit: rate,
        }),
      });
      setItemName("");
      setItemPrice("");
      setMeasureChoice("kg");
      setCustomUnit("");
      await load();
    } catch (e: unknown) {
      setError(errorMessageFromUnknown(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/90 via-muted/50 to-background">
      <AppNavbar />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <header className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
          <p className="text-xs font-medium uppercase tracking-wide text-primary">
            Catalog
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
            Items &amp; pricing
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Add products and manage rates per unit. These are used when creating sales entries.
          </p>
        </header>

        {error ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <div className="flex flex-col gap-0.5 border-b border-border pb-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <h2 className="text-sm font-semibold tracking-tight text-foreground">
                  Add product
                </h2>
                <p className="mt-0.5 text-xs text-muted-foreground">
                  Name, unit, and rate — one row on desktop.
                </p>
              </div>
            </div>

            <div className="mt-4 rounded-xl border border-border bg-muted/60 p-3">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-12 lg:items-end lg:gap-3">
                <label className="block min-w-0 lg:col-span-5">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Item name
                  </span>
                  <input
                    className={fieldClass}
                    placeholder="e.g. Chini, Tel, Sabun"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                  />
                </label>
                <label className="block min-w-0 lg:col-span-4">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Unit
                  </span>
                  <select
                    className={fieldClass}
                    value={measureChoice}
                    onChange={(e) => setMeasureChoice(e.target.value)}
                  >
                    {UNIT_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((opt) => (
                          <option key={opt.value} value={opt.value}>
                            {opt.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                    <option value="__other__">Other — custom</option>
                  </select>
                </label>
                <label className="block min-w-0 sm:col-span-2 lg:col-span-2">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Rate (₹ / {resolvedUnit() || "unit"})
                  </span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className={fieldClass}
                    placeholder="0.00"
                    value={itemPrice}
                    onChange={(e) => setItemPrice(e.target.value)}
                  />
                </label>
                <div className="flex items-end sm:col-span-2 lg:col-span-1">
                  <button
                    type="button"
                    className="h-10 w-full rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-50 lg:min-w-[7.5rem]"
                    onClick={createProduct}
                    disabled={
                      busy ||
                      !itemName.trim() ||
                      !itemPrice.trim() ||
                      (measureChoice === "__other__" ? !customUnit.trim() : false)
                    }
                  >
                    {busy ? "Adding…" : "Add"}
                  </button>
                </div>
              </div>

              {measureChoice === "__other__" ? (
                <label className="mt-3 block border-t border-border pt-3">
                  <span className="mb-1 block text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
                    Custom unit
                  </span>
                  <input
                    className={`max-w-md ${fieldClass}`}
                    placeholder="e.g. 500g pack, 1 jar"
                    value={customUnit}
                    onChange={(e) => setCustomUnit(e.target.value)}
                  />
                </label>
              ) : null}
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="mb-3 text-base font-semibold text-foreground">
              Item list ({products.length})
            </h2>
            <div className="overflow-hidden rounded-xl border border-border">
              <table className="w-full text-left text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="px-3 py-2 font-medium text-foreground">Item</th>
                    <th className="px-3 py-2 font-medium text-foreground">Unit</th>
                    <th className="px-3 py-2 font-medium text-foreground">Rate</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p._id} className="border-t border-border">
                      <td className="px-3 py-2 text-foreground">{p.name}</td>
                      <td className="px-3 py-2 text-foreground">{p.unit}</td>
                      <td className="px-3 py-2 text-foreground">₹{p.ratePerUnit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!products.length ? (
              <p className="mt-3 text-sm text-muted-foreground">
                No items yet. Add your first product above.
              </p>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}
