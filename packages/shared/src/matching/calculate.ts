export type MatchFactors = {
  roleMatch: number;
  compliance: number;
  reliability: number;
  specialty: number;
  payRate: number;
  shiftType: number;
  location: number;
};

export type ShiftMatchInput = {
  role: string;
  hourlyRate: number;
  shiftType: string;
  requirements: string[];
  location: { city: string; state: string };
};

export type WorkerMatchInput = {
  clinicalRole: string;
  complianceScore: number;
  reliabilityScore: number;
  specialties: string[];
  minHourlyRate?: number | null;
  preferredShiftTypes: string[];
  preferredLocations: string[];
};

export type MatchResult = {
  score: number;
  factors: MatchFactors;
  highlights: string[];
};

function normalize(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, " ");
}

function specialtyOverlap(requirements: string[], specialties: string[]) {
  if (!requirements.length || !specialties.length) return 0;
  const reqs = requirements.map(normalize);
  const specs = specialties.map(normalize);
  const hits = specs.filter((s) =>
    reqs.some((r) => r.includes(s) || s.includes(r.split(" ")[0] ?? ""))
  );
  return Math.min(1, hits.length / Math.max(1, Math.min(requirements.length, 2)));
}

export function calculateShiftMatch(
  shift: ShiftMatchInput,
  worker: WorkerMatchInput
): MatchResult {
  const highlights: string[] = [];

  const roleMatch =
    shift.role === worker.clinicalRole ? 25 : worker.clinicalRole === "NURSE" ? 15 : 0;
  if (roleMatch >= 25) highlights.push("Role match");

  const compliance = Math.round((worker.complianceScore / 100) * 25);
  if (compliance >= 20) highlights.push("Strong compliance");

  const reliability = Math.round((worker.reliabilityScore / 100) * 15);
  if (reliability >= 12) highlights.push("High reliability");

  const specialtyRatio = specialtyOverlap(shift.requirements, worker.specialties);
  const specialty = Math.round(specialtyRatio * 15);
  if (specialty >= 10) highlights.push("Specialty fit");

  let payRate = 0;
  if (worker.minHourlyRate == null || shift.hourlyRate >= Number(worker.minHourlyRate)) {
    payRate = 10;
    highlights.push("Meets pay preference");
  }

  const shiftType = worker.preferredShiftTypes.includes(shift.shiftType) ? 10 : 5;

  const locKey = `${shift.location.city},${shift.location.state}`.toLowerCase();
  const location = worker.preferredLocations.some(
    (l) => l.toLowerCase().includes(shift.location.state.toLowerCase()) || l.toLowerCase() === locKey
  )
    ? 5
    : 2;

  const factors: MatchFactors = {
    roleMatch,
    compliance,
    reliability,
    specialty,
    payRate,
    shiftType,
    location,
  };

  const score = Math.min(
    100,
    roleMatch + compliance + reliability + specialty + payRate + shiftType + location
  );

  return { score, factors, highlights };
}
