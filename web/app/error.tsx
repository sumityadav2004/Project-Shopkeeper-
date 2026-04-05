"use client";

import { useEffect } from "react";

function errorMessage(error: Error & { digest?: string }) {
  if (error && typeof error.message === "string" && error.message.length > 0) {
    return error.message;
  }
  return "Page load error. Dev server restart karke dubara try karein.";
}

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-lg font-semibold text-foreground">Kuch galat ho gaya</h1>
      <p className="text-sm text-muted-foreground">{errorMessage(error)}</p>
      <button
        type="button"
        className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        onClick={() => reset()}
      >
        Dobara try karein
      </button>
    </main>
  );
}
