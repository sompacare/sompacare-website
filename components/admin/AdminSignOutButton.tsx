"use client";

import { useRouter } from "next/navigation";

export function AdminSignOutButton({ variant = "default" }: { variant?: "default" | "sidebar" }) {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
  }

  if (variant === "sidebar") {
    return (
      <button
        type="button"
        onClick={signOut}
        className="w-full rounded-lg border border-white/20 px-3 py-2 text-sm font-medium text-white/80 hover:bg-white/10"
      >
        Sign Out
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={signOut}
      className="rounded-full border border-slate-300 px-5 py-2 text-sm font-medium text-brand-navy hover:bg-white"
    >
      Sign Out
    </button>
  );
}
