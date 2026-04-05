"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { apiJson, errorMessageFromUnknown } from "@/lib/api";
import { parseVoiceLine, type ParsedLine } from "@/lib/parseVoice";
import AppNavbar from "@/components/AppNavbar";

type Product = { _id: string; name: string; unit: string; ratePerUnit: number };
type Customer = { _id: string; name: string; phone: string; balance: number };
type TxLine = { productName: string; quantity: number; lineTotal: number };
type CustomerTx = { _id: string; createdAt: string; total: number; items: TxLine[] };
type DetailsResponse = { customer: Customer; transactions: CustomerTx[] };
type CartLine = ParsedLine & { key: string };

function newKey() {
  return `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  start: () => void;
  onstart: (() => void) | null;
  onerror: ((ev: { error?: string }) => void) | null;
  onend: (() => void) | null;
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string } }> }) => void) | null;
};

const WORD_ALIASES = new Map<string, string>([
  ["आटा", "aata"],
  ["चीनी", "chini"],
  ["चावल", "chawal"],
  ["तेल", "tel"],
  ["नमक", "namak"],
  ["दाल", "dal"],
  ["मसूर", "masoor"],
  ["साबुन", "sabun"],
  ["किलो", ""],
  ["ग्राम", ""],
  ["लीटर", ""],
  ["पीस", ""],
  ["नग", ""],
]);

function normalizeName(input: string) {
  return input
    .toLowerCase()
    .replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((w) => (WORD_ALIASES.has(w) ? WORD_ALIASES.get(w)! : w))
    .filter(Boolean)
    .join(" ")
    .trim();
}

function findProductMatch(products: Product[], rawName: string) {
  const q = normalizeName(rawName);
  if (!q) return null;
  let best: Product | null = null;
  let bestScore = 0;
  for (const p of products) {
    const n = normalizeName(p.name);
    let score = 0;
    if (n === q) score = 100;
    else if (n.includes(q) || q.includes(n)) score = 80;
    else {
      const qt = new Set(q.split(/[^\p{L}\p{N}]+/u).filter(Boolean));
      const nt = new Set(n.split(/[^\p{L}\p{N}]+/u).filter(Boolean));
      let overlap = 0;
      for (const t of qt) {
        if (nt.has(t)) overlap++;
      }
      score = overlap * 15;
    }
    if (score > bestScore) {
      bestScore = score;
      best = p;
    }
  }
  return bestScore >= 15 ? best : null;
}

function toProductUnitQuantity(quantity: number, inputUnit: string, productUnit: string) {
  const normalizeUnit = (u: string) => {
    const raw = String(u || "").toLowerCase().trim();
    const cleaned = raw.replace(/\d+(\.\d+)?/g, "").replace(/\s+/g, " ").trim();
    if (/^(kilo|kg|kilogram|किलो)$/.test(cleaned)) return "kg";
    if (/^(gram|gm|g|ग्राम)$/.test(cleaned)) return "g";
    if (/^(liter|litre|ltr|लीटर)$/.test(cleaned)) return "liter";
    if (/^(ml)$/.test(cleaned)) return "ml";
    if (/^(pcs|piece|pieces|पीस|नग)$/.test(cleaned)) return "pcs";
    return cleaned;
  };

  const inUnit = normalizeUnit(inputUnit);
  const outUnit = normalizeUnit(productUnit);
  if (!inUnit || !outUnit || inUnit === outUnit) return quantity;
  if (inUnit === "g" && outUnit === "kg") return quantity / 1000;
  if (inUnit === "kg" && outUnit === "g") return quantity * 1000;
  if (inUnit === "ml" && outUnit === "liter") return quantity / 1000;
  if (inUnit === "liter" && outUnit === "ml") return quantity * 1000;
  return null;
}

function parseMultipleLines(input: string): ParsedLine[] {
  const parts = input
    .split(/\r?\n|[,;]+|\s+aur\s+/gi)
    .map((x) => x.trim())
    .filter(Boolean);

  const parsed = parts
    .map((part) => parseVoiceLine(part))
    .filter((x): x is ParsedLine => Boolean(x));

  return parsed;
}

export default function CustomerWorkspace({ customerId }: { customerId: string }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [transactions, setTransactions] = useState<CustomerTx[]>([]);
  const [cart, setCart] = useState<CartLine[]>([]);
  const [voiceText, setVoiceText] = useState("");
  const [listening, setListening] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messageText, setMessageText] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const load = useCallback(async () => {
    setError(null);
    const [productList, details] = await Promise.all([
      apiJson<Product[]>("/api/products"),
      apiJson<DetailsResponse>(`/api/customers/${customerId}/details`),
    ]);
    setProducts(productList);
    setCustomer(details.customer);
    setTransactions(details.transactions);
  }, [customerId]);

  useEffect(() => {
    load().catch((e: unknown) => setError(errorMessageFromUnknown(e)));
  }, [load]);

  useEffect(() => {
    const latestTx = transactions[0];
    const lines = latestTx?.items?.length
      ? latestTx.items
          .map((i) => `• ${i.productName} × ${i.quantity} — ₹${i.lineTotal.toFixed(2)}`)
          .join("\n")
      : "— No line items on the latest bill.";
    const draft = `Hello ${customer?.name || "Customer"},

Thank you for your business. Below is a summary of your latest bill.

Line items:
${lines}

Bill total (this transaction): ₹${latestTx ? latestTx.total.toFixed(2) : "0.00"}
Outstanding account balance: ₹${(customer?.balance || 0).toFixed(2)}

Please arrange payment at your earliest convenience. If you have any questions about this statement, reply to this message and we will be happy to assist.

Thank you,
Shopkeeper`;
    setMessageText(draft);
  }, [customer?.name, customer?.balance, transactions]);

  const startVoice = () => {
    const w = window as Window & {
      SpeechRecognition?: new () => SpeechRecognitionLike;
      webkitSpeechRecognition?: new () => SpeechRecognitionLike;
    };
    const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
    if (!SR) {
      setError("Is browser me voice support available nahi hai.");
      return;
    }
    const rec = new SR();
    rec.lang = "hi-IN";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onstart = () => setListening(true);
    rec.onend = () => setListening(false);
    rec.onerror = () => {
      setListening(false);
      setError("Voice read nahi ho paaya. Mic permission check karein.");
    };
    rec.onresult = (ev) => {
      const text = ev.results[0][0].transcript;
      setVoiceText(text);
      const parsedList = parseMultipleLines(text);
      if (!parsedList.length) {
        setError('Try karein: "2 kilo aata, 1 kilo chini"');
        return;
      }
      setCart((prev) => [
        ...prev,
        ...parsedList.map((item) => ({ ...item, key: newKey() })),
      ]);
      setError(null);
    };
    rec.start();
  };

  const addManual = () => {
    const parsedList = parseMultipleLines(voiceText);
    if (!parsedList.length) {
      setError('Sahi format de: "2 kilo aata, 1 kilo chini"');
      return;
    }
    setCart((prev) => [
      ...prev,
      ...parsedList.map((item) => ({ ...item, key: newKey() })),
    ]);
    setVoiceText("");
    setError(null);
  };

  const removeLine = (key: string) => {
    setCart((prev) => prev.filter((x) => x.key !== key));
  };

  const estimatedTotal = useMemo(() => {
    return cart.reduce((sum, line) => {
      const match = findProductMatch(products, line.itemName);
      if (!match) return sum;
      const billingQty = toProductUnitQuantity(line.quantity, line.unit, match.unit);
      if (billingQty == null) return sum;
      return sum + billingQty * match.ratePerUnit;
    }, 0);
  }, [cart, products]);
  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const created = new Date(tx.createdAt);
      if (fromDate) {
        const from = new Date(`${fromDate}T00:00:00`);
        if (created < from) return false;
      }
      if (toDate) {
        const to = new Date(`${toDate}T23:59:59`);
        if (created > to) return false;
      }
      return true;
    });
  }, [transactions, fromDate, toDate]);

  const saveSale = async () => {
    if (!cart.length) return;
    setBusy(true);
    setError(null);
    try {
      await apiJson("/api/transactions", {
        method: "POST",
        body: JSON.stringify({
          customerId,
          items: cart.map((c) => ({
            productName: c.itemName,
            quantity: c.quantity,
            unit: c.unit,
          })),
        }),
      });
      setCart([]);
      await load();
    } catch (e: unknown) {
      setError(errorMessageFromUnknown(e));
    } finally {
      setBusy(false);
    }
  };

  const hasPhone = Boolean(customer?.phone?.trim());
  const normalizedPhone = (customer?.phone || "").replace(/[^\d]/g, "");
  const phoneForLinks =
    normalizedPhone.length === 10 ? `91${normalizedPhone}` : normalizedPhone;

  const sendWhatsApp = () => {
    if (!hasPhone || !phoneForLinks) {
      setError("Customer phone number required for WhatsApp.");
      return;
    }
    const url = `https://wa.me/${phoneForLinks}?text=${encodeURIComponent(messageText)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const sendSms = () => {
    if (!hasPhone || !phoneForLinks) {
      setError("Customer phone number required for SMS.");
      return;
    }
    const url = `sms:${phoneForLinks}?body=${encodeURIComponent(messageText)}`;
    window.open(url, "_self");
  };

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(messageText);
      setError(null);
    } catch {
      setError("Message copy nahi ho paaya.");
    }
  };

  const inputLineClass =
    "min-w-0 flex-1 rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground";

  return (
    <main className="min-h-screen bg-gradient-to-b from-muted/90 to-background px-4 py-6">
      <AppNavbar />
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link href="/customers" className="text-sm text-primary hover:underline">
              ← Back to customer list
            </Link>
            <h1 className="mt-1 text-2xl font-semibold text-foreground">
              {customer?.name || "Customer"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {customer?.phone || "No phone"} • Balance: ₹{(customer?.balance || 0).toFixed(2)}
            </p>
          </div>
          <div className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xs text-muted-foreground">Current entry total</p>
            <p className="text-xl font-semibold text-foreground">₹{estimatedTotal.toFixed(2)}</p>
          </div>
        </div>

        {error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800 dark:border-red-900/60 dark:bg-red-950/40 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <div className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
          <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="text-base font-semibold text-foreground">Add Items</h2>
            <div className="mt-4 flex flex-col gap-2 md:flex-row">
              <button
                type="button"
                className={`rounded-lg px-4 py-2.5 text-sm font-medium text-white ${listening ? "bg-red-600" : "bg-emerald-600 hover:bg-emerald-500"}`}
                onClick={startVoice}
                disabled={listening}
              >
                {listening ? "Listening..." : "Start Mic"}
              </button>
              <input
                className={inputLineClass}
                placeholder='Example: "2 kilo aata, 1 kilo chini"'
                value={voiceText}
                onChange={(e) => setVoiceText(e.target.value)}
              />
              <button
                type="button"
                className="rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-foreground hover:bg-muted/80"
                onClick={addManual}
              >
                Add
              </button>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Multiple items ek saath add karne ke liye comma, new line, ya{" "}
              <span className="font-medium">&quot;aur&quot;</span> use karein.
            </p>

            {cart.length ? (
              <ul className="mt-4 space-y-2">
                {cart.map((line) => {
                  const match = findProductMatch(products, line.itemName);
                  const unitRate = match?.ratePerUnit ?? 0;
                  const billingQty =
                    match != null
                      ? toProductUnitQuantity(line.quantity, line.unit, match.unit)
                      : null;
                  const lineTotal = billingQty != null ? unitRate * billingQty : 0;
                  return (
                    <li key={line.key} className="flex items-center justify-between rounded-lg border border-border bg-muted px-3 py-2 text-sm">
                      <span>
                        {line.itemName} × {line.quantity} {line.unit}
                        {match ? (
                          <span className="ml-2 text-xs text-muted-foreground">
                            {billingQty == null
                              ? `(cannot convert ${line.unit} to ${match.unit})`
                              : `@ ₹${unitRate}/${match.unit} = ₹${lineTotal.toFixed(2)}`}
                          </span>
                        ) : (
                          <span className="ml-2 text-xs text-amber-600">
                            (price not matched)
                          </span>
                        )}
                      </span>
                      <button
                        className="text-xs text-red-600 hover:underline"
                        type="button"
                        onClick={() => removeLine(line.key)}
                      >
                        Remove
                      </button>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p className="mt-4 text-sm text-muted-foreground">No line added yet.</p>
            )}

            <button
              type="button"
              className="mt-4 rounded-lg bg-primary px-6 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              disabled={busy || !cart.length}
              onClick={saveSale}
            >
              {busy ? "Saving..." : "Save Sale"}
            </button>
          </section>

          <div className="space-y-6">
            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">Send Bill Message</h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Send the same professional message via WhatsApp or SMS. You can edit the text below before sending.
              </p>
              <textarea
                className="mt-3 min-h-44 w-full rounded-lg border border-input bg-card px-3 py-2.5 text-sm text-foreground"
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-lg bg-green-600 px-3 py-2 text-sm font-medium text-white hover:bg-green-500"
                  onClick={sendWhatsApp}
                  disabled={!hasPhone}
                >
                  Send WhatsApp
                </button>
                <button
                  type="button"
                  className="rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                  onClick={sendSms}
                  disabled={!hasPhone}
                >
                  Send SMS
                </button>
                <button
                  type="button"
                  className="rounded-lg border border-border bg-muted px-3 py-2 text-sm text-foreground hover:bg-muted/80"
                  onClick={copyMessage}
                >
                  Copy Text
                </button>
              </div>
              {!hasPhone ? (
                <p className="mt-2 text-xs text-amber-600">
                  Customer phone add karein tabhi message bhej paoge.
                </p>
              ) : null}
            </section>

            <section className="rounded-2xl border border-border bg-card p-5 shadow-sm">
              <h2 className="text-base font-semibold text-foreground">Recent Transactions</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="text-xs text-muted-foreground">
                  From date
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-input bg-card px-2 py-2 text-sm text-foreground"
                    value={fromDate}
                    onChange={(e) => setFromDate(e.target.value)}
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  To date
                  <input
                    type="date"
                    className="mt-1 w-full rounded-lg border border-input bg-card px-2 py-2 text-sm text-foreground"
                    value={toDate}
                    onChange={(e) => setToDate(e.target.value)}
                  />
                </label>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <button
                  type="button"
                  className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs hover:bg-muted/80"
                  onClick={() => {
                    const today = new Date().toISOString().slice(0, 10);
                    setFromDate(today);
                    setToDate(today);
                  }}
                >
                  Today
                </button>
                <button
                  type="button"
                  className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs hover:bg-muted/80"
                  onClick={() => {
                    const now = new Date();
                    const first = new Date(now.getFullYear(), now.getMonth(), 1)
                      .toISOString()
                      .slice(0, 10);
                    const last = new Date().toISOString().slice(0, 10);
                    setFromDate(first);
                    setToDate(last);
                  }}
                >
                  This Month
                </button>
                <button
                  type="button"
                  className="rounded-md border border-border bg-muted px-2.5 py-1 text-xs hover:bg-muted/80"
                  onClick={() => {
                    setFromDate("");
                    setToDate("");
                  }}
                >
                  Clear
                </button>
              </div>
              {filteredTransactions.length ? (
                <div className="mt-3 space-y-2">
                  {filteredTransactions.map((tx) => (
                    <div key={tx._id} className="rounded-lg border border-border bg-muted px-3 py-2">
                      <div className="flex items-center justify-between text-sm text-foreground">
                        <span>{new Date(tx.createdAt).toLocaleString()}</span>
                        <span className="font-semibold">₹{tx.total.toFixed(2)}</span>
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {tx.items.map((i) => `${i.productName} x ${i.quantity}`).join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="mt-3 text-sm text-muted-foreground">No transactions found for selected date range.</p>
              )}
            </section>
          </div>
        </div>
      </div>
    </main>
  );
}
