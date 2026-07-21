import type { LucideIcon } from "lucide-react";
import { LinkButton } from "@/components/ui/link-button";
import { Card, CardContent } from "@/components/ui/card";

type EmptyStateProps = {
  icon?: LucideIcon;
  title: string;
  description: string;
  action?: { label: string; href: string };
};

export function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <Card>
      <CardContent className="p-8 text-center">
        {Icon && (
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-slate-100">
            <Icon className="h-6 w-6 text-muted" />
          </div>
        )}
        <p className="font-semibold text-navy">{title}</p>
        <p className="mt-2 text-sm text-muted">{description}</p>
        {action && (
          <LinkButton href={action.href} className="mt-4">
            {action.label}
          </LinkButton>
        )}
      </CardContent>
    </Card>
  );
}
