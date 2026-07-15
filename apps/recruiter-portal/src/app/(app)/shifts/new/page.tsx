"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import type { HomecareFacility } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const ROLES = ["RN", "LPN", "CNA", "GNA", "CMA", "MED_TECH"] as const;

function defaultStartTime() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(9, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

function defaultEndTime() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  d.setHours(13, 0, 0, 0);
  return d.toISOString().slice(0, 16);
}

export default function RecruiterNewShiftPage() {
  const router = useRouter();
  const api = useApi();
  const [facility, setFacility] = useState<HomecareFacility | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishNow, setPublishNow] = useState(true);

  const [visit, setVisit] = useState({
    name: "Client home visit",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "MD",
    zipCode: "",
  });

  const [shift, setShift] = useState({
    title: "Home care visit — CNA",
    description: "Assist with ADLs and companionship per care plan.",
    role: "CNA",
    shiftType: "PER_DIEM",
    payRate: "28",
    startTime: defaultStartTime(),
    endTime: defaultEndTime(),
    slotsTotal: "1",
  });

  useEffect(() => {
    async function load() {
      try {
        const res = await api.getInternalHomecareFacility();
        setFacility(res.data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load Sompacare home care facility.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [api]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!facility?.id) return;

    setSubmitting(true);
    setError(null);
    try {
      const created = await api.createShift({
        facilityId: facility.id,
        location: {
          name: visit.name,
          addressLine1: visit.addressLine1,
          addressLine2: visit.addressLine2 || undefined,
          city: visit.city,
          state: visit.state,
          zipCode: visit.zipCode,
        },
        title: shift.title,
        description: shift.description,
        role: shift.role,
        shiftType: shift.shiftType,
        payRate: Number(shift.payRate),
        startTime: new Date(shift.startTime).toISOString(),
        endTime: new Date(shift.endTime).toISOString(),
        slotsTotal: Number(shift.slotsTotal),
        requirements: ["Active License"],
      });
      if (publishNow) await api.publishShift(created.id);
      router.push("/shifts");
    } catch (err) {
      const body = (err as { body?: { message?: string | string[] } }).body;
      const msg = body?.message;
      setError(
        Array.isArray(msg) ? msg.join(", ") : (msg as string) ?? (err instanceof Error ? err.message : "Could not create shift")
      );
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-80 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <Link href="/shifts" className="text-sm font-semibold text-primary hover:underline">
        ← Shifts
      </Link>
      <div>
        <h1 className="text-2xl font-bold text-navy">Post home care visit</h1>
        <p className="mt-1 text-sm text-muted">
          {facility?.name ?? "Sompacare Home Care"} — set any client address and publish to nurses.
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-4">
            <div>
              <Label htmlFor="visitName">Visit label</Label>
              <Input
                id="visitName"
                value={visit.name}
                onChange={(e) => setVisit({ ...visit, name: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="addressLine1">Street address</Label>
              <Input
                id="addressLine1"
                value={visit.addressLine1}
                onChange={(e) => setVisit({ ...visit, addressLine1: e.target.value })}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input
                placeholder="City"
                value={visit.city}
                onChange={(e) => setVisit({ ...visit, city: e.target.value })}
                required
              />
              <Input
                placeholder="ST"
                maxLength={2}
                value={visit.state}
                onChange={(e) => setVisit({ ...visit, state: e.target.value.toUpperCase() })}
                required
              />
              <Input
                placeholder="ZIP"
                value={visit.zipCode}
                onChange={(e) => setVisit({ ...visit, zipCode: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="title">Shift title</Label>
              <Input
                id="title"
                value={shift.title}
                onChange={(e) => setShift({ ...shift, title: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="description">Notes</Label>
              <Textarea
                id="description"
                value={shift.description}
                onChange={(e) => setShift({ ...shift, description: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  id="role"
                  value={shift.role}
                  onChange={(e) => setShift({ ...shift, role: e.target.value })}
                >
                  {ROLES.map((r) => (
                    <option key={r} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="payRate">Pay $/hr</Label>
                <Input
                  id="payRate"
                  type="number"
                  min="0"
                  value={shift.payRate}
                  onChange={(e) => setShift({ ...shift, payRate: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label htmlFor="startTime">Start</Label>
              <Input
                id="startTime"
                type="datetime-local"
                value={shift.startTime}
                onChange={(e) => setShift({ ...shift, startTime: e.target.value })}
                required
              />
            </div>
            <div>
              <Label htmlFor="endTime">End</Label>
              <Input
                id="endTime"
                type="datetime-local"
                value={shift.endTime}
                onChange={(e) => setShift({ ...shift, endTime: e.target.value })}
                required
              />
            </div>

            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={publishNow}
                onChange={(e) => setPublishNow(e.target.checked)}
              />
              Publish to nurse marketplace now
            </label>

            {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Saving…" : publishNow ? "Create & publish" : "Save draft"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
