import Link from "next/link";
import { ArrowRightIcon } from "@/components/icons";

export function SectionBadge({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-brand-green/20 bg-brand-green/5 px-4 py-1.5 text-[11px] font-bold tracking-[0.12em] text-brand-green uppercase">
      {children}
    </span>
  );
}

export function SectionHeading({
  badge,
  title,
  description,
  light = false,
  align = "center",
}: {
  badge: string;
  title: string;
  description: string;
  light?: boolean;
  align?: "center" | "left";
}) {
  const alignClass = align === "center" ? "mx-auto text-center" : "text-left";
  const titleColor = light ? "text-white" : "text-foreground";
  const descColor = light ? "text-white/65" : "text-muted";

  return (
    <div className={`max-w-3xl ${alignClass}`}>
      <SectionBadge>{badge}</SectionBadge>
      <h2 className={`mt-5 text-3xl font-bold tracking-tight sm:text-4xl lg:text-[2.75rem] lg:leading-[1.15] ${titleColor}`}>
        {title}
      </h2>
      <p className={`mt-5 text-lg leading-relaxed ${descColor}`}>{description}</p>
    </div>
  );
}

type ButtonProps = {
  href: string;
  children: React.ReactNode;
  className?: string;
  external?: boolean;
};

export function PrimaryButton({ href, children, className = "", external }: ButtonProps) {
  const cls = `group inline-flex items-center justify-center gap-2.5 rounded-full bg-brand-blue px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-brand-blue/25 transition-all duration-300 hover:-translate-y-0.5 hover:bg-brand-blue-dark hover:shadow-xl hover:shadow-brand-blue/30 ${className}`;

  if (external) {
    return (
      <a href={href} className={cls} target="_blank" rel="noopener noreferrer">
        {children}
        <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
      </a>
    );
  }

  return (
    <Link href={href} className={cls}>
      {children}
      <ArrowRightIcon className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
    </Link>
  );
}

export function SecondaryButton({ href, children, className = "" }: ButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-white/30 bg-white/10 px-8 py-4 text-sm font-semibold text-white backdrop-blur-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-white/50 hover:bg-white/20 ${className}`}
    >
      {children}
    </Link>
  );
}

export function OutlineButton({ href, children, className = "" }: ButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2.5 rounded-full border-2 border-brand-blue/20 bg-white px-8 py-4 text-sm font-semibold text-brand-blue transition-all duration-300 hover:-translate-y-0.5 hover:border-brand-blue hover:bg-brand-blue/5 ${className}`}
    >
      {children}
    </Link>
  );
}

export function Container({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`mx-auto max-w-7xl px-5 sm:px-6 lg:px-8 ${className}`}>
      {children}
    </div>
  );
}

export function Section({
  children,
  className = "",
  id,
}: {
  children: React.ReactNode;
  className?: string;
  id?: string;
}) {
  return (
    <section id={id} className={`py-20 sm:py-28 lg:py-32 ${className}`}>
      {children}
    </section>
  );
}
