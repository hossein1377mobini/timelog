"use client";

import { useEffect } from "react";

interface ErrorPageProps {
  error: Error;
  reset: () => void;
}

/**
 * Next.js error boundary that catches runtime errors in the
 * app-router tree and shows a friendly fallback UI.
 */
export default function ErrorPage({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error("[app/error]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-6 text-center">
      <p className="text-[22px] font-semibold text-[hsl(var(--body-strong))]">
        Something went wrong
      </p>
      <p className="text-[14px] text-[hsl(var(--muted))] max-w-md">
        An unexpected error occurred. You can try reloading the page or
        clicking the button below.
      </p>
      <button
        onClick={reset}
        className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[hsl(var(--primary))] px-5 py-2.5 text-[13px] font-medium text-white hover:opacity-90 transition-opacity"
      >
        Try again
      </button>
    </div>
  );
}