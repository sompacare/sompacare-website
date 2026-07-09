import { Award, Briefcase, FileText, GraduationCap } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export type ParsedResumeData = {
  clinicalRole?: string;
  yearsExperience?: number;
  specialties?: string[];
  licenses?: Array<{ type: string; state: string; number?: string }>;
  certifications?: string[];
  skills?: string[];
  summary?: string;
};

type ParsedResumeCardProps = {
  data: ParsedResumeData;
  parsedAt?: string | null;
};

function isDevPreview(summary?: string) {
  return summary?.toLowerCase().includes("dev mode") ?? false;
}

export function ParsedResumeCard({ data, parsedAt }: ParsedResumeCardProps) {
  const devPreview = isDevPreview(data.summary);

  return (
    <div className="space-y-4 rounded-xl border border-border bg-slate-50/80 p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-semibold text-navy">
          <FileText className="h-4 w-4 text-primary" />
          Parsed profile
        </div>
        <div className="flex flex-wrap gap-2">
          {parsedAt && (
            <span className="text-xs text-muted">
              {new Date(parsedAt).toLocaleDateString()}
            </span>
          )}
          {devPreview && (
            <Badge variant="warning">Sample data</Badge>
          )}
        </div>
      </div>

      {data.summary && (
        <p className="text-sm leading-relaxed text-navy/90">{data.summary}</p>
      )}

      <div className="grid grid-cols-2 gap-3 text-sm">
        {data.clinicalRole && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Role</p>
            <p className="mt-0.5 font-medium text-navy">{data.clinicalRole}</p>
          </div>
        )}
        {data.yearsExperience != null && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">Experience</p>
            <p className="mt-0.5 flex items-center gap-1 font-medium text-navy">
              <Briefcase className="h-3.5 w-3.5 text-primary" />
              {data.yearsExperience} years
            </p>
          </div>
        )}
      </div>

      {data.specialties && data.specialties.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            <GraduationCap className="h-3.5 w-3.5" />
            Specialties
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.specialties.map((s) => (
              <Badge key={s} variant="blue">
                {s}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {data.skills && data.skills.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Skills</p>
          <div className="flex flex-wrap gap-1.5">
            {data.skills.map((s) => (
              <Badge key={s}>{s}</Badge>
            ))}
          </div>
        </div>
      )}

      {data.certifications && data.certifications.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-muted">
            <Award className="h-3.5 w-3.5" />
            Certifications
          </p>
          <div className="flex flex-wrap gap-1.5">
            {data.certifications.map((c) => (
              <Badge key={c} variant="success">
                {c}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {data.licenses && data.licenses.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted">Licenses</p>
          <ul className="space-y-1.5">
            {data.licenses.map((lic, i) => (
              <li
                key={`${lic.type}-${lic.state}-${i}`}
                className="rounded-lg border border-border bg-white px-3 py-2 text-sm text-navy"
              >
                <span className="font-semibold">{lic.type}</span>
                <span className="text-muted"> · {lic.state}</span>
                {lic.number && (
                  <span className="block text-xs text-muted">{lic.number}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
