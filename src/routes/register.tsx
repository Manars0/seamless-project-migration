import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell, SocialButtons } from "@/components/app/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/register")({
  head: () => ({
    meta: [
      { title: "Create account — FinTwin AI" },
      { name: "description", content: "Create your free FinTwin AI account." },
      { property: "og:title", content: "Create account — FinTwin AI" },
      { property: "og:description", content: "Start your financial journey with FinTwin AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Register,
});

function Register() {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error(t("auth.register.passwordTooShort")); return; }
    if (password !== confirm) { toast.error(t("auth.register.passwordMismatch")); return; }
    setBusy(true);
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { full_name: name }, emailRedirectTo: window.location.origin + "/dashboard" },
    });
    setBusy(false);
    if (error) { toast.error(error.message.toLowerCase().includes("registered") ? t("auth.errors.emailInUse") : error.message); return; }
    setSent(true);
  };

  return (
    <AuthShell title={t("auth.register.title")} subtitle={t("auth.register.subtitle")}>
      {sent ? (
        <div className="space-y-4 text-center">
          <p className="rounded-lg bg-accent p-4 text-sm text-accent-foreground">{t("authx.checkEmail")}</p>
          <Button asChild variant="outline" className="w-full"><Link to="/login">{t("auth.register.signIn")}</Link></Button>
        </div>
      ) : (
        <>
          <form onSubmit={submit} className="space-y-4">
            <div>
              <Label htmlFor="name" className="mb-1.5 block">{t("auth.register.fullName")}</Label>
              <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder={t("auth.register.fullNamePlaceholder")} />
            </div>
            <div>
              <Label htmlFor="email" className="mb-1.5 block">{t("auth.register.email")}</Label>
              <Input id="email" type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.register.emailPlaceholder")} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pw" className="mb-1.5 block">{t("auth.register.password")}</Label>
                <Input id="pw" type="password" dir="ltr" required value={password} onChange={(e) => setPassword(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pw2" className="mb-1.5 block">{t("auth.register.confirmPassword")}</Label>
                <Input id="pw2" type="password" dir="ltr" required value={confirm} onChange={(e) => setConfirm(e.target.value)} />
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={busy}>{busy ? t("auth.register.signingUp") : t("auth.register.signUp")}</Button>
          </form>
          <SocialButtons />
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {t("auth.register.haveAccount")} <Link to="/login" className="font-medium text-primary hover:underline">{t("auth.register.signIn")}</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
