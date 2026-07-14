import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/brand/logo";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo height={56} subtitle="Facility" />
        <p className="mt-4 text-sm text-muted">
          Create your facility manager account — you&apos;ll set up your organization next.
        </p>
      </div>
      <SignUp forceRedirectUrl="/onboarding" signInUrl="/sign-in" />
    </div>
  );
}
