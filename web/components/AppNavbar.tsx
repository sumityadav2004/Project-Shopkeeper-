"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import { clearAuthToken } from "@/lib/auth";

function navClass(active: boolean) {
  return active
    ? "rounded-md bg-zinc-900 px-3 py-1.5 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
    : "rounded-md px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800";
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
    <header className="sticky top-0 z-20 border-b border-zinc-200 bg-white/95 backdrop-blur dark:border-zinc-800 dark:bg-zinc-950/95">
      <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 md:px-6">
        <Link href="/" className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
          Shopkeeper
        </Link>
        <button
          type="button"
          className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 md:hidden"
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
          <button
            type="button"
            className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
            onClick={onLogout}
          >
            Logout
          </button>
        </nav>
      </div>
      {open ? (
        <div className="border-t border-zinc-200 px-4 py-3 dark:border-zinc-800 md:hidden">
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
            <button
              type="button"
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-left text-sm font-medium text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800"
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
