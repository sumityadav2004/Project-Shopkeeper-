"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson, errorMessageFromUnknown } from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";

type Product = { _id: string; name: string; unit: string; ratePerUnit: number };
type Customer = { _id: string; name: string; phone: string; balance: number };

export default function ShopkeeperDashboard() {
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    const [p, c] = await Promise.all([
      apiJson<Product[]>("/api/products"),
      apiJson<Customer[]>("/api/customers"),
    ]);
    setProducts(p);
    setCustomers(c);
  }, []);

  useEffect(() => {
    load().catch((e: unknown) => setError(errorMessageFromUnknown(e)));
  }, [load]);

  const totalOutstanding = useMemo(
    () => customers.reduce((sum, c) => sum + c.balance, 0),
    [customers]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-muted/90 via-muted/50 to-background">
      <AppNavbar />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <header className="rounded-2xl border border-border bg-card/90 p-5 shadow-sm backdrop-blur">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-primary">
                Retail Dashboard
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
                Shopkeeper Digital Khata
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Voice ya text se entry karo, customer balance instantly update ho.
              </p>
            </div>
            <div className="text-sm text-muted-foreground">Welcome back</div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted px-4 py-3">
              <p className="text-xs text-muted-foreground">Active customers</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {customers.length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted px-4 py-3">
              <p className="text-xs text-muted-foreground">Products</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                {products.length}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted px-4 py-3">
              <p className="text-xs text-muted-foreground">Total outstanding</p>
              <p className="mt-1 text-xl font-semibold text-foreground">
                ₹{totalOutstanding.toFixed(2)}
              </p>
            </div>
          </div>
        </header>

        {error ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h2 className="text-base font-semibold text-foreground">Quick actions</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Open customers to manage accounts, or items to add products and rates.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              onClick={() => router.push("/customers")}
            >
              Customers
            </button>
            <button
              type="button"
              className="rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-500"
              onClick={() => router.push("/items")}
            >
              Items
            </button>
            <button
              type="button"
              className="rounded-lg border border-border bg-muted px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted/80"
              onClick={() => {
                const first = customers[0]?._id;
                if (first) router.push(`/customers/${first}`);
              }}
            >
              First customer
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
