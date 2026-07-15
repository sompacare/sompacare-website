"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getDefaultBillRateForRole } from "@sompacare/shared";
import { useApi } from "@/hooks/use-api";
import { useFacility } from "@/hooks/use-facility";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const ROLES = ["RN", "LPN", "CNA", "GNA", "CMA", "MED_TECH"] as const;
const SHIFT_TYPES = ["PER_DIEM", "CONTRACT", "TRAVEL", "EMERGENCY", "PERMANENT"] as const;

function defaultStartTime() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(7, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

function defaultEndTime() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(19, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export default function NewShiftPage() {
  const router = useRouter();
  const api = useApi();
  const { facility, primaryLocation, loading: facilityLoading } = useFacility();
  const [selectedLocationId, setSelectedLocationId] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [publishNow, setPublishNow] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const activeLocationId = selectedLocationId || primaryLocation?.id || "";

  const [form, setForm] = useState({
    title: "RN — Med-Surg Per Diem",
    description: "Experienced clinician needed. BLS required.",
    role: "RN",
    shiftType: "PER_DIEM",
    billRate: String(getDefaultBillRateForRole("RN")),
    startTime: defaultStartTime(),
    endTime: defaultEndTime(),
    slotsTotal: "1",
  });

  function updateRole(role: string) {
    setForm((current) => ({
      ...current,
      role,
      billRate: String(getDefaultBillRateForRole(role)),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!facility?.id || !activeLocationId) {
      setError("Facility or location not loaded.");
      return;
    }

    setSubmitting(true);
    setError(null);
    try {
      const created = await api.createShift({
        facilityId: facility.id,
        locationId: activeLocationId,
        title: form.title,
        description: form.description,
        role: form.role,
        shiftType: form.shiftType,
        billRate: Number(form.billRate),
        startTime: new Date(form.startTime).toISOString(),
        endTime: new Date(form.endTime).toISOString(),
        slotsTotal: Number(form.slotsTotal),
        requirements: ["Active License", "BLS Certification"],
      });

      if (publishNow && created.id) {
        await api.publishShift(created.id);
      }

      router.push("/shifts");
    } catch (err) {
      const body = (err as { body?: { message?: string | string[] } }).body;
      const msg = body?.message;
      setError(Array.isArray(msg) ? msg.join(", ") : (msg as string) ?? "Could not create shift");
    } finally {
      setSubmitting(false);
    }
  }

  if (facilityLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-navy">Post a shift</h1>
        <p className="mt-1 text-sm text-muted">
          {facility?.name ?? "Your facility"}
        </p>
      </div>

      <Card className="mb-8">
        <CardContent className="p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            {(facility?.locations?.length ?? 0) > 1 && (
              <div>
                <Label htmlFor="location">Shift location</Label>
                <Select
                  id="location"
                  value={activeLocationId}
                  onChange={(e) => setSelectedLocationId(e.target.value)}
                >
                  {(facility?.locations ?? []).map((loc) => (
                    <option key={loc.id} value={loc.id}>
                      {loc.name} — {loc.city}, {loc.state}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <div>
              <Label htmlFor="title">Shift title</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  id="role"
                  value={form.role}
                  onChange={(e) => updateRole(e.target.value)}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r === "MED_TECH" ? "Med Tech" : r}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="shiftType">Type</Label>
                <Select
                  id="shiftType"
                  value={form.shiftType}
                  onChange={(e) => setForm({ ...form, shiftType: e.target.value })}
                >
                  {SHIFT_TYPES.map((t) => (
                    <option key={t} value={t}>{t.replace("_", " ")}</option>
                  ))}
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="billRate">Your bill rate ($/hr)</Label>
              <Input
                id="billRate"
                type="number"
                min="0"
                step="0.5"
                value={form.billRate}
                onChange={(e) => setForm({ ...form, billRate: e.target.value })}
                required
              />
              <p className="mt-1 text-xs text-muted">
                This is the hourly rate your facility pays Sompacare for this {form.role} shift.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="slotsTotal">Open slots</Label>
                <Input
                  id="slotsTotal"
                  type="number"
                  min="1"
                  value={form.slotsTotal}
                  onChange={(e) => setForm({ ...form, slotsTotal: e.target.value })}
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="startTime">Start</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={form.startTime}
                onChange={(e) => setForm({ ...form, startTime: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="endTime">End</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={form.endTime}
                onChange={(e) => setForm({ ...form, endTime: e.target.value })}
                required
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={publishNow}
                onChange={(e) => setPublishNow(e.target.checked)}
                className="rounded border-border"
              />
              Publish immediately to marketplace
            </label>

            {error && (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving…" : publishNow ? "Create & publish" : "Save as draft"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
