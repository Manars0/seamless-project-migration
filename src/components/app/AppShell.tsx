import { useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ActivitySquare, ArrowLeftRight, BarChart3, BrainCircuit, CreditCard, LayoutDashboard, LogOut, Menu, PieChart, Settings, Target, TrendingUp } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useProfile } from "@/lib/data";
import { Logo } from "./Brand";
import { LangToggle } from "./LangToggle";
import { NotificationBell } from "./NotificationBell";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";

const NAV = [
  { to: "/dashboard", key: "nav.dashboard", icon: LayoutDashboard },
  { to: "/transactions", key: "nav.transactions", icon: ArrowLeftRight },
  { to: "/goals", key: "nav.goals", icon: Target },
  { to: "/budget", key: "nav.budget", icon: PieChart },
  { to: "/investments", key: "nav.investments", icon: TrendingUp },
  { to: "/debt", key: "nav.debt", icon: CreditCard },
  { to: "/ai-advisor", key: "nav.aiAdvisor", icon: BrainCircuit },
  { to: "/simulator", key: "nav.simulator", icon: ActivitySquare },
  { to: "/reports", key: "nav.reports", icon: BarChart3 },
  { to: "/settings", key: "nav.settings", icon: Settings },
] as const;

function SideContent({ onNav }: { onNav?: () => void }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const p = useProfile();
  const name = p.data?.profile?.full_name || p.data?.user.email?.split("@")[0] || "";
  return (
    <div className="flex h-full flex-col bg-gradient-ink text-sidebar-foreground">
      <div className="p-5">
        <Link to="/dashboard" onClick={onNav}><Logo light /></Link>
        <div className="mt-6 flex items-center gap-3 rounded-xl border border-sidebar-border bg-sidebar-accent/60 p-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary font-semibold text-sidebar-primary-foreground">
            {name.charAt(0).toUpperCase() || "?"}
          </span>
          <span className="min-w-0">
            <span className="block truncate text-sm font-semibold">{name}</span>
            <span className="block truncate text-xs text-sidebar-foreground/60" dir="ltr">{p.data?.user.email}</span>
          </span>
        </div>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto px-3">
        {NAV.map((n) => (
          <Link
            key={n.to}
            to={n.to}
            onClick={onNav}
            className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            activeProps={{ className: "!bg-sidebar-primary !text-sidebar-primary-foreground shadow-glow" }}
          >
            <n.icon className="h-5 w-5 shrink-0" />
            {t(n.key)}
          </Link>
        ))}
      </nav>
      <div className="space-y-1 border-t border-sidebar-border p-3">
        <LangToggle className="w-full justify-start text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-2 text-sidebar-foreground/70 hover:bg-destructive/20 hover:text-sidebar-accent-foreground"
          onClick={async () => {
            await supabase.auth.signOut();
            void navigate({ to: "/login" });
          }}
        >
          <LogOut /> {t("common.logout")}
        </Button>
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  const { i18n } = useTranslation();
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background">
      <aside className="hidden w-64 shrink-0 md:block"><SideContent /></aside>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side={i18n.language === "ar" ? "right" : "left"} className="w-72 border-0 p-0 [&>button]:hidden">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SideContent onNav={() => setOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex h-14 shrink-0 items-center justify-between border-b bg-card/70 px-4 backdrop-blur md:justify-end md:px-8">
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(true)} aria-label="Menu"><Menu /></Button>
          <NotificationBell />
        </div>
        <main className="flex-1 overflow-y-auto p-4 md:p-8"><div className="mx-auto max-w-7xl">{children}</div></main>
      </div>
    </div>
  );
}
