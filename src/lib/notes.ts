import { supabase } from "@/integrations/supabase/client";

export type NoteKind = "NOTE" | "TODO";

export interface StaffNote {
  id: string;
  user_id: string;
  kind: NoteKind;
  title: string;
  content: string | null;
  is_done: boolean;
  due_date: string | null;
  position: number;
  created_at: string;
  updated_at: string;
}

export async function fetchStaffNotes(): Promise<StaffNote[]> {
  const { data, error } = await supabase
    .from("staff_notes")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as StaffNote[];
}

export async function createStaffNote(input: {
  kind: NoteKind;
  title: string;
  content?: string | null;
  due_date?: string | null;
}) {
  const { error } = await supabase.from("staff_notes").insert({
    kind: input.kind,
    title: input.title,
    content: input.content ?? null,
    due_date: input.due_date ?? null,
  });
  if (error) throw error;
}

export async function updateStaffNote(
  id: string,
  patch: Partial<Pick<StaffNote, "title" | "content" | "is_done" | "due_date">>,
) {
  const { error } = await supabase.from("staff_notes").update(patch).eq("id", id);
  if (error) throw error;
}

export async function deleteStaffNote(id: string) {
  const { error } = await supabase.from("staff_notes").delete().eq("id", id);
  if (error) throw error;
}
