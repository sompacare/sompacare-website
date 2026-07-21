"use client";

import { useState } from "react";
import { Mail, MapPin, Building2 } from "lucide-react";
import { useApi, formatApiError } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";

const FACILITY_TYPES = [
  { value: "skilled_nursing", label: "Skilled nursing" },
  { value: "assisted_living", label: "Assisted living" },
  { value: "hospital", label: "Hospital" },
  { value: "rehab", label: "Rehab" },
  { value: "home_health", label: "Home health" },
  { value: "clinic", label: "Clinic" },
  { value: "other", label: "Other" },
] as const;

const emptyForm = {
  email: "",
  organizationName: "",
  facilityName: "",
  facilityType: "skilled_nursing",
  locationName: "Main campus",
  addressLine1: "",
  city: "",
  state: "",
  zipCode: "",
};

export default function InviteFacilityManagerPage() {
  const api = useApi();
  const [form, setForm] = useState(emptyForm);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ onboardingUrl: string; clerkInvited: boolean } | null>(
    null
  );

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setBusy(true);
    setError(null);
    setResult(null);
    try {
      const res = await api.inviteFacilityManager({
        email: form.email.trim(),
        organizationName: form.organizationName.trim(),
        facilityName: form.facilityName.trim(),
        facilityType: form.facilityType,
        location: {
          name: form.locationName.trim(),
          addressLine1: form.addressLine1.trim(),
          city: form.city.trim(),
          state: form.state.trim().toUpperCase(),
          zipCode: form.zipCode.trim(),
        },
      });
      setResult({
        onboardingUrl: res.onboardingUrl,
        clerkInvited: res.clerkInvited,
      });
      setForm(emptyForm);
    } catch (err) {
      setError(formatApiError(err, "Unable to send facility invite."));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-navy">Invite facility manager</h1>
        <p className="mt-1 text-sm text-muted">
          Creates the organization, facility, and location, then emails an onboarding link to the
          manager. Geofence coordinates are resolved from the address automatically.
        </p>
      </section>

      <form onSubmit={(e) => void handleSubmit(e)}>
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-center gap-2 text-sm font-semibold text-navy">
              <Mail className="h-4 w-4 text-primary" />
              Manager
            </div>
            <div>
              <Label htmlFor="email">Manager email</Label>
              <Input
                id="email"
                type="email"
                required
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                placeholder="director@facility.com"
              />
            </div>

            <div className="flex items-center gap-2 pt-2 text-sm font-semibold text-navy">
              <Building2 className="h-4 w-4 text-primary" />
              Organization & facility
            </div>
            <div>
              <Label htmlFor="organizationName">Organization name</Label>
              <Input
                id="organizationName"
                required
                value={form.organizationName}
                onChange={(e) => updateField("organizationName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="facilityName">Facility name</Label>
              <Input
                id="facilityName"
                required
                value={form.facilityName}
                onChange={(e) => updateField("facilityName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="facilityType">Facility type</Label>
              <Select
                id="facilityType"
                value={form.facilityType}
                onChange={(e) => updateField("facilityType", e.target.value)}
              >
                {FACILITY_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </Select>
            </div>

            <div className="flex items-center gap-2 pt-2 text-sm font-semibold text-navy">
              <MapPin className="h-4 w-4 text-primary" />
              Primary location
            </div>
            <div>
              <Label htmlFor="locationName">Location name</Label>
              <Input
                id="locationName"
                required
                value={form.locationName}
                onChange={(e) => updateField("locationName", e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="addressLine1">Street address</Label>
              <Input
                id="addressLine1"
                required
                value={form.addressLine1}
                onChange={(e) => updateField("addressLine1", e.target.value)}
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-3">
              <div>
                <Label htmlFor="city">City</Label>
                <Input
                  id="city"
                  required
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="state">State</Label>
                <Input
                  id="state"
                  required
                  maxLength={2}
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="zipCode">ZIP</Label>
                <Input
                  id="zipCode"
                  required
                  value={form.zipCode}
                  onChange={(e) => updateField("zipCode", e.target.value)}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={busy}>
              {busy ? "Sending invite…" : "Create facility & send invite"}
            </Button>
          </CardContent>
        </Card>
      </form>

      {result && (
        <Card className="border-emerald-200 bg-emerald-50/50">
          <CardContent className="space-y-3 p-6 text-sm text-navy">
            <p className="font-semibold text-emerald-800">Invite sent</p>
            <p>
              {result.clerkInvited
                ? "Clerk invitation email sent."
                : "Clerk invitation skipped — share the onboarding link manually."}
            </p>
            <p className="break-all font-medium">{result.onboardingUrl}</p>
            <div className="flex flex-wrap gap-2">
              <Button
                type="button"
                size="sm"
                variant="secondary"
                onClick={() => void navigator.clipboard.writeText(result.onboardingUrl)}
              >
                Copy onboarding link
              </Button>
              <Button
                type="button"
                size="sm"
                onClick={() => window.open(result.onboardingUrl, "_blank", "noopener,noreferrer")}
              >
                Open link
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
