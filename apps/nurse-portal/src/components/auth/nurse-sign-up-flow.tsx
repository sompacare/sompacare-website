"use client";

import { useEffect, useState } from "react";
import { SignUp } from "@clerk/nextjs";
import { EmployeeAccessGate, storeEmployeeAccess } from "@/components/auth/employee-access-gate";
import { useApi } from "@/hooks/use-api";
import { formatApiError } from "@/lib/api";

type Props = {
  initialEmail?: string;
  initialEmployeeNumber?: string;
};

export function NurseSignUpFlow({ initialEmail = "", initialEmployeeNumber = "" }: Props) {
  const api = useApi();
  const [verified, setVerified] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [prefillBusy, setPrefillBusy] = useState(
    Boolean(initialEmail && initialEmployeeNumber)
  );
  const [prefillError, setPrefillError] = useState<string | null>(null);

  useEffect(() => {
    if (!initialEmail || !initialEmployeeNumber) return;

    let cancelled = false;
    (async () => {
      try {
        await api.verifyEmployee({
          email: initialEmail.trim(),
          employeeNumber: initialEmployeeNumber.trim(),
        });
        if (cancelled) return;
        storeEmployeeAccess(initialEmail, initialEmployeeNumber);
        setEmail(initialEmail.trim());
        setVerified(true);
      } catch (err) {
        if (!cancelled) {
          setPrefillError(formatApiError(err, "Unable to verify employee access."));
        }
      } finally {
        if (!cancelled) setPrefillBusy(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [api, initialEmail, initialEmployeeNumber]);

  if (prefillBusy) {
    return (
      <div className="w-full max-w-md text-center text-sm text-muted">
        Verifying your employee number…
      </div>
    );
  }

  if (!verified) {
    return (
      <EmployeeAccessGate
        mode="sign-up"
        initialEmail={initialEmail}
        initialEmployeeNumber={initialEmployeeNumber}
        onVerified={(nextEmail) => {
          setEmail(nextEmail);
          setVerified(true);
        }}
        externalError={prefillError}
      />
    );
  }

  return (
    <div className="w-full max-w-md">
      <SignUp
        routing="path"
        path="/sign-up"
        signInUrl="/sign-in"
        initialValues={{ emailAddress: email }}
      />
    </div>
  );
}
