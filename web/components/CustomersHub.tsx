"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { apiJson, errorMessageFromUnknown } from "@/lib/api";
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
    load().catch((e: unknown) => setError(errorMessageFromUnknown(e)));
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
      setError(errorMessageFromUnknown(e));
    } finally {
      setBusy(false);
    }
  };

  const inputClass =
    "rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20";

  return (
    <main className="min-h-screen bg-gradient-to-b from-muted/90 to-background px-4 py-6">
      <AppNavbar />
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="rounded-2xl border border-border bg-card p-5 shadow-sm">
          <h1 className="text-2xl font-semibold text-foreground">Customers</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Yaha customer add, search aur view management alag page par hai.
          </p>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Add Customer</h2>
            <div className="mt-3 grid gap-2">
              <input
                className={inputClass}
                placeholder="Customer name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
              />
              <input
                className={inputClass}
                placeholder="Phone number"
                value={newPhone}
                onChange={(e) => setNewPhone(e.target.value)}
              />
              <button
                type="button"
                className="rounded-lg bg-primary px-3 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                onClick={createCustomer}
                disabled={busy || !newName.trim()}
              >
                {busy ? "Adding..." : "Add Customer"}
              </button>
            </div>
          </section>

          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Search & View</h2>
            <input
              className={`mt-3 w-full ${inputClass}`}
              placeholder="Search by name or phone"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <div className="mt-3 space-y-2">
              {filtered.map((c) => (
                <div
                  key={c._id}
                  className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2 text-sm"
                >
                  <div>
                    <p className="font-medium text-foreground">{c.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {c.phone || "No phone"} • Balance ₹{c.balance.toFixed(2)}
                    </p>
                  </div>
                  <button
                    type="button"
                    className="rounded-md bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    onClick={() => router.push(`/customers/${c._id}`)}
                  >
                    View
                  </button>
                </div>
              ))}
              {!filtered.length ? (
                <p className="text-sm text-muted-foreground">No customer found.</p>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
