import { NurseSignUpFlow } from "@/components/auth/nurse-sign-up-flow";

type Props = {
  searchParams: Promise<{ email?: string; employeeNumber?: string }>;
};

export default async function SignUpPage({ searchParams }: Props) {
  const params = await searchParams;
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-10">
      <NurseSignUpFlow
        initialEmail={params.email ?? ""}
        initialEmployeeNumber={params.employeeNumber ?? ""}
      />
    </div>
  );
}
