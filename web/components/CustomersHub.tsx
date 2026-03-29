"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson } from "@/lib/api";
import AppNavbar from "@/components/AppNavbar";

type Customer = { _id: string; name: string; phone: string; balance: number };

export default function CustomersHub() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    const list = await apiJson<Customer[]>("/api/customers");
    setCustomers(list);
  };

  useEffect(() => {
    load().catch((e) => setError(String(e?.message || e)));
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) => `${c.name} ${c.phone}`.toLowerCase().includes(q));
  }, [customers, search]);

  const createCustomer = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const c = await apiJson<Customer>("/api/customers", {
        method: "POST",
        body: JSON.stringify({ name: newName.trim(), phone: newPhone.trim() }),
      });
      setNewName("");
      setNewPhone("");
      await load();
      router.push(`/customers/${c._id}`);
    } catch (e: unknown) {
      setError(String(e instanceof Error ? e.message : e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-b from-zinc-50 to-white px-4 py-6 dark:from-zinc-950 dark:to-zinc-900">
      <AppNavbar />
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="mt-1 text-sm text-zinc-500">
            Yaha customer add, search aur view management alag page par hai.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-semibold">Add Customer</h2>
            <div className="mt-3 grid gap-2">
              <input
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950"
                placeholder="Customer name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                className="rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950"
                placeholder="Phone number"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
              <button
                type="button"
                className="rounded-lg bg-blue-600 px-3 py-2.5 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
                onClick={createCustomer}
                disabled={busy || !newName.trim()}
              >
                {busy ? "Adding..." : "Add Customer"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
            <h2 className="text-base font-semibold">Search & View</h2>
            <input
              className="mt-3 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 dark:border-zinc-700 dark:bg-zinc-950"
              placeholder="Search by name or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="mt-3 space-y-2">
              {filtered.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                >
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-zinc-500">
                      {c.phone || "No phone"} • Balance ₹{c.balance.toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900"
                    onClick={() => router.push(`/customers/${c._id}`)}
                  >
                    View
                  </button>
                </div>
              ))}
              {!filtered.length ? (
                <p className="text-sm text-zinc-500">No customer found.</p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
