"use client";

import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";

type Props = {
  id: string;
  name?: string;
  autoComplete?: string;
  placeholder?: string;
  required?: boolean;
  minLength?: number;
};

export function PasswordField({
  id,
  name = "password",
  autoComplete = "current-password",
  placeholder,
  required = true,
  minLength,
}: Props) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        id={id}
        name={name}
        type={visible ? "text" : "password"}
        required={required}
        autoComplete={autoComplete}
        placeholder={placeholder}
        minLength={minLength}
        className="w-full rounded-xl border border-slate-200 px-4 py-3 pr-11 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
      />
      <button
        type="button"
        onClick={() => setVisible((value) => !value)}
        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-600"
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? <EyeOff className="h-4 w-4" aria-hidden="true" /> : <Eye className="h-4 w-4" aria-hidden="true" />}
      </button>
    </div>
  );
}
