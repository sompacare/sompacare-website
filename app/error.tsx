"use client";

import Link from "next/link";
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
      <p className="text-xs font-bold tracking-[0.15em] text-brand-blue uppercase">Something went wrong</p>
      <h1 className="mt-4 text-3xl font-bold text-brand-navy">We hit an unexpected error</h1>
      <p className="mt-3 max-w-md text-sm text-brand-slate">
        Please try again. If the problem continues, restart the dev server with{" "}
        <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">npm run dev</code>.
      </p>
      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={reset}
          className="rounded-full bg-brand-blue px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-brand-blue-dark"
        >
          Try Again
        </button>
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-full border-2 border-brand-blue/20 bg-white px-8 py-3.5 text-sm font-semibold text-brand-blue transition hover:bg-brand-blue/5"
        >
          Back to Home
        </Link>
      </div>
    </div>
  );
}
