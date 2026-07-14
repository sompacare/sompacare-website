"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Download,
  FileText,
  Mail,
  Send,
  Sparkles,
} from "lucide-react";
import { useApi } from "@/hooks/use-api";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ParsedResumeCard, type ParsedResumeData } from "@/components/candidates/parsed-resume-card";
import type { Candidate } from "@/lib/api";

const CHECKLIST = ["pending", "in_progress", "cleared", "failed"] as const;

export default function CandidateDetailPage() {
  const { id } = useParams<{ id: string }>();
  const api = useApi();
  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [interviewAt, setInterviewAt] = useState("");

  async function reload() {
    const data = await api.getCandidate(id);
    setCandidate(data);
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const data = await api.getCandidate(id);
        if (!cancelled) setCandidate(data);
      } catch {
        if (!cancelled) setCandidate(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [api, id]);

  async function downloadResume() {
    setBusy("resume");
    try {
      const { url, fileName } = await api.getCandidateResume(id);
      const link = document.createElement("a");
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      link.download = fileName;
      link.click();
    } catch {
      // no resume available
    } finally {
      setBusy(null);
    }
  }

  async function run(action: string, fn: () => Promise<unknown>) {
    setBusy(action);
    try {
      await fn();
      await reload();
    } catch {
      // keep UI state
    } finally {
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }

  if (!candidate) {
    return (
      <div className="space-y-4">
        <Link href="/pipeline" className="inline-flex items-center text-sm text-primary">
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to pipeline
        </Link>
        <p className="text-muted">Candidate not found.</p>
      </div>
    );
  }

  const hire = candidate.hireDetails;

  return (
    <div className="space-y-5">
      <Link href="/pipeline" className="inline-flex items-center text-sm text-primary">
        <ArrowLeft className="mr-1 h-4 w-4" />
        Pipeline
      </Link>

      <section>
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold text-navy">
              {candidate.firstName} {candidate.lastName}
            </h1>
            <p className="text-sm text-muted">{candidate.clinicalRole}</p>
          </div>
          <Badge>{candidate.stage}</Badge>
        </div>
        <div className="mt-3 space-y-1 text-sm text-muted">
          <p className="flex items-center gap-2">
            <Mail className="h-4 w-4" />
            {candidate.email}
          </p>
          {candidate.phone && <p>{candidate.phone}</p>}
          {candidate.source && (
            <p>
              Source: <span className="font-medium text-navy">{candidate.source}</span>
              {candidate.sourceApplicationId && (
                <span className="text-xs"> · ref {candidate.sourceApplicationId.slice(0, 8)}</span>
              )}
            </p>
          )}
          {candidate.worker && (
            <p className="font-medium text-emerald-700">
              Worker linked: {candidate.worker.firstName} {candidate.worker.lastName}
            </p>
          )}
          {candidate.facility?.name && <p>Facility: {candidate.facility.name}</p>}
          {candidate.matchScore != null && (
            <p className="font-semibold text-primary">Match score: {candidate.matchScore}%</p>
          )}
        </div>
      </section>

      <Card>
        <CardContent className="space-y-3 p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Checklist</h2>
          <div className="grid grid-cols-2 gap-3">
            <label className="text-xs">
              Background check
              <select
                className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                value={candidate.backgroundCheckStatus ?? "pending"}
                disabled={busy === "checklist"}
                onChange={(e) =>
                  run("checklist", () =>
                    api.updateChecklist(id, {
                      backgroundCheckStatus: e.target.value,
                      referenceStatus: candidate.referenceStatus ?? "pending",
                    })
                  )
                }
              >
                {CHECKLIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="text-xs">
              References
              <select
                className="mt-1 w-full rounded-lg border border-border px-2 py-1.5 text-sm"
                value={candidate.referenceStatus ?? "pending"}
                disabled={busy === "checklist"}
                onChange={(e) =>
                  run("checklist", () =>
                    api.updateChecklist(id, {
                      backgroundCheckStatus: candidate.backgroundCheckStatus ?? "pending",
                      referenceStatus: e.target.value,
                    })
                  )
                }
              >
                {CHECKLIST.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Resume</h2>
          {(candidate.resumeStorageKey || candidate.resumeFileName) && (
            <p className="text-sm text-muted">
              {candidate.resumeFileName ?? "Resume on file"}
            </p>
          )}
          {(candidate.resumeStorageKey || candidate.resumeUrl) && (
            <Button
              variant="secondary"
              size="sm"
              disabled={busy === "resume"}
              onClick={() => void downloadResume()}
            >
              <Download className="mr-2 h-4 w-4" />
              {busy === "resume" ? "Loading…" : "Download resume"}
            </Button>
          )}
          {!candidate.resumeParsedAt && (
            <p className="text-sm text-muted">Not parsed yet — run AI parse to build a profile.</p>
          )}
          <Button
            variant="secondary"
            size="sm"
            disabled={busy === "parse"}
            onClick={() =>
              run("parse", () =>
                api.parseResume(
                  id,
                  [
                    `${candidate.firstName} ${candidate.lastName}`,
                    candidate.clinicalRole,
                    candidate.email,
                    candidate.phone,
                    candidate.facility?.name ? `Target facility: ${candidate.facility.name}` : "",
                    candidate.resumeUrl ? `Resume file: ${candidate.resumeUrl}` : "",
                    "Licensed healthcare professional seeking placement.",
                  ]
                    .filter(Boolean)
                    .join(". ")
                )
              )
            }
          >
            <Sparkles className="mr-2 h-4 w-4" />
            {busy === "parse" ? "Parsing…" : candidate.resumeParsedAt ? "Re-parse resume" : "Parse resume (AI)"}
          </Button>
          {candidate.resumeParsedData && (
            <ParsedResumeCard
              data={candidate.resumeParsedData as ParsedResumeData}
              parsedAt={candidate.resumeParsedAt}
            />
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-wide text-muted">
            <Calendar className="h-4 w-4" />
            Interviews
          </h2>
          {candidate.interviews?.length ? (
            <ul className="space-y-2 text-sm">
              {candidate.interviews.map((iv) => (
                <li key={iv.id} className="rounded-lg border border-border px-3 py-2">
                  {new Date(iv.scheduledAt).toLocaleString()} · {iv.mode}
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted">No interviews scheduled</p>
          )}
          <div className="flex gap-2">
            <input
              type="datetime-local"
              className="flex-1 rounded-lg border border-border px-3 py-2 text-sm"
              value={interviewAt}
              onChange={(e) => setInterviewAt(e.target.value)}
            />
            <Button
              size="sm"
              disabled={!interviewAt || busy === "interview"}
              onClick={() =>
                run("interview", () =>
                  api.scheduleInterview(id, {
                    scheduledAt: new Date(interviewAt).toISOString(),
                    mode: "video",
                  })
                )
              }
            >
              Schedule
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="space-y-3 p-4">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Offer & onboarding</h2>
          {hire?.payRate && (
            <p className="text-sm">
              Offer: {hire.payRate}
              {hire.startDate ? ` · starts ${hire.startDate}` : ""}
            </p>
          )}
          <div className="grid gap-2">
            <Button
              size="sm"
              disabled={busy === "offer"}
              onClick={() =>
                run("offer", () =>
                  api.sendOffer(id, {
                    payRate: "$42/hr",
                    startDate: new Date(Date.now() + 86400000 * 14).toISOString().slice(0, 10),
                  })
                )
              }
            >
              <Send className="mr-2 h-4 w-4" />
              Send offer
            </Button>
            {candidate.stage === "OFFER" && !candidate.offerAcceptedAt && (
              <Button
                size="sm"
                variant="secondary"
                disabled={busy === "accept"}
                onClick={() => run("accept", () => api.acceptOffer(id))}
              >
                <CheckCircle2 className="mr-2 h-4 w-4" />
                Mark offer accepted
              </Button>
            )}
            <Button
              size="sm"
              variant="secondary"
              disabled={busy === "onboarding"}
              onClick={() => run("onboarding", () => api.sendOnboarding(id))}
            >
              <FileText className="mr-2 h-4 w-4" />
              Send onboarding package
            </Button>
          </div>
        </CardContent>
      </Card>

      {candidate.notes && (
        <Card>
          <CardContent className="p-4">
            <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">Notes</h2>
            <p className="text-sm text-muted">{candidate.notes}</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
