import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, SocialButtons } from "@/components/app/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — FinTwin AI" },
      { name: "description", content: "Sign in to your FinTwin AI account." },
      { property: "og:title", content: "Sign in — FinTwin AI" },
      { property: "og:description", content: "Sign in to your FinTwin AI financial twin." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Login,
});

function Login() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => data.session && navigate({ to: "/dashboard" }));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => s && navigate({ to: "/dashboard" }));
    return () => data.subscription.unsubscribe();
  }, [navigate]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);
    if (error) toast.error(error.message.includes("Invalid") ? t("auth.errors.invalidCredentials") : error.message);
  };

  return (
    <AuthShell title={t("auth.login.title")} subtitle={t("auth.login.subtitle")}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="email" className="mb-1.5 block">{t("auth.login.email")}</Label>
          <Input id="email" type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.login.emailPlaceholder")} />
        </div>
        <div>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password">{t("auth.login.password")}</Label>
            <Link to="/forgot-password" className="text-xs text-primary hover:underline">{t("auth.login.forgotPassword")}</Link>
          </div>
          <Input id="password" type="password" dir="ltr" required value={password} onChange={(e) => setPassword(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>{busy ? t("auth.login.signingIn") : t("auth.login.signIn")}</Button>
      </form>
      <SocialButtons />
      <p className="mt-6 text-center text-sm text-muted-foreground">
        {t("auth.login.noAccount")} <Link to="/register" className="font-medium text-primary hover:underline">{t("auth.login.createAccount")}</Link>
      </p>
      <p className="mt-4 rounded-lg bg-muted p-3 text-center text-xs text-muted-foreground">{t("authx.migratedNote")}</p>
    </AuthShell>
  );
}
