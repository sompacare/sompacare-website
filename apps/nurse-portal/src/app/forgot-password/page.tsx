import { ForgotPasswordFlow } from "@/components/auth/forgot-password-flow";
import { NurseForgotPasswordShell } from "@/components/auth/nurse-forgot-password-shell";

export default function ForgotPasswordPage() {
  return (
    <NurseForgotPasswordShell>
      <ForgotPasswordFlow />
    </NurseForgotPasswordShell>
  );
}
