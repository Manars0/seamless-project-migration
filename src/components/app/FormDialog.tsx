import { useEffect, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useSaveRow, type TableName } from "@/lib/data";

export type Field = {
  name: string;
  label: string;
  type: "text" | "number" | "date" | "select" | "textarea";
  options?: { value: string; label: string }[];
  required?: boolean;
  placeholder?: string;
  half?: boolean;
};

type Values = Record<string, string>;

export function FormDialog({
  open, onOpenChange, title, table, fields, initial, id,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  title: ReactNode;
  table: TableName;
  fields: Field[];
  initial: Record<string, unknown>;
  id?: string | undefined;
}) {
  const { t } = useTranslation();
  const save = useSaveRow(table);
  const [v, setV] = useState<Values>({});

  useEffect(() => {
    if (open) {
      const init: Values = {};
      for (const f of fields) init[f.name] = initial[f.name] == null ? "" : String(initial[f.name]);
      setV(init);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const values: Record<string, unknown> = {};
    for (const f of fields) {
      const raw = v[f.name]?.trim() ?? "";
      values[f.name] = f.type === "number" ? (raw === "" ? 0 : Number(raw)) : raw === "" ? null : raw;
    }
    try {
      await save.mutateAsync({ id, values });
      toast.success(t("misc.saved"));
      onOpenChange(false);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : t("common.error"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={submit} className="grid grid-cols-2 gap-4">
          {fields.map((f) => (
            <div key={f.name} className={f.half ? "col-span-2 sm:col-span-1" : "col-span-2"}>
              <Label htmlFor={`f-${f.name}`} className="mb-1.5 block">{f.label}</Label>
              {f.type === "select" ? (
                <Select value={v[f.name] ?? ""} onValueChange={(x) => setV((p) => ({ ...p, [f.name]: x }))}>
                  <SelectTrigger id={`f-${f.name}`}><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {f.options?.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              ) : f.type === "textarea" ? (
                <Textarea id={`f-${f.name}`} value={v[f.name] ?? ""} placeholder={f.placeholder} onChange={(e) => setV((p) => ({ ...p, [f.name]: e.target.value }))} />
              ) : (
                <Input
                  id={`f-${f.name}`}
                  type={f.type}
                  step={f.type === "number" ? "any" : undefined}
                  min={f.type === "number" ? 0 : undefined}
                  required={f.required}
                  dir={f.type === "number" || f.type === "date" ? "ltr" : undefined}
                  placeholder={f.placeholder}
                  value={v[f.name] ?? ""}
                  onChange={(e) => setV((p) => ({ ...p, [f.name]: e.target.value }))}
                />
              )}
            </div>
          ))}
          <DialogFooter className="col-span-2 mt-2 gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>{t("common.cancel")}</Button>
            <Button type="submit" disabled={save.isPending}>{t("common.save")}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
