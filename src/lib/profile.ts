import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

export async function fetchMyProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, email, phone, avatar_url")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  return (data as Profile) ?? null;
}

export async function upsertMyProfile(
  userId: string,
  fields: Partial<Pick<Profile, "name" | "phone" | "avatar_url" | "email">>,
) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, ...fields });
  if (error) throw error;
}
