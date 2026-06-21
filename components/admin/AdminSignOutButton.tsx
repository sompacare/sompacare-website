"use client";

import { useRouter } from "next/navigation";

export function AdminSignOutButton() {
  const router = useRouter();

  async function signOut() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.push("/admin/login");
    router.refresh();
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
