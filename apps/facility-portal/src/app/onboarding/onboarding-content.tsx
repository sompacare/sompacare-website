"use client";

import { useAuth } from "@clerk/nextjs";
import { Building2, MapPin, CheckCircle2 } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Logo } from "@/components/brand/logo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/input";
import { useApi } from "@/hooks/use-api";
import { formatApiError } from "@/lib/api";

const FACILITY_TYPES = [
  { value: "skilled_nursing", label: "Skilled nursing" },
  { value: "assisted_living", label: "Assisted living" },
  { value: "hospital", label: "Hospital" },
  { value: "rehab", label: "Rehab" },
  { value: "home_health", label: "Home health" },
  { value: "clinic", label: "Clinic" },
  { value: "other", label: "Other" },
] as const;

type InvitePreview = {
  organizationName: string;
  facilityName: string;
  facilityType: string;
  location: {
    name: string;
    addressLine1: string;
    city: string;
    state: string;
    zipCode: string;
  } | null;
};

type GeocodedLocation = {
  latitude: number;
  longitude: number;
  formattedAddress: string;
};

const emptyForm = {
  organizationName: "",
  facilityName: "",
  facilityType: "skilled_nursing",
  facilityEmail: "",
  facilityPhone: "",
  locationName: "Main campus",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  zipCode: "",
};

