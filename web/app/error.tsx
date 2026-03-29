"use client";

import { useEffect } from "react";

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
    <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-4 px-4 py-12 text-center">
      <h1 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
        Kuch galat ho gaya
      </h1>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        {error.message ||
          "Page load error. Dev server restart karke dubara try karein."}
      </p>
      <button
        type="button"
        className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
        onClick={reset}
      >
        Dobara try karein
      </button>
    </div>
  );
}
