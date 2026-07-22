"use client";

import { useEffect, useState } from "react";

type Props = {
  canonicalOrigin: string;
  children: React.ReactNode;
};

export function RedirectVercelAppSignIn({ canonicalOrigin, children }: Props) {
  const [onVercelApp, setOnVercelApp] = useState(false);

  useEffect(() => {
    const host = window.location.hostname;
    if (!host.endsWith(".vercel.app")) return;

    setOnVercelApp(true);
    const path = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    window.location.replace(`${canonicalOrigin.replace(/\/$/, "")}${path}`);
  }, [canonicalOrigin]);

  if (onVercelApp) {
    return (
      <p className="text-center text-sm text-muted" aria-live="polite">
        Redirecting to production sign-in…
      </p>
    );
  }

  return <>{children}</>;
}
