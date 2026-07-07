type AdminKpiCardProps = {
  label: string;
  value: string;
  hint?: string;
  accent?: "blue" | "green" | "amber" | "navy";
};

const accentStyles = {
  blue: "border-brand-blue/20 bg-gradient-to-br from-white to-blue-50/60",
  green: "border-brand-green/20 bg-gradient-to-br from-white to-emerald-50/60",
  amber: "border-amber-200 bg-gradient-to-br from-white to-amber-50/60",
  navy: "border-slate-200 bg-gradient-to-br from-white to-slate-50",
};

export function AdminKpiCard({ label, value, hint, accent = "navy" }: AdminKpiCardProps) {
  return (
    <div className={`rounded-2xl border p-6 shadow-sm ${accentStyles[accent]}`}>
      <p className="text-[11px] font-bold tracking-[0.14em] text-brand-slate uppercase">{label}</p>
      <p className="mt-2 text-3xl font-bold tracking-tight text-brand-navy">{value}</p>
      {hint && <p className="mt-2 text-xs leading-relaxed text-brand-slate">{hint}</p>}
    </div>
  );
}
