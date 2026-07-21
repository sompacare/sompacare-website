"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { CLINICAL_ROLE_LABELS, CLINICAL_ROLES } from "@sompacare/shared";
import { useApi } from "@/hooks/use-api";
import { formatApiError } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { EmployeeSectionNav } from "@/components/employees/employee-section-nav";
import { EmployeeProvisionResult } from "@/components/employees/employee-provision-result";

const emptyForm = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  clinicalRole: "RN",
  licenseNumber: "",
  licenseState: "",
  payRate: "",
  startDate: "",
  notes: "",
};

type CreateResult = {
  employeeNumber: string;
  signupUrl: string;
  signInUrl: string;
  clerkInvited: boolean;
  email: string;
  firstName: string;
  lastName: string;
  clinicalRole: string;
};

export default function NewEmployeePage() {
  const api = useApi();
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreateResult | null>(null);

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setResult(null);

    try {
      const res = await api.createWorkerEmployee({
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim() || undefined,
        clinicalRole: form.clinicalRole,
        licenseNumber: form.licenseNumber.trim() || undefined,
        licenseState: form.licenseState.trim().toUpperCase() || undefined,
        payRate: form.payRate.trim() || undefined,
        startDate: form.startDate || undefined,
        notes: form.notes.trim() || undefined,
      });
      setResult(res);
      setForm(emptyForm);
    } catch (err) {
      setError(formatApiError(err, "Unable to create employee."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-navy">Employees</h1>
        <p className="mt-1 text-sm text-muted">
          Create a full employee record with contact details, license info, and hire terms before
          granting nurse portal access.
        </p>
      </section>

      <EmployeeSectionNav />

      <form onSubmit={(e) => void handleSubmit(e)}>
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy">
              <UserPlus className="h-4 w-4 text-primary" />
              Employee details
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="firstName">First name</Label>
                <Input
                  id="firstName"
                  required
                  value={form.firstName}
                  onChange={(e) => updateField("firstName", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="lastName">Last name</Label>
                <Input
                  id="lastName"
                  required
                  value={form.lastName}
                  onChange={(e) => updateField("lastName", e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="email">Work email</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="clinicalRole">Clinical role</Label>
              <Select
                id="clinicalRole"
                value={form.clinicalRole}
                onChange={(e) => updateField("clinicalRole", e.target.value)}
              >
                {CLINICAL_ROLES.map((role) => (
                  <option key={role} value={role}>
                    {CLINICAL_ROLE_LABELS[role]}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="licenseNumber">License number</Label>
                <Input
                  id="licenseNumber"
                  value={form.licenseNumber}
                  onChange={(e) => updateField("licenseNumber", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="licenseState">License state</Label>
                <Input
                  id="licenseState"
                  maxLength={2}
                  value={form.licenseState}
                  onChange={(e) => updateField("licenseState", e.target.value)}
                  placeholder="MD"
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="payRate">Pay rate</Label>
                <Input
                  id="payRate"
                  value={form.payRate}
                  onChange={(e) => updateField("payRate", e.target.value)}
                  placeholder="Per facility agreement"
                />
              </div>
              <div>
                <Label htmlFor="startDate">Start date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={form.startDate}
                  onChange={(e) => updateField("startDate", e.target.value)}
                />
              </div>
            </div>

            <div>
              <Label htmlFor="notes">Internal notes</Label>
              <Textarea
                id="notes"
                value={form.notes}
                onChange={(e) => updateField("notes", e.target.value)}
                placeholder="Optional notes for HR / recruiting"
              />
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={busy} className="w-full">
              {busy ? "Creating employee…" : "Create employee & grant portal access"}
            </Button>
          </CardContent>
        </Card>
      </form>

      {result && (
        <EmployeeProvisionResult
          title="Employee created"
          subtitle={`${result.firstName} ${result.lastName}`}
          employeeNumber={result.employeeNumber}
          signupUrl={result.signupUrl}
          signInUrl={result.signInUrl}
          clerkInvited={result.clerkInvited}
        />
      )}
    </div>
  );
}
