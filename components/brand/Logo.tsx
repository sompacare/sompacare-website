import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO_ALT, BRAND_LOGO_SRC } from "@/lib/brand";

type LogoProps = {
  variant?: "light" | "dark";
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
};

const heights = {
  sm: 48,
  md: 56,
  lg: 72,
} as const;

export function Logo({ size = "md" }: LogoProps) {
  const height = heights[size];

  return (
    <Link href="/" className="group inline-flex shrink-0 items-center transition-transform duration-300 group-hover:scale-[1.02]">
      <Image
        src={BRAND_LOGO_SRC}
        alt={BRAND_LOGO_ALT}
        width={Math.round(height * 2.2)}
        height={height}
        className="h-auto w-auto"
        style={{ maxHeight: height, width: "auto" }}
        priority
      />
    </Link>
  );
}

export function LogoMark({ className = "h-10 w-10" }: { className?: string }) {
  return (
    <span className={`${className} relative inline-flex shrink-0 overflow-hidden`}>
      <Image
        src={BRAND_LOGO_SRC}
        alt={BRAND_LOGO_ALT}
        width={80}
        height={40}
        className="h-full w-full object-contain object-left"
      />
    </span>
  );
}
