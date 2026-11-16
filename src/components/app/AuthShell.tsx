import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { LovableMark } from "@lovable.dev/cloud-auth-js/react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { lovable } from "@/integrations/lovable";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Logo } from "./Brand";
import { LangToggle } from "./LangToggle";

export function AuthShell({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col items-center bg-background px-4 pb-10 pt-16">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-gradient-ink" />
      <div className="absolute end-4 top-4"><LangToggle className="text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground" /></div>
      <div className="relative w-full max-w-md">
        <Link to="/" className="mb-6 flex justify-center"><Logo light /></Link>
        <Card className="border-0 shadow-card">
          <CardContent className="p-7">
            <h1 className="text-2xl font-bold">{title}</h1>
            {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
            <div className="mt-6">{children}</div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function SocialButtons() {
  const { t } = useTranslation();
  const go = async (p: "google" | "lovable") => {
    const r = await lovable.auth.signInWithOAuth(p, { redirect_uri: window.location.origin + "/login" });
    if (r.error) toast.error(r.error.message ?? t("auth.errors.generic"));
  };
  return (
    <div className="space-y-2">
      <div className="my-5 flex items-center gap-3 text-xs text-muted-foreground">
        <span className="h-px flex-1 bg-border" />{t("auth.login.orContinueWith")}<span className="h-px flex-1 bg-border" />
      </div>
      <Button type="button" variant="outline" className="w-full" onClick={() => go("google")}>
        <svg viewBox="0 0 24 24" aria-hidden><path fill="currentColor" d="M21.35 11.1h-9.17v2.73h6.51c-.33 3.81-3.5 5.44-6.5 5.44C8.36 19.27 5 16.25 5 12c0-4.1 3.2-7.27 7.2-7.27 3.09 0 4.9 1.97 4.9 1.97L19 4.72S16.56 2 12.1 2C6.42 2 2.03 6.8 2.03 12c0 5.05 4.13 10 10.22 10 5.35 0 9.25-3.67 9.25-9.09 0-1.15-.15-1.81-.15-1.81Z" /></svg>
        {t("authx.google")}
      </Button>
      <Button type="button" variant="outline" className="w-full" onClick={() => go("lovable")}>
        <LovableMark />
        {t("authx.lovable")}
      </Button>
    </div>
  );
}
