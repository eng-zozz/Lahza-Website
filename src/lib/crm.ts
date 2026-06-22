import { supabase } from "@/integrations/supabase/client";

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "PROPOSAL" | "WON" | "LOST";
export type LeadSource = "WEBSITE" | "REFERRAL" | "SOCIAL" | "OUTBOUND" | "EVENT" | "OTHER";

export interface Lead {
  id: string;
  name: string;
  company: string | null;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  source: LeadSource;
  value: number;
  notes: string | null;
  position: number;
  created_at: string;
}

export const LEAD_STATUSES: { key: LeadStatus; label: string }[] = [
  { key: "NEW", label: "New" },
  { key: "CONTACTED", label: "Contacted" },
  { key: "QUALIFIED", label: "Qualified" },
  { key: "PROPOSAL", label: "Proposal" },
  { key: "WON", label: "Won" },
  { key: "LOST", label: "Lost" },
];

export async function fetchLeads(): Promise<Lead[]> {
  const { data, error } = await supabase
    .from("leads")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Lead[];
}

export async function createLead(input: Partial<Lead>) {
  const { error } = await supabase.from("leads").insert({
    name: input.name!,
    company: input.company ?? null,
    email: input.email ?? null,
    phone: input.phone ?? null,
    status: input.status ?? "NEW",
    source: input.source ?? "WEBSITE",
    value: input.value ?? 0,
    notes: input.notes ?? null,
  });
  if (error) throw error;
}

export async function updateLeadStatus(id: string, status: LeadStatus, position: number) {
  const { error } = await supabase.from("leads").update({ status, position }).eq("id", id);
  if (error) throw error;
}

export async function deleteLead(id: string) {
  const { error } = await supabase.from("leads").delete().eq("id", id);
  if (error) throw error;
}
