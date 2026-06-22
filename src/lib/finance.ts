import { supabase } from "@/integrations/supabase/client";

export type FinanceType = "REVENUE" | "EXPENSE";

export interface FinanceEntry {
  id: string;
  type: FinanceType;
  amount: number;
  category: string;
  description: string | null;
  entry_date: string;
  client_id: string | null;
  project_id: string | null;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export const EXPENSE_CATEGORIES = [
  "Salaries & Contractors",
  "Software & Tools",
  "Marketing & Ads",
  "Office & Admin",
  "Hosting & Infrastructure",
  "Other",
];

export const REVENUE_CATEGORIES = ["Project Payment", "Retainer", "Consultation Fee", "Other"];

export interface FinanceEntryInput {
  type: FinanceType;
  amount: number;
  category: string;
  description?: string | null;
  entry_date: string;
  client_id?: string | null;
  project_id?: string | null;
}

export async function fetchFinanceEntries(): Promise<FinanceEntry[]> {
  const { data, error } = await supabase
    .from("finance_entries")
    .select("*")
    .order("entry_date", { ascending: false });
  if (error) throw error;
  return (data ?? []) as FinanceEntry[];
}

export async function createFinanceEntry(input: FinanceEntryInput) {
  const { error } = await supabase.from("finance_entries").insert({
    type: input.type,
    amount: input.amount,
    category: input.category,
    description: input.description ?? null,
    entry_date: input.entry_date,
    client_id: input.client_id ?? null,
    project_id: input.project_id ?? null,
  });
  if (error) throw error;
}

export async function updateFinanceEntry(id: string, patch: Partial<FinanceEntryInput>) {
  const { error } = await supabase.from("finance_entries").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteFinanceEntry(id: string) {
  const { error } = await supabase.from("finance_entries").delete().eq("id", id);
  if (error) throw error;
}

export function monthKey(dateStr: string) {
  return dateStr.slice(0, 7); // YYYY-MM
}

export function summarize(entries: FinanceEntry[]) {
  const totalRevenue = entries
    .filter((e) => e.type === "REVENUE")
    .reduce((s, e) => s + Number(e.amount), 0);
  const totalExpenses = entries
    .filter((e) => e.type === "EXPENSE")
    .reduce((s, e) => s + Number(e.amount), 0);
  return { totalRevenue, totalExpenses, netProfit: totalRevenue - totalExpenses };
}

export function monthlySeries(entries: FinanceEntry[]) {
  const map = new Map<string, { month: string; revenue: number; expenses: number }>();
  for (const e of entries) {
    const key = monthKey(e.entry_date);
    if (!map.has(key)) map.set(key, { month: key, revenue: 0, expenses: 0 });
    const row = map.get(key)!;
    if (e.type === "REVENUE") row.revenue += Number(e.amount);
    else row.expenses += Number(e.amount);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}
