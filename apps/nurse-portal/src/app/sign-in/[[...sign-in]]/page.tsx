import { Logo } from "@/components/brand/logo";
import { ClerkSignInPanel } from "@/components/auth/clerk-sign-in-panel";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 shadow-lg">
        <div className="flex justify-center">
          <Logo />
        </div>
        <h1 className="mt-6 text-center text-2xl font-bold text-navy">Nurse Portal</h1>
        <p className="mt-2 text-center text-sm text-muted">
          Sign in with your work email and password to view shifts and manage your schedule.
        </p>
        <div className="mt-8">
          <ClerkSignInPanel />
        </div>
      </div>
    </div>
  );
}
