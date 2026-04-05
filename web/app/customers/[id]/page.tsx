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
    return <main className="p-6 text-sm text-muted-foreground">Loading...</main>;
  }

  if (!loggedIn) {
    return <LoginPage onLoginSuccess={() => router.replace(`/customers/${id}`)} />;
  }

  if (!isValidCustomerId) {
    return (
      <main className="mx-auto max-w-2xl p-6">
        <div className="rounded-xl border border-border bg-card p-5 text-sm">
          <p className="font-medium text-foreground">Invalid customer link.</p>
          <p className="mt-1 text-muted-foreground">Please select a customer from the customers page.</p>
          <Link href="/customers" className="mt-3 inline-block text-primary hover:underline">
            Go to customers
          </Link>
        </div>
      </main>
    );
  }

  return <CustomerWorkspace customerId={id} />;
}
