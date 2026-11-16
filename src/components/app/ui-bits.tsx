import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function PageHeader({ title, subtitle, action }: { title: string; subtitle?: string; action?: ReactNode }) {
  return (
    <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold md:text-3xl">{title}</h1>
        {subtitle && <p className="mt-1 text-muted-foreground">{subtitle}</p>}
      </div>
      {action}
    </header>
  );
}

export function StatCard({ label, value, icon: Icon, tone = "primary", hint }: { label: string; value: ReactNode; icon: LucideIcon; tone?: "primary" | "success" | "warning" | "destructive"; hint?: ReactNode }) {
  const tones = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/12 text-success",
    warning: "bg-warning/15 text-warning-foreground",
    destructive: "bg-destructive/10 text-destructive",
  } as const;
  return (
    <Card className="border-border/70 shadow-card">
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-sm font-medium text-muted-foreground">{label}</p>
            <p className="num mt-2 truncate text-2xl font-bold">{value}</p>
          </div>
          <span className={cn("rounded-xl p-2.5", tones[tone])}>
            <Icon className="h-5 w-5" />
          </span>
        </div>
        {hint && <div className="mt-3 text-sm">{hint}</div>}
      </CardContent>
    </Card>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="col-span-full rounded-2xl border border-dashed border-border py-12 text-center text-muted-foreground">{children}</div>;
}

export function Bar({ value, tone = "primary" }: { value: number; tone?: "primary" | "success" | "warning" | "destructive" }) {
  const bg = { primary: "bg-primary", success: "bg-success", warning: "bg-warning", destructive: "bg-destructive" }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className={cn("h-full rounded-full transition-all duration-700", bg)} style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
    </div>
  );
}

export const CHART_COLORS = ["var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)", "var(--primary)"];