export default function FacilityOnboardingPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const inviteToken = searchParams.get("invite");
  const api = useApi();
  const { isLoaded, isSignedIn } = useAuth();

  const [step, setStep] = useState(1);
  const [mode, setMode] = useState<"loading" | "invite" | "self_service">("loading");
  const [invitePreview, setInvitePreview] = useState<InvitePreview | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [geocoded, setGeocoded] = useState<GeocodedLocation | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn) {
      const next = inviteToken
        ? `/onboarding?invite=${encodeURIComponent(inviteToken)}`
        : "/onboarding";
      router.replace(`/sign-in?redirect_url=${encodeURIComponent(next)}`);
      return;
    }

    let cancelled = false;

    async function init() {
      try {
        const status = await api.getFacilityOnboardingStatus();
        if (cancelled) return;
        if (status.complete) {
          router.replace("/home");
          return;
        }

        if (inviteToken) {
          const preview = await api.getFacilityInvitePreview(inviteToken);
          if (cancelled) return;
          setInvitePreview(preview);
          setMode("invite");
          return;
        }

        if (status.mode === "invite" && status.pendingInvite) {
          const preview = await api.getFacilityInvitePreview(status.pendingInvite.token);
          if (cancelled) return;
          setInvitePreview(preview);
          setMode("invite");
          return;
        }

        setMode("self_service");
      } catch (err) {
        if (!cancelled) {
          setError(formatApiError(err, "Unable to load onboarding."));
          setMode("self_service");
        }
      }
    }

    init();
    return () => {
      cancelled = true;
    };
  }, [api, inviteToken, isLoaded, isSignedIn, router]);

  function updateField(key: keyof typeof form, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    if (
      key === "addressLine1" ||
      key === "addressLine2" ||
      key === "city" ||
      key === "state" ||
      key === "zipCode"
    ) {
      setGeocoded(null);
    }
  }

  async function handleAcceptInvite() {
    const token = inviteToken ?? (await api.getFacilityOnboardingStatus()).pendingInvite?.token;
    if (!token) {
      setError("Invite token missing.");
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await api.acceptFacilityInvite(token);
      router.replace("/home");
    } catch (err) {
      setError(formatApiError(err, "Unable to accept invitation."));
    } finally {
      setBusy(false);
    }
  }

  async function geocodeCurrentAddress() {
    return api.geocodeFacilityAddress({
      addressLine1: form.addressLine1.trim(),
      addressLine2: form.addressLine2.trim() || undefined,
      city: form.city.trim(),
      state: form.state.trim().toUpperCase(),
      zipCode: form.zipCode.trim(),
    });
  }

  async function handleSelfServiceSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (step === 2) {
      setBusy(true);
      setError(null);
      try {
        const result = await geocodeCurrentAddress();
        setGeocoded(result);
        setStep(3);
      } catch (err) {
        setError(formatApiError(err, "We couldn't verify that address. Check the street, city, state, and ZIP."));
      } finally {
        setBusy(false);
      }
      return;
    }

    if (step < 3) {
      setStep(step + 1);
      return;
    }

    setBusy(true);
    setError(null);
    try {
      await api.completeFacilitySelfServiceOnboarding({
        organizationName: form.organizationName.trim(),
        facilityName: form.facilityName.trim(),
        facilityType: form.facilityType,
        facilityEmail: form.facilityEmail.trim() || undefined,
        facilityPhone: form.facilityPhone.trim() || undefined,
        location: {
          name: form.locationName.trim(),
          addressLine1: form.addressLine1.trim(),
          addressLine2: form.addressLine2.trim() || undefined,
          city: form.city.trim(),
          state: form.state.trim().toUpperCase(),
          zipCode: form.zipCode.trim(),
        },
      });
      router.replace("/home");
    } catch (err) {
      setError(formatApiError(err, "Unable to create your facility. Please try again."));
    } finally {
      setBusy(false);
    }
  }

  if (mode === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-muted">
        Loading onboarding…
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-8 flex flex-col items-center text-center">
        <Logo height={48} subtitle="Facility setup" />
        <p className="mt-3 text-sm text-muted">
          {mode === "invite"
            ? "Accept your invitation to start managing shifts and billing."
            : "Tell us about your organization to activate your facility portal."}
        </p>
      </div>

      {mode === "invite" && invitePreview && (
        <Card>
          <CardContent className="space-y-4 p-6">
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Organization
                </p>
                <p className="font-bold text-navy">{invitePreview.organizationName}</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="mt-0.5 h-5 w-5 text-primary" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                  Facility
                </p>
                <p className="font-bold text-navy">{invitePreview.facilityName}</p>
                <p className="text-sm capitalize text-muted">
                  {invitePreview.facilityType.replace(/_/g, " ")}
                </p>
              </div>
            </div>
            {invitePreview.location && (
              <div className="flex items-start gap-3">
                <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted">
                    Location
                  </p>
                  <p className="text-sm text-navy">
                    {invitePreview.location.addressLine1}, {invitePreview.location.city},{" "}
                    {invitePreview.location.state} {invitePreview.location.zipCode}
                  </p>
                </div>
              </div>
            )}
            {error && <p className="text-sm text-red-600">{error}</p>}
            <Button className="w-full" onClick={() => void handleAcceptInvite()} disabled={busy}>
              {busy ? "Linking account…" : "Accept invitation & continue"}
            </Button>
          </CardContent>
        </Card>
      )}

      {mode === "self_service" && (
        <form onSubmit={(e) => void handleSelfServiceSubmit(e)}>
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="flex gap-2 text-xs font-semibold uppercase tracking-wide text-muted">
                <span className={step === 1 ? "text-primary" : ""}>1. Organization</span>
                <span>·</span>
                <span className={step === 2 ? "text-primary" : ""}>2. Location</span>
                <span>·</span>
                <span className={step === 3 ? "text-primary" : ""}>3. Review</span>
              </div>

              {step === 1 && (
                <>
                  <div>
                    <Label htmlFor="organizationName">Organization name</Label>
                    <Input
                      id="organizationName"
                      required
                      value={form.organizationName}
                      onChange={(e) => updateField("organizationName", e.target.value)}
                      placeholder="Sunrise Healthcare Group"
                    />
                  </div>
                  <div>
                    <Label htmlFor="facilityName">Facility name</Label>
                    <Input
                      id="facilityName"
                      required
                      value={form.facilityName}
                      onChange={(e) => updateField("facilityName", e.target.value)}
                      placeholder="Sunrise Skilled Nursing"
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
                  <div>
                    <Label htmlFor="facilityEmail">Billing email (optional)</Label>
                    <Input
                      id="facilityEmail"
                      type="email"
                      value={form.facilityEmail}
                      onChange={(e) => updateField("facilityEmail", e.target.value)}
                    />
                  </div>
                </>
              )}

              {step === 2 && (
                <>
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
                  <div className="grid grid-cols-2 gap-3">
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
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP code</Label>
                    <Input
                      id="zipCode"
                      required
                      value={form.zipCode}
                      onChange={(e) => updateField("zipCode", e.target.value)}
                    />
                  </div>
                  <p className="text-xs text-muted">
                    We use your address to set up nurse clock-in geofencing automatically — no
                    coordinates needed.
                  </p>
                </>
              )}

              {step === 3 && (
                <div className="space-y-3 text-sm text-navy">
                  <p>
                    <span className="font-semibold">Organization:</span> {form.organizationName}
                  </p>
                  <p>
                    <span className="font-semibold">Facility:</span> {form.facilityName}
                  </p>
                  <p>
                    <span className="font-semibold">Address:</span> {form.addressLine1},{" "}
                    {form.city}, {form.state} {form.zipCode}
                  </p>
                  {geocoded && (
                    <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-900">
                      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                      <div>
                        <p className="font-semibold">Geofence location verified</p>
                        <p className="text-xs text-emerald-800">{geocoded.formattedAddress}</p>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {error && <p className="text-sm text-red-600">{error}</p>}

              <div className="flex gap-2 pt-2">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={() => setStep(step - 1)}
                    disabled={busy}
                  >
                    Back
                  </Button>
                )}
                <Button type="submit" className="flex-1" disabled={busy}>
                  {busy
                    ? step === 2
                      ? "Verifying address…"
                      : "Saving…"
                    : step === 3
                      ? "Create facility & continue"
                      : "Continue"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  );
}
