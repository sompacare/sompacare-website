"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "sompacare_cookie_consent_v1";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(STORAGE_KEY)) setVisible(true);
    } catch {
      setVisible(true);
    }
  }, []);

  function accept() {
    try {
      localStorage.setItem(STORAGE_KEY, new Date().toISOString());
    } catch {
      // ignore
    }
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-slate-200 bg-white/95 p-4 shadow-lg backdrop-blur sm:bottom-4 sm:left-4 sm:right-auto sm:max-w-md sm:rounded-2xl sm:border"
    >
      <p className="text-sm leading-relaxed text-slate-700">
        We use essential cookies and analytics to operate our site and improve your experience. See our{" "}
        <Link href="/privacy" className="font-semibold text-brand-blue hover:underline">
          Privacy Policy
        </Link>
        .
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={accept}
          className="rounded-full bg-brand-blue px-4 py-2 text-xs font-semibold text-white hover:bg-brand-blue-dark"
        >
          Accept
        </button>
        <Link
          href="/privacy"
          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50"
        >
          Learn more
        </Link>
      </div>
    </div>
  );
}
