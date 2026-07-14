import { NurseSignInFlow } from "@/components/auth/nurse-sign-in-flow";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <NurseSignInFlow />
    </div>
  );
}
