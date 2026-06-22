import { supabase } from "@/integrations/supabase/client";
import type { Project } from "@/lib/projects";

export interface ClientDirectoryEntry {
  id: string;
  user_id: string | null;
  company: string | null;
  phone: string | null;
  website: string | null;
  notes: string | null;
  name: string | null;
  email: string | null;
  created_at: string;
  project_count: number;
}

export interface ClientDetail extends ClientDirectoryEntry {
  projects: Project[];
}

export async function fetchClientsDirectory(): Promise<ClientDirectoryEntry[]> {
  const { data: clients, error } = await supabase
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) throw error;
  const list = clients ?? [];
  if (list.length === 0) return [];

  const userIds = [...new Set(list.map((c) => c.user_id).filter(Boolean))] as string[];
  const clientIds = list.map((c) => c.id);

  const [{ data: profiles }, { data: projects }] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id, name, email").in("id", userIds)
      : Promise.resolve({
          data: [] as { id: string; name: string | null; email: string | null }[],
        }),
    supabase.from("projects").select("id, client_id").in("client_id", clientIds),
  ]);

  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const countMap = new Map<string, number>();
  for (const p of projects ?? []) {
    if (!p.client_id) continue;
    countMap.set(p.client_id, (countMap.get(p.client_id) ?? 0) + 1);
  }

  return list.map((c) => {
    const profile = c.user_id ? profileMap.get(c.user_id) : undefined;
    return {
      id: c.id,
      user_id: c.user_id,
      company: c.company,
      phone: c.phone,
      website: c.website,
      notes: c.notes,
      name: profile?.name ?? null,
      email: profile?.email ?? null,
      created_at: c.created_at,
      project_count: countMap.get(c.id) ?? 0,
    };
  });
}

export interface ClientInput {
  company?: string | null;
  phone?: string | null;
  website?: string | null;
  notes?: string | null;
}

/** Staff: manually register a client company (no portal login required). */
export async function createClient(input: ClientInput) {
  const { data, error } = await supabase
    .from("clients")
    .insert({
      company: input.company || null,
      phone: input.phone || null,
      website: input.website || null,
      notes: input.notes || null,
    })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateClient(clientId: string, input: ClientInput) {
  const { error } = await supabase
    .from("clients")
    .update({
      company: input.company || null,
      phone: input.phone || null,
      website: input.website || null,
      notes: input.notes || null,
    })
    .eq("id", clientId);
  if (error) throw error;
}

export async function fetchClientDetail(clientId: string): Promise<ClientDetail | null> {
  const { data: client, error } = await supabase
    .from("clients")
    .select("*")
    .eq("id", clientId)
    .maybeSingle();
  if (error) throw error;
  if (!client) return null;

  const [{ data: profile }, { data: projects }] = await Promise.all([
    client.user_id
      ? supabase.from("profiles").select("id, name, email").eq("id", client.user_id).maybeSingle()
      : Promise.resolve({
          data: null as { id: string; name: string | null; email: string | null } | null,
        }),
    supabase
      .from("projects")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false }),
  ]);

  return {
    id: client.id,
    user_id: client.user_id,
    company: client.company,
    phone: client.phone,
    website: client.website,
    notes: client.notes,
    name: profile?.name ?? null,
    email: profile?.email ?? null,
    created_at: client.created_at,
    project_count: (projects ?? []).length,
    projects: (projects ?? []) as Project[],
  };
}
