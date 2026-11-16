import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type TableName = "transactions" | "goals" | "budgets" | "investments" | "debts";

/* eslint-disable @typescript-eslint/no-explicit-any */
export function useRows<T extends TableName>(table: T) {
  return useQuery({
    queryKey: ["rows", table],
    queryFn: async () => {
      const q = supabase.from(table as any).select("*");
      const ordered = table === "transactions" ? q.order("date", { ascending: false }) : q.order("created_at", { ascending: false });
      const { data, error } = await ordered;
      if (error) throw error;
      return (data ?? []) as unknown as Tables<T>[];
    },
  });
}

export function useAllData() {
  const tx = useRows("transactions");
  const goals = useRows("goals");
  const budgets = useRows("budgets");
  const investments = useRows("investments");
  const debts = useRows("debts");
  return {
    loading: tx.isLoading || goals.isLoading || budgets.isLoading || investments.isLoading || debts.isLoading,
    tx: tx.data ?? [],
    goals: goals.data ?? [],
    budgets: budgets.data ?? [],
    investments: investments.data ?? [],
    debts: debts.data ?? [],
  };
}

export function useSaveRow(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, values }: { id?: string; values: Record<string, unknown> }) => {
      if (id) {
        const { error } = await supabase.from(table as any).update(values as any).eq("id", id);
        if (error) throw error;
      } else {
        const { data: u } = await supabase.auth.getUser();
        if (!u.user) throw new Error("Not signed in");
        const { error } = await supabase.from(table as any).insert({ ...values, user_id: u.user.id } as any);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rows", table] }),
  });
}

export function useDeleteRow(table: TableName) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(table as any).delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["rows", table] }),
  });
}

export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async () => {
      const { data: u } = await supabase.auth.getUser();
      if (!u.user) return null;
      const { data, error } = await supabase.from("profiles").select("*").eq("user_id", u.user.id).maybeSingle();
      if (error) throw error;
      return { profile: data, user: u.user };
    },
  });
}

export function useCurrency() {
  const p = useProfile();
  return p.data?.profile?.currency ?? "SAR";
}
