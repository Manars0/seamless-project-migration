import { useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ActivitySquare, BrainCircuit, Gauge } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/Brand";
import { LangToggle } from "@/components/app/LangToggle";
import hero from "@/assets/hero-twin.jpg";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "FinTwin AI — توأمك المالي الذكي" },
      { name: "description", content: "Your AI-powered financial twin: score, budgets, goals, investments, debt, simulator and an AI advisor in Arabic and English." },
      { property: "og:title", content: "FinTwin AI — Your AI financial twin" },
      { property: "og:description", content: "See your financial future before you live it. Track, simulate and get AI advice." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/dashboard" });
    });
  }, [navigate]);

  const features = [
    { icon: Gauge, label: t("landing.f1") },
    { icon: ActivitySquare, label: t("landing.f2") },
    { icon: BrainCircuit, label: t("landing.f3") },
  ];
  return (
    <div className="min-h-screen bg-gradient-ink text-sidebar-foreground">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <Logo light />
        <div className="flex items-center gap-2">
          <LangToggle className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" />
          <Button asChild variant="ghost" className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
            <Link to="/login">{t("landing.signIn")}</Link>
          </Button>
        </div>
      </header>
      <main className="mx-auto grid max-w-6xl items-center gap-10 px-6 pb-16 pt-6 lg:grid-cols-2 lg:pt-16">
        <div>
          <p className="mb-4 inline-flex rounded-full border border-sidebar-border bg-sidebar-accent/60 px-3 py-1 text-xs font-medium text-sidebar-primary">{t("landing.tagline")}</p>
          <h1 className="text-4xl font-bold leading-tight md:text-5xl">{t("landing.heading")}</h1>
          <p className="mt-5 max-w-xl text-lg text-sidebar-foreground/70">{t("landing.body")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="lg" className="shadow-glow"><Link to="/register">{t("landing.cta")}</Link></Button>
            <Button asChild size="lg" variant="outline" className="border-sidebar-border bg-transparent text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"><Link to="/login">{t("landing.signIn")}</Link></Button>
          </div>
          <ul className="mt-10 grid gap-3 sm:grid-cols-3">
            {features.map((f) => (
              <li key={f.label} className="flex items-center gap-2 text-sm text-sidebar-foreground/80">
                <f.icon className="h-4 w-4 text-success" /> {f.label}
              </li>
            ))}
          </ul>
        </div>
        <img src={hero} alt="" width={1280} height={960} className="w-full rounded-3xl border border-sidebar-border object-cover shadow-glow" />
      </main>
    </div>
  );
}
