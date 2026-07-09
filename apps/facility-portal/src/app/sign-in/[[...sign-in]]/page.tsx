import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/brand/logo";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo height={56} subtitle="Facility" />
        <p className="mt-4 text-sm text-muted">Sign in to manage shifts and staff</p>
      </div>
      <SignIn />
    </div>
  );
}
