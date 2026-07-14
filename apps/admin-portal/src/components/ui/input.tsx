import { cn } from "@/lib/utils";
import { InputHTMLAttributes, forwardRef } from "react";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      className={cn(
        "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-navy outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-primary/20",
        className
      )}
      {...props}
    />
  )
);
Input.displayName = "Input";

export const Label = ({
  className,
  ...props
}: React.LabelHTMLAttributes<HTMLLabelElement>) => (
  <label className={cn("text-sm font-semibold text-navy", className)} {...props} />
);

export const Select = forwardRef<
  HTMLSelectElement,
  React.SelectHTMLAttributes<HTMLSelectElement>
>(({ className, ...props }, ref) => (
  <select
    ref={ref}
    className={cn(
      "h-11 w-full rounded-xl border border-border bg-white px-3 text-sm text-navy outline-none focus:border-primary focus:ring-2 focus:ring-primary/20",
      className
    )}
    {...props}
  />
));
Select.displayName = "Select";
