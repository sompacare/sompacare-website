import { Suspense } from "react";
import AdminLoginPage from "./AdminLoginClient";

export default function Page() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center text-sm text-brand-slate">Loading...</div>}>
      <AdminLoginPage />
    </Suspense>
  );
}
