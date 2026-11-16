import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { applyTheme, readSavedTheme, type Theme } from "@/lib/theme";
import { cn } from "@/lib/utils";

export function ThemeToggle({ className }: { className?: string }) {
  const { t } = useTranslation();
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => setTheme(readSavedTheme()), []);
  const next = theme === "dark" ? "light" : "dark";
  return (
    <Button variant="ghost" size="icon" aria-label={t("home.nav.theme")} className={cn(className)}
      onClick={() => { applyTheme(next); setTheme(next); }}>
      {theme === "dark" ? <Sun /> : <Moon />}
    </Button>
  );
}
