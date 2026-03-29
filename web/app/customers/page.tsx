"use client";

import { useEffect, useState } from "react";
import LoginPage from "@/components/LoginPage";
import CustomersHub from "@/components/CustomersHub";
import { getAuthToken } from "@/lib/auth";

export default function CustomersPage() {
  const [ready, setReady] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(getAuthToken()));
    setReady(true);
  }, []);

  if (!ready) {
    return <main className="p-6 text-sm text-zinc-500">Loading...</main>;
  }

  if (!loggedIn) {
    return <LoginPage onLoginSuccess={() => setLoggedIn(true)} />;
  }

  return <CustomersHub />;
}
