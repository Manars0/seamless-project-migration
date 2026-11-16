import { useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PageHeader } from "@/components/app/ui-bits";
import { useProfile } from "@/lib/data";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings — FinTwin AI" }, { name: "description", content: "Manage your profile and preferences." }, { property: "og:title", content: "Settings — FinTwin AI" }, { property: "og:description", content: "Manage your profile and preferences." }] }),
  component: Settings,
});

const CURRENCIES = ["SAR", "USD", "EUR", "GBP", "AED", "EGP", "KWD", "QAR"];

function Settings() {
  const { t, i18n } = useTranslation();
  const qc = useQueryClient();
  const p = useProfile();
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [currency, setCurrency] = useState("SAR");
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    const pr = p.data?.profile;
    if (pr) {
      setName(pr.full_name ?? "");
      setPhone(pr.phone ?? "");
      setCurrency(pr.currency ?? "SAR");
    }
  }, [p.data]);

  const save = async () => {
    const uid = p.data?.user.id;
    if (!uid) return;
    setBusy(true);
    const values = { full_name: name, phone: phone || null, currency, preferred_language: i18n.language === "en" ? "en" : "ar" };
    const { error } = p.data?.profile
      ? await supabase.from("profiles").update(values).eq("user_id", uid)
      : await supabase.from("profiles").insert({ ...values, user_id: uid });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(t("misc.saved"));
    void qc.invalidateQueries({ queryKey: ["profile"] });
  };

  const changePw = async () => {
    if (pw.length < 6) { toast.error(t("auth.register.passwordTooShort")); return; }
    const { error } = await supabase.auth.updateUser({ password: pw });
    if (error) { toast.error(error.message); return; }
    setPw("");
    toast.success(t("misc.saved"));
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title={t("settings.title")} subtitle={t("settings.subtitle")} />
      <div className="space-y-6">
        <Card className="shadow-card">
          <CardHeader><CardTitle>{t("settings.profile.title")}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2"><Label className="mb-1.5 block">{t("settings.profile.email")}</Label><Input disabled dir="ltr" value={p.data?.user.email ?? ""} /></div>
            <div><Label htmlFor="n" className="mb-1.5 block">{t("settings.profile.fullName")}</Label><Input id="n" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("settings.profile.fullNamePlaceholder")} /></div>
            <div><Label htmlFor="ph" className="mb-1.5 block">{t("settings.profile.phone")}</Label><Input id="ph" dir="ltr" value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader><CardTitle>{t("settings.preferences.title")}</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="lang" className="mb-1.5 block">{t("settings.preferences.language")}</Label>
              <select id="lang" value={i18n.language} onChange={(e) => void i18n.changeLanguage(e.target.value)} className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm">
                <option value="ar">العربية</option><option value="en">English</option>
              </select>
            </div>
            <div>
              <Label htmlFor="cur" className="mb-1.5 block">{t("settings.preferences.currency")}</Label>
              <select id="cur" value={currency} onChange={(e) => setCurrency(e.target.value)} className="h-9 w-full rounded-md border border-input bg-card px-3 text-sm">
                {CURRENCIES.map((c) => <option key={c} value={c}>{t(`settings.currencies.${c}`)}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2"><Button onClick={save} disabled={busy}>{busy ? t("settings.profile.saving") : t("settings.profile.saveChanges")}</Button></div>
          </CardContent>
        </Card>
        <Card className="shadow-card">
          <CardHeader><CardTitle>{t("settings.security.title")}</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
            <div className="flex-1"><Label htmlFor="pw" className="mb-1.5 block">{t("settings.security.newPassword")}</Label><Input id="pw" type="password" dir="ltr" value={pw} onChange={(e) => setPw(e.target.value)} /></div>
            <Button variant="outline" onClick={changePw}>{t("settings.security.updatePassword")}</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
