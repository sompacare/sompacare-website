import { SignIn } from "@clerk/nextjs";
import { Logo } from "@/components/brand/logo";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo height={56} subtitle="Recruiter" />
          <p className="mt-4 text-sm text-muted">Sign in to manage your pipeline</p>
        </div>
        <SignIn routing="path" path="/sign-in" signUpUrl="/sign-up" />
      </div>
    </div>
  );
}
