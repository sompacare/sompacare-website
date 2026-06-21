"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  console.error(error);

  return (
    <html lang="en">
      <body className="antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-6 text-center">
          <p className="text-xs font-bold tracking-[0.15em] text-blue-600 uppercase">Application Error</p>
          <h1 className="mt-4 text-3xl font-bold text-slate-900">Something went wrong</h1>
          <p className="mt-3 max-w-md text-sm text-slate-600">
            The site hit an unexpected error. Restart the dev server with{" "}
            <code className="rounded bg-slate-200 px-1.5 py-0.5 text-xs">npm run dev</code>{" "}
            and try again.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={reset}
              className="rounded-full bg-blue-600 px-8 py-3.5 text-sm font-semibold text-white shadow-lg transition hover:bg-blue-700"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="inline-flex items-center justify-center rounded-full border-2 border-blue-200 bg-white px-8 py-3.5 text-sm font-semibold text-blue-700 transition hover:bg-blue-50"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
