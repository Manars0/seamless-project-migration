import { MoreHorizontal, Pencil, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useDeleteRow, type TableName } from "@/lib/data";

export function RowActions({ table, id, onEdit, confirmText }: { table: TableName; id: string; onEdit: () => void; confirmText: string }) {
  const { t } = useTranslation();
  const del = useDeleteRow(table);
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t("common.actions")}>
          <MoreHorizontal />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={onEdit}><Pencil className="h-4 w-4" />{t("common.edit")}</DropdownMenuItem>
        <DropdownMenuItem
          className="text-destructive focus:text-destructive"
          onClick={async () => {
            if (!window.confirm(confirmText)) return;
            try {
              await del.mutateAsync(id);
              toast.success(t("misc.deleted"));
            } catch (e) {
              toast.error(e instanceof Error ? e.message : t("common.error"));
            }
          }}
        >
          <Trash2 className="h-4 w-4" />{t("common.delete")}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
