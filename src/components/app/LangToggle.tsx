import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function LangToggle({ className }: { className?: string }) {
  const { t, i18n } = useTranslation();
  return (
    <Button
      variant="ghost"
      size="sm"
      className={cn("gap-2", className)}
      onClick={() => void i18n.changeLanguage(i18n.language === "ar" ? "en" : "ar")}
    >
      <Globe />
      {i18n.language === "ar" ? t("common.switchToEnglish") : t("common.switchToArabic")}
    </Button>
  );
}
