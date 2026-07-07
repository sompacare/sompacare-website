type AdminPageHeaderProps = {
  badge?: string;
  title: string;
  description?: string;
};

export function AdminPageHeader({ badge, title, description }: AdminPageHeaderProps) {
  return (
    <div>
      {badge && (
        <p className="text-xs font-bold tracking-widest text-brand-blue uppercase">{badge}</p>
      )}
      <h1 className="mt-1 text-3xl font-bold text-brand-navy">{title}</h1>
      {description && <p className="mt-1 text-sm text-brand-slate">{description}</p>}
    </div>
  );
}
