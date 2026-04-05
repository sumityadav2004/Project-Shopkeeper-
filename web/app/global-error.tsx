"use client";

import { useEffect } from "react";
import { THEME_INIT_SCRIPT } from "@/lib/theme-script";
import "./globals.css";

/**
 * Renders when the root layout fails. Must include its own html/body and
 * re-import global styles (replaces the root layout).
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  const message =
    error && typeof error === "object" && "message" in error && typeof error.message === "string"
      ? error.message
      : "App failed to load. Refresh the page or restart the dev server.";

  return (
    <html lang="hi" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-[#f0f7f5] px-4 py-12 text-center text-[#0c1715] antialiased dark:bg-[#0a1110] dark:text-[#e8f4f1]">
        <div className="mx-auto flex max-w-lg flex-col items-center justify-center gap-4">
          <h1 className="text-lg font-semibold">Kuch galat ho gaya</h1>
          <p className="text-sm opacity-90">{message}</p>
          <button
            type="button"
            className="rounded-lg bg-[#0d9488] px-4 py-2 text-sm font-medium text-white hover:opacity-90 dark:bg-[#14b8a6] dark:text-white"
            onClick={reset}
          >
            Dobara try karein
          </button>
        </div>
      </body>
    </html>
  );
}
