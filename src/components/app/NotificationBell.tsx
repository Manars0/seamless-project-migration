import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertCircle, AlertTriangle, Bell, CheckCheck, Sparkles, Target, Trophy } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { useAllData } from "@/lib/data";
import { notices, type Lang } from "@/lib/finance";
import { cn } from "@/lib/utils";

const ICON = { tip: Sparkles, achievement: Trophy, warning: AlertTriangle, alert: AlertCircle, goal: Target };
const TONE = { tip: "bg-primary/10 text-primary", achievement: "bg-success/12 text-success", warning: "bg-warning/15 text-warning-foreground", alert: "bg-destructive/10 text-destructive", goal: "bg-accent text-accent-foreground" };
const KEY = "fintwin_read_notices";

export function NotificationBell() {
  const { t, i18n } = useTranslation();
  const d = useAllData();
  const list = useMemo(() => notices(d, i18n.language as Lang), [d, i18n.language]);
  const [read, setRead] = useState<string[]>([]);
  useEffect(() => {
    try { setRead(JSON.parse(localStorage.getItem(KEY) ?? "[]")); } catch { /* ignore */ }
  }, []);
  const mark = (ids: string[]) => {
    const next = [...new Set([...read, ...ids])];
    setRead(next);
    localStorage.setItem(KEY, JSON.stringify(next));
  };
  const unread = list.filter((n) => !read.includes(n.id));

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label={t("notifications.title")}>
          <Bell className="!h-5 !w-5" />
          {unread.length > 0 && (
            <span className="absolute -top-0.5 end-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unread.length > 9 ? "9+" : unread.length}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b px-4 py-3">
          <h3 className="text-sm font-semibold">{t("notifications.title")}</h3>
          {unread.length > 0 && (
            <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => mark(unread.map((n) => n.id))}>
              <CheckCheck /> {t("notifications.markAllRead")}
            </Button>
          )}
        </div>
        <div className="max-h-96 overflow-y-auto">
          {list.length === 0 && <p className="px-4 py-8 text-center text-sm text-muted-foreground">{t("notifications.noNotifications")}</p>}
          {list.map((n) => {
            const Icon = ICON[n.type];
            const isRead = read.includes(n.id);
            return (
              <button key={n.id} onClick={() => mark([n.id])} className={cn("flex w-full gap-3 border-b px-4 py-3 text-start last:border-0 hover:bg-muted/60", !isRead && "bg-primary/5")}>
                <span className={cn("flex h-8 w-8 shrink-0 items-center justify-center rounded-lg", TONE[n.type])}><Icon className="h-4 w-4" /></span>
                <span className="min-w-0">
                  <span className="block text-sm font-medium">{n.title}</span>
                  <span className="block truncate text-xs text-muted-foreground">{n.message}</span>
                </span>
              </button>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
