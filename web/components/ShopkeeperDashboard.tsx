"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson } from "@/lib/api";
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
    load().catch((e) => setError(String(e.message || e)));
  }, [load]);

  const totalOutstanding = useMemo(
    () => customers.reduce((sum, c) => sum + c.balance, 0),
    [customers]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-zinc-50 to-white dark:from-zinc-950 dark:via-zinc-950 dark:to-zinc-900">
      <AppNavbar />
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-6 md:px-6 md:py-8">
        <header className="rounded-2xl border border-zinc-200 bg-white/90 p-5 shadow-sm backdrop-blur dark:border-zinc-800 dark:bg-zinc-900/80">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-blue-600 dark:text-blue-400">
                Retail Dashboard
              </p>
              <h1 className="mt-1 text-2xl font-semibold tracking-tight text-zinc-900 dark:text-zinc-100">
                Shopkeeper Digital Khata
              </h1>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                Voice ya text se entry karo, customer balance instantly update ho.
              </p>
            </div>
            <div className="text-sm text-zinc-500">Welcome back</div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs text-zinc-500">Active customers</p>
              <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {customers.length}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs text-zinc-500">Products</p>
              <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                {products.length}
              </p>
            </div>
            <div className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-xs text-zinc-500">Total outstanding</p>
              <p className="mt-1 text-xl font-semibold text-zinc-900 dark:text-zinc-100">
                ₹{totalOutstanding.toFixed(2)}
              </p>
            </div>
          </div>
        </header>

        {error ? (
          <div
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200"
            role="alert"
          >
            {error}
          </div>
        ) : null}

        <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
            Quick actions
          </h2>
          <p className="mt-1 text-sm text-zinc-500">
            Open customers to manage accounts, or items to add products and rates.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              type="button"
              className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-500"
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
              className="rounded-lg border border-zinc-300 bg-zinc-100 px-4 py-2.5 text-sm font-medium hover:bg-zinc-200 dark:border-zinc-700 dark:bg-zinc-800"
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
