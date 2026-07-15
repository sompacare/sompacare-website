"use client";

import { getDefaultBillRateForRole } from "@sompacare/shared";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useApi } from "@/hooks/use-api";
import type { FacilityRecord } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label, Select, Textarea } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";

const ROLES = ["RN", "LPN", "CNA", "GNA", "CMA", "MED_TECH"] as const;
const SHIFT_TYPES = ["PER_DIEM", "CONTRACT", "TRAVEL", "EMERGENCY"] as const;

type PostMode = "homecare" | "client";

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

export default function AdminNewShiftPage() {
  const router = useRouter();
  const api = useApi();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [publishNow, setPublishNow] = useState(true);

  const [homecareFacility, setHomecareFacility] = useState<FacilityRecord | null>(null);
  const [clientFacilities, setClientFacilities] = useState<FacilityRecord[]>([]);

  const [mode, setMode] = useState<PostMode>("homecare");
  const [clientFacilityId, setClientFacilityId] = useState("");
  const [useExistingLocation, setUseExistingLocation] = useState(false);
  const [existingLocationId, setExistingLocationId] = useState("");

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
    description: "Assist with ADLs, vitals, and companionship per care plan.",
    role: "CNA",
    shiftType: "PER_DIEM",
    billRate: String(getDefaultBillRateForRole("CNA")),
    startTime: defaultStartTime(),
    endTime: defaultEndTime(),
    slotsTotal: "1",
    isEmergency: false,
  });

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [internalRes, facilitiesRes] = await Promise.all([
          api.getInternalHomecareFacility(),
          api.getFacilities({ limit: "100" }),
        ]);
        setHomecareFacility(internalRes.data);
        const clients = (facilitiesRes.data ?? []).filter((f) => !f.isInternal);
        setClientFacilities(clients);
        if (clients[0]) {
          setClientFacilityId(clients[0].id);
          const primary = clients[0].locations?.find((l) => l.isPrimary) ?? clients[0].locations?.[0];
          if (primary) setExistingLocationId(primary.id);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Could not load facilities.");
      } finally {
        setLoading(false);
      }
    }
    void load();
  }, [api]);

  const selectedClient = clientFacilities.find((f) => f.id === clientFacilityId);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const facilityId =
        mode === "homecare" ? homecareFacility?.id : clientFacilityId;
      if (!facilityId) {
        throw new Error("Select a facility to post under.");
      }

      const body: Parameters<typeof api.createShift>[0] = {
        facilityId,
        title: shift.title,
        description: shift.description,
        role: shift.role,
        shiftType: shift.shiftType,
        billRate: Number(shift.billRate),
        startTime: new Date(shift.startTime).toISOString(),
        endTime: new Date(shift.endTime).toISOString(),
        slotsTotal: Number(shift.slotsTotal),
        requirements: ["Active License"],
        isEmergency: shift.isEmergency,
      };

      if (mode === "homecare" || !useExistingLocation) {
        if (!visit.addressLine1.trim() || !visit.city.trim() || !visit.zipCode.trim()) {
          throw new Error("Enter the full visit address.");
        }
        body.location = {
          name: visit.name,
          addressLine1: visit.addressLine1,
          addressLine2: visit.addressLine2 || undefined,
          city: visit.city,
          state: visit.state,
          zipCode: visit.zipCode,
        };
      } else {
        if (!existingLocationId) throw new Error("Select a saved location.");
        body.locationId = existingLocationId;
      }

      const created = await api.createShift(body);
      if (publishNow) {
        await api.publishShift(created.id);
      }
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
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div>
        <Link href="/shifts" className="text-sm font-semibold text-primary hover:underline">
          ← Back to shifts
        </Link>
        <h1 className="mt-3 text-2xl font-bold text-navy">Post a shift</h1>
        <p className="mt-1 text-sm text-muted">
          Sompacare home care visits can be posted at any client address. Client facility shifts use
          the same marketplace flow nurses already use.
        </p>
      </div>

      <Card>
        <CardContent className="p-5">
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
            <div>
              <Label>Who is posting?</Label>
              <Select
                value={mode}
                onChange={(e) => setMode(e.target.value as PostMode)}
                className="mt-1"
              >
                <option value="homecare">Sompacare home care (any visit address)</option>
                <option value="client">Client facility (on their behalf)</option>
              </Select>
            </div>

            {mode === "homecare" ? (
              <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4 space-y-3">
                <p className="text-sm font-semibold text-navy">
                  Visit location · {homecareFacility?.name ?? "Sompacare Home Care"}
                </p>
                <div>
                  <Label htmlFor="visitName">Visit label</Label>
                  <Input
                    id="visitName"
                    value={visit.name}
                    onChange={(e) => setVisit({ ...visit, name: e.target.value })}
                    placeholder="e.g. Mrs. Johnson — morning care"
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
                <div>
                  <Label htmlFor="addressLine2">Apt / unit (optional)</Label>
                  <Input
                    id="addressLine2"
                    value={visit.addressLine2}
                    onChange={(e) => setVisit({ ...visit, addressLine2: e.target.value })}
                  />
                </div>
                <div className="grid gap-3 sm:grid-cols-3">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input
                      id="city"
                      value={visit.city}
                      onChange={(e) => setVisit({ ...visit, city: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="state">State</Label>
                    <Input
                      id="state"
                      maxLength={2}
                      value={visit.state}
                      onChange={(e) => setVisit({ ...visit, state: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="zipCode">ZIP</Label>
                    <Input
                      id="zipCode"
                      value={visit.zipCode}
                      onChange={(e) => setVisit({ ...visit, zipCode: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-3 rounded-2xl border border-border bg-slate-50 p-4">
                <div>
                  <Label>Client facility</Label>
                  <Select
                    value={clientFacilityId}
                    onChange={(e) => {
                      setClientFacilityId(e.target.value);
                      const facility = clientFacilities.find((f) => f.id === e.target.value);
                      const loc =
                        facility?.locations?.find((l) => l.isPrimary) ?? facility?.locations?.[0];
                      setExistingLocationId(loc?.id ?? "");
                    }}
                    className="mt-1"
                  >
                    {clientFacilities.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name}
                      </option>
                    ))}
                  </Select>
                </div>

                <label className="flex items-center gap-2 text-sm text-navy">
                  <input
                    type="checkbox"
                    checked={useExistingLocation}
                    onChange={(e) => setUseExistingLocation(e.target.checked)}
                  />
                  Use a saved facility location
                </label>

                {useExistingLocation ? (
                  <div>
                    <Label>Saved location</Label>
                    <Select
                      value={existingLocationId}
                      onChange={(e) => setExistingLocationId(e.target.value)}
                      className="mt-1"
                    >
                      {(selectedClient?.locations ?? []).map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name} — {loc.city}, {loc.state}
                        </option>
                      ))}
                    </Select>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <Label>Location name</Label>
                      <Input
                        value={visit.name}
                        onChange={(e) => setVisit({ ...visit, name: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <Label>Street address</Label>
                      <Input
                        value={visit.addressLine1}
                        onChange={(e) => setVisit({ ...visit, addressLine1: e.target.value })}
                        required
                      />
                    </div>
                    <div className="grid gap-3 sm:grid-cols-3">
                      <Input
                        placeholder="City"
                        value={visit.city}
                        onChange={(e) => setVisit({ ...visit, city: e.target.value })}
                        required
                      />
                      <Input
                        placeholder="State"
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
                  </div>
                )}
              </div>
            )}

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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={shift.description}
                onChange={(e) => setShift({ ...shift, description: e.target.value })}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="role">Role</Label>
                <Select
                  id="role"
                  value={shift.role}
                  onChange={(e) => {
                    const role = e.target.value;
                    setShift({
                      ...shift,
                      role,
                      billRate: String(getDefaultBillRateForRole(role)),
                    });
                  }}
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
                  value={shift.shiftType}
                  onChange={(e) => setShift({ ...shift, shiftType: e.target.value })}
                >
                  {SHIFT_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t.replace("_", " ")}
                    </option>
                  ))}
                </Select>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="billRate">Bill rate ($/hr)</Label>
                <Input
                  id="billRate"
                  type="number"
                  min="0"
                  step="0.5"
                  value={shift.billRate}
                  onChange={(e) => setShift({ ...shift, billRate: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="slotsTotal">Open slots</Label>
                <Input
                  id="slotsTotal"
                  type="number"
                  min="1"
                  value={shift.slotsTotal}
                  onChange={(e) => setShift({ ...shift, slotsTotal: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
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
            </div>

            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={shift.isEmergency}
                onChange={(e) => setShift({ ...shift, isEmergency: e.target.checked })}
              />
              Urgent / emergency fill
            </label>

            <label className="flex items-center gap-2 text-sm text-navy">
              <input
                type="checkbox"
                checked={publishNow}
                onChange={(e) => setPublishNow(e.target.checked)}
              />
              Publish immediately to nurse marketplace
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
