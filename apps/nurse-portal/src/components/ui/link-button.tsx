import Link from "next/link";
import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

type Props = {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "success" | "outline";
  size?: "sm" | "md" | "lg";
  className?: string;
};

const variants = {
  primary: "bg-primary text-white hover:bg-primary-dark shadow-sm",
  secondary: "bg-white text-navy border border-border hover:bg-slate-50",
  outline: "bg-white text-navy border border-border hover:bg-slate-50",
  ghost: "bg-transparent text-muted hover:bg-slate-100 hover:text-navy",
  success: "bg-success text-white hover:bg-emerald-700 shadow-sm",
};

const sizes = {
  sm: "h-9 px-3 text-sm",
  md: "h-11 px-4 text-sm font-semibold",
  lg: "h-12 px-6 text-base font-semibold",
};

export function LinkButton({
  href,
  children,
  variant = "primary",
  size = "md",
  className,
}: Props) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-xl transition-colors",
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </Link>
  );
}
