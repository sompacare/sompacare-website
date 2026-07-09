import Image from "next/image";
import Link from "next/link";
import { BRAND_LOGO_ALT, BRAND_LOGO_SRC } from "@/lib/brand";

type LogoProps = {
  href?: string;
  subtitle?: string;
  height?: number;
  className?: string;
};

export function Logo({ href, subtitle, height = 32, className }: LogoProps) {
  const image = (
    <Image
      src={BRAND_LOGO_SRC}
      alt={BRAND_LOGO_ALT}
      width={Math.round(height * 2.2)}
      height={height}
      className="h-auto w-auto"
      style={{ maxHeight: height, width: "auto" }}
      priority
    />
  );

  const content = (
    <>
      {image}
      {subtitle ? <span className="text-sm font-semibold text-muted">{subtitle}</span> : null}
    </>
  );

  if (!href) {
    return <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>{content}</span>;
  }

  return (
    <Link href={href} className={`inline-flex shrink-0 items-center gap-2 ${className ?? ""}`}>
      {content}
    </Link>
  );
}
