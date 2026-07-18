import { PortalAuthShell } from "@/components/brand/portal-auth-shell";
import { ForgotPasswordFlow } from "@/components/auth/forgot-password-flow";

export default function ForgotPasswordPage() {
  return (
    <PortalAuthShell
      portalLabel="Reset Password"
      subtitle="Enter your company email and we will send a code to reset your password."
    >
      <ForgotPasswordFlow />
    </PortalAuthShell>
  );
}
