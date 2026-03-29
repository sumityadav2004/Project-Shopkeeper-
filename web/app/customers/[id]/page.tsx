"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import LoginPage from "@/components/LoginPage";
import CustomerWorkspace from "@/components/CustomerWorkspace";
import { getAuthToken } from "@/lib/auth";

export default function CustomerPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const ok = Boolean(getAuthToken());
    setLoggedIn(ok);
    setReady(true);
  }, []);

  const id = params.id || "";
  const isValidCustomerId = /^[a-f\d]{24}$/i.test(id);

  if (!ready) {
    return <main className="p-6 text-sm text-zinc-500">Loading...</main>;
  }

  if (!loggedIn) {
    return <LoginPage onLoginSuccess={() => router.replace(`/customers/${id}`)} />;
  }

  if (!isValidCustomerId) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <div className="rounded-xl border border-zinc-200 bg-white p-5 text-sm dark:border-zinc-800 dark:bg-zinc-900">
          <p className="font-medium text-zinc-900 dark:text-zinc-100">Invalid customer link.</p>
          <p className="mt-1 text-zinc-500">Please select a customer from the customers page.</p>
          <Link href="/customers" className="mt-3 inline-block text-blue-600 hover:underline dark:text-blue-400">
            Go to customers
          </Link>
        </div>
      </main>
    );
  }

  return <CustomerWorkspace customerId={id} />;
}
