"use client";

import { useState } from "react";
import { Check, Copy, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

type Props = {
  title: string;
  employeeNumber: string;
  signupUrl: string;
  signInUrl?: string;
  subtitle?: string;
  clerkInvited?: boolean;
};

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function EmployeeProvisionResult({
  title,
  employeeNumber,
  signupUrl,
  signInUrl,
  subtitle,
  clerkInvited,
}: Props) {
  const [copied, setCopied] = useState<string | null>(null);

  async function handleCopy(label: string, value: string) {
    try {
      await copyText(value);
      setCopied(label);
      window.setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt("Copy this value:", value);
    }
  }

  return (
    <Card className="border-emerald-200 bg-emerald-50/50">
      <CardContent className="space-y-4 p-6 text-sm text-navy">
        <p className="font-semibold text-emerald-800">{title}</p>
        {subtitle && <p>{subtitle}</p>}
        {clerkInvited !== undefined && (
          <p className="text-muted">
            {clerkInvited
              ? "Clerk invitation email sent."
              : "Clerk invitation skipped — share the signup link manually."}
          </p>
        )}
        <div className="flex flex-wrap items-center gap-2">
          <span>
            <span className="font-semibold">Employee number:</span> {employeeNumber}
          </span>
          <Button
            type="button"
            size="sm"
            variant="secondary"
            onClick={() => void handleCopy("id", employeeNumber)}
          >
            {copied === "id" ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            Copy ID
          </Button>
        </div>
        <div className="space-y-2">
          <p className="break-all font-medium">{signupUrl}</p>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => void handleCopy("signup", signupUrl)}
            >
              {copied === "signup" ? "Copied" : "Copy sign-up link"}
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={() => window.open(signupUrl, "_blank", "noopener,noreferrer")}
            >
              <ExternalLink className="h-4 w-4" />
              Open sign-up
            </Button>
          </div>
        </div>
        {signInUrl && (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            className="px-0"
            onClick={() => void handleCopy("signin", signInUrl)}
          >
            {copied === "signin" ? "Sign-in URL copied" : "Copy nurse portal sign-in URL"}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
