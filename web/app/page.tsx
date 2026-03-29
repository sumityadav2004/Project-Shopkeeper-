"use client";

import { useEffect, useState } from "react";
import LoginPage from "@/components/LoginPage";
import ShopkeeperDashboard from "@/components/ShopkeeperDashboard";
import { getAuthToken } from "@/lib/auth";

export default function HomePage() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setLoggedIn(Boolean(getAuthToken()));
    setReady(true);
  }, []);

  if (!ready) {
    return (
      <main className="mx-auto flex min-h-screen max-w-md items-center justify-center px-4 text-sm text-zinc-500">
        Loading...
      </main>
    );
  }

  if (!loggedIn) {
    return <LoginPage onLoginSuccess={() => setLoggedIn(true)} />;
  }

  return <ShopkeeperDashboard />;
}
