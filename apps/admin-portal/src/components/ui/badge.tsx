import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

export function Badge({
  className,
  variant = "default",
  ...props
}: HTMLAttributes<HTMLSpanElement> & { variant?: "default" | "success" | "warning" | "blue" | "danger" }) {
  const variants = {
    default: "bg-slate-100 text-slate-700",
    success: "bg-emerald-50 text-success",
    warning: "bg-amber-50 text-amber-700",
    blue: "bg-blue-50 text-primary",
    danger: "bg-red-50 text-red-700",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}
