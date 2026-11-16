import { TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

export function Logo({ className, light }: { className?: string; light?: boolean }) {
  return (
    <span className={cn("flex items-center gap-2.5", className)}>
      <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-primary text-primary-foreground shadow-glow">
        <TrendingUp className="h-5 w-5" />
      </span>
      <span className={cn("font-display text-lg font-bold tracking-tight", light ? "text-sidebar-foreground" : "text-foreground")} dir="ltr">
        FinTwin <span className="text-primary">AI</span>
      </span>
    </span>
  );
}
