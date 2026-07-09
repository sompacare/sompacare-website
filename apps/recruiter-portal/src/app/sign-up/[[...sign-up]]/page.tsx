import { SignUp } from "@clerk/nextjs";
import { Logo } from "@/components/brand/logo";

export default function SignUpPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 flex flex-col items-center text-center">
          <Logo height={56} />
          <p className="mt-4 text-sm text-muted">Create your recruiter account</p>
        </div>
        <SignUp routing="path" path="/sign-up" signInUrl="/sign-in" />
      </div>
    </div>
  );
}
