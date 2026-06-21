import Link from "next/link";

type LogoProps = {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
};

const sizes = {
  sm: { icon: "h-8 w-8", text: "text-base", tagline: "text-[9px]" },
  md: { icon: "h-10 w-10", text: "text-lg", tagline: "text-[10px]" },
  lg: { icon: "h-12 w-12", text: "text-xl", tagline: "text-[11px]" },
};

export function Logo({ variant = "light", size = "md", showTagline = true }: LogoProps) {
  const s = sizes[size];
  const textColor = variant === "light" ? "text-white" : "text-brand-navy";
  const taglineColor = variant === "light" ? "text-white/60" : "text-brand-slate";

  return (
    <Link href="/" className="group flex items-center gap-3">
      <div
        className={`${s.icon} relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl shadow-lg transition-transform duration-300 group-hover:scale-105`}
        style={{
          background: "linear-gradient(135deg, #0B5ED7 0%, #059669 100%)",
          boxShadow: "0 8px 24px rgba(11, 94, 215, 0.35)",
        }}
      >
        <svg viewBox="0 0 40 40" fill="none" className="h-[70%] w-[70%]" aria-hidden="true">
          <path
            d="M20 6v28M6 20h28"
            stroke="white"
            strokeWidth="3.5"
            strokeLinecap="round"
          />
          <path
            d="M20 8c-4 0-7 3-7 7s3 7 7 7 7-3 7-7-3-7-7-7z"
            stroke="white"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.5"
          />
          <circle cx="20" cy="20" r="14" stroke="white" strokeWidth="1.5" opacity="0.3" />
        </svg>
      </div>
      <div>
        <span className={`block ${s.text} font-bold tracking-tight ${textColor}`}>
          Sompacare
        </span>
        {showTagline && (
          <span className={`block ${s.tagline} font-semibold tracking-[0.15em] uppercase ${taglineColor}`}>
            Healthcare Workforce
          </span>
        )}
      </div>
    </Link>
  );
}

export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <div
      className={`${className} relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl`}
      style={{
        background: "linear-gradient(135deg, #0B5ED7 0%, #059669 100%)",
      }}
    >
      <svg viewBox="0 0 40 40" fill="none" className="h-[70%] w-[70%]" aria-hidden="true">
        <path d="M20 6v28M6 20h28" stroke="white" strokeWidth="3.5" strokeLinecap="round" />
        <circle cx="20" cy="20" r="14" stroke="white" strokeWidth="1.5" opacity="0.3" />
      </svg>
    </div>
  );
}
