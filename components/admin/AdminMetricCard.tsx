type AdminMetricCardProps = {
  label: string;
  value: string;
  hint?: string;
};

export function AdminMetricCard({ label, value, hint }: AdminMetricCardProps) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      <p className="text-xs font-bold tracking-wide text-brand-slate uppercase">{label}</p>
      <p className="mt-2 text-3xl font-bold text-brand-navy">{value}</p>
      {hint && <p className="mt-1 text-xs text-brand-slate">{hint}</p>}
    </div>
  );
}
