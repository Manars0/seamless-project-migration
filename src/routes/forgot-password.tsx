import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/app/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/forgot-password")({
  head: () => ({
    meta: [
      { title: "Reset password — FinTwin AI" },
      { name: "description", content: "Get a link to reset your FinTwin AI password." },
      { property: "og:title", content: "Reset password — FinTwin AI" },
      { property: "og:description", content: "Reset your FinTwin AI password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Forgot,
});

function Forgot() {
  const { t } = useTranslation();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "/reset-password" });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    setSent(true);
  };
  return (
    <AuthShell title={t("auth.forgotPassword.title")} subtitle={t("auth.forgotPassword.subtitle")}>
      {sent ? (
        <div className="space-y-3 text-center">
          <h2 className="text-lg font-bold">{t("auth.forgotPassword.successTitle")}</h2>
          <p className="text-sm text-muted-foreground">{t("auth.forgotPassword.successMessage")}</p>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div>
            <Label htmlFor="email" className="mb-1.5 block">{t("auth.forgotPassword.email")}</Label>
            <Input id="email" type="email" dir="ltr" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder={t("auth.forgotPassword.emailPlaceholder")} />
          </div>
          <Button type="submit" className="w-full" disabled={busy}>{busy ? t("auth.forgotPassword.sending") : t("auth.forgotPassword.sendLink")}</Button>
        </form>
      )}
      <p className="mt-6 text-center text-sm"><Link to="/login" className="text-primary hover:underline">{t("auth.forgotPassword.backToLogin")}</Link></p>
    </AuthShell>
  );
}
