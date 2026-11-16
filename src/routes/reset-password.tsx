import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { AuthShell } from "@/components/app/AuthShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a new password — FinTwin AI" },
      { name: "description", content: "Set a new password for your FinTwin AI account." },
      { property: "og:title", content: "Choose a new password — FinTwin AI" },
      { property: "og:description", content: "Set a new FinTwin AI password." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Reset,
});

function Reset() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (pw.length < 6) { toast.error(t("auth.register.passwordTooShort")); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("authx.resetDone"));
    void navigate({ to: "/dashboard" });
  };
  return (
    <AuthShell title={t("authx.resetTitle")}>
      <form onSubmit={submit} className="space-y-4">
        <div>
          <Label htmlFor="pw" className="mb-1.5 block">{t("settings.security.newPassword")}</Label>
          <Input id="pw" type="password" dir="ltr" required value={pw} onChange={(e) => setPw(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={busy}>{t("authx.resetSave")}</Button>
      </form>
    </AuthShell>
  );
}
