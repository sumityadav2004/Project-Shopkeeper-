"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { clearAuthToken } from "@/lib/auth";
import ThemeToggle from "@/components/ThemeToggle";

function navClass(active: boolean) {
  return active
    ? "rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground shadow-sm"
    : "rounded-md px-3 py-1.5 text-sm font-medium text-foreground/85 hover:bg-muted";
}

export default function AppNavbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const onLogout = () => {
    clearAuthToken();
    setOpen(false);
    router.replace("/");
  };

  const onDashboard = pathname === "/";
  const onCustomers = pathname?.startsWith("/customers");
  const onItems = pathname?.startsWith("/items");

  return (
    <header className="sticky top-0 z-20 border-b border-[color:var(--navbar-border)] bg-[var(--navbar)] backdrop-blur">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link
          href="/"
          className="text-base font-semibold text-brand-foreground"
        >
          Shopkeeper
        </Link>
        <button
          type="button"
          className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation menu"
          aria-expanded={open}
        >
          {open ? "Close" : "Menu"}
        </button>
        <nav className="hidden items-center gap-2 md:flex">
          <Link href="/" className={navClass(onDashboard)}>
            Dashboard
          </Link>
          <Link href="/customers" className={navClass(Boolean(onCustomers))}>
            Customers
          </Link>
          <Link href="/items" className={navClass(Boolean(onItems))}>
            Items
          </Link>
          <ThemeToggle />
          <button
            type="button"
            className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            onClick={onLogout}
          >
            Logout
          </button>
        </nav>
      </div>
      {open ? (
        <div className="border-t border-border px-4 py-3 md:hidden">
          <nav className="flex flex-col gap-2">
            <Link
              href="/"
              className={navClass(onDashboard)}
              onClick={() => setOpen(false)}
            >
              Dashboard
            </Link>
            <Link
              href="/customers"
              className={navClass(Boolean(onCustomers))}
              onClick={() => setOpen(false)}
            >
              Customers
            </Link>
            <Link
              href="/items"
              className={navClass(Boolean(onItems))}
              onClick={() => setOpen(false)}
            >
              Items
            </Link>
            <div className="flex gap-2 pt-1">
              <ThemeToggle />
            </div>
            <button
              type="button"
              className="rounded-md border border-border bg-muted/40 px-3 py-1.5 text-left text-sm font-medium text-foreground hover:bg-muted"
              onClick={onLogout}
            >
              Logout
            </button>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
