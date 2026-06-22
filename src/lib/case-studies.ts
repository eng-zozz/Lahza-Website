import { supabase } from "@/integrations/supabase/client";
import type { Database, Json } from "@/integrations/supabase/types";

type CaseStudyRow = Database["public"]["Tables"]["case_studies"]["Row"];

export interface CaseStudyMetric {
  label: string;
  before: string;
  after: string;
}

export interface CaseStudy {
  id: string;
  slug: string;
  company_name: string;
  client_name: string | null;
  industry: string | null;
  summary: string;
  logo_url: string | null;
  gallery_urls: string[];
  challenge: string | null;
  solution: string | null;
  technologies: string[];
  services: string[];
  results: string[];
  metrics: CaseStudyMetric[];
  timeline: string | null;
  published: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

function normalize(row: CaseStudyRow): CaseStudy {
  return { ...row, metrics: (row.metrics as unknown as CaseStudyMetric[]) ?? [] };
}

/** Public + staff list. Staff (logged in, admin/team) sees drafts too via RLS. */
export async function fetchCaseStudies(): Promise<CaseStudy[]> {
  const { data, error } = await supabase
    .from("case_studies")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(normalize);
}

export async function fetchCaseStudyBySlug(slug: string): Promise<CaseStudy | null> {
  const { data, error } = await supabase
    .from("case_studies")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw error;
  return data ? normalize(data) : null;
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export type CaseStudyInput = Omit<CaseStudy, "id" | "created_at" | "updated_at">;

export async function createCaseStudy(input: CaseStudyInput) {
  const { data, error } = await supabase
    .from("case_studies")
    .insert({ ...input, metrics: input.metrics as unknown as Json })
    .select("id")
    .single();
  if (error) throw error;
  return data.id as string;
}

export async function updateCaseStudy(id: string, patch: Partial<CaseStudyInput>) {
  const { error } = await supabase
    .from("case_studies")
    .update({ ...patch, metrics: patch.metrics as unknown as Json | undefined })
    .eq("id", id);
  if (error) throw error;
}

export async function deleteCaseStudy(id: string) {
  const { error } = await supabase.from("case_studies").delete().eq("id", id);
  if (error) throw error;
}

/** Uploads an image to the public case-study-images bucket, returns its public URL. */
export async function uploadCaseStudyImage(file: File): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("case-study-images").upload(path, file, {
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("case-study-images").getPublicUrl(path);
  return data.publicUrl;
}

/** Deletes an uploaded image given its public URL (best-effort, ignores not-found). */
export async function deleteCaseStudyImage(publicUrl: string) {
  const marker = "/case-study-images/";
  const idx = publicUrl.indexOf(marker);
  if (idx === -1) return;
  const path = publicUrl.slice(idx + marker.length);
  await supabase.storage.from("case-study-images").remove([path]);
}
