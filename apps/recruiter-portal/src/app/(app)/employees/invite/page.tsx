"use client";

import { useState } from "react";
import { Mail } from "lucide-react";
import { CLINICAL_ROLE_LABELS, CLINICAL_ROLES } from "@sompacare/shared";
import { useApi } from "@/hooks/use-api";
import { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { EmployeeSectionNav } from "@/components/employees/employee-section-nav";

type InviteResult = {
  employeeNumber: string;
  signupUrl: string;
  signInUrl: string;
  clerkInvited: boolean;
  email: string;
  firstName: string;
  lastName: string;
  clinicalRole: string;
};

export default function InviteEmployeePage() {
  const api = useApi();
  const [email, setEmail] = useState("");
  const [clinicalRole, setClinicalRole] = useState("RN");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<InviteResult | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.inviteWorkerByEmail({
        email: email.trim(),
        clinicalRole,
      });
      setResult(res);
      setEmail("");
    } catch (err) {
      setError(formatApiError(err, "Unable to send invite."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-navy">Add employee</h1>
        <p className="mt-1 text-sm text-muted">
          Enter an email to generate an employee ID and send portal access for shift pickup.
        </p>
      </section>

      <EmployeeSectionNav />

      <form onSubmit={(e) => void handleSubmit(e)}>
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy">
              <Mail className="h-4 w-4 text-primary" />
              Quick invite
            </div>
            <div>
              <Label htmlFor="email">Work email</Label>
              <Input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="clinician@email.com"
              />
            </div>
            <div>
              <Label htmlFor="clinicalRole">Clinical role</Label>
              <Select
                id="clinicalRole"
                value={clinicalRole}
                onChange={(e) => setClinicalRole(e.target.value)}
              >
                {CLINICAL_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {CLINICAL_ROLE_LABELS[role]}
                  </option>
                ))}
              </Select>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Creating access…" : "Create employee ID & send invite"}
            </Button>
          </CardContent>
        </Card>
      </form>

      {result && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="space-y-2 p-6 text-sm text-navy">
            <p className="font-semibold text-emerald-800">Employee provisioned</p>
            <p>
              <span className="font-semibold">Employee number:</span> {result.employeeNumber}
            </p>
            <p className="break-all">
              <span className="font-semibold">Sign-up link:</span> {result.signupUrl}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
