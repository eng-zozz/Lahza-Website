import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type AppRole = "SUPER_ADMIN" | "ADMIN" | "TEAM_MEMBER" | "CLIENT";

export interface ManagedUser {
  id: string;
  email: string | null;
  name: string | null;
  phone: string | null;
  role: AppRole;
  created_at: string;
}

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data: isSuper } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "SUPER_ADMIN",
  });
  const { data: isAdmin } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "ADMIN",
  });
  if (!isSuper && !isAdmin) {
    throw new Error("Forbidden: admin access required");
  }
  return Boolean(isSuper);
}

/** A DB trigger auto-creates a blank public.clients row whenever a user is
 * granted the CLIENT role (including transiently, e.g. on signup before an
 * admin assigns a staff role). If the final role isn't CLIENT, remove that
 * row — but only if it's still blank and has no projects attached, so we
 * never touch a real client record. */
async function cleanupStaleClientRecord(supabaseAdmin: any, userId: string, finalRole: AppRole) {
  if (finalRole === "CLIENT") return;
  const { data: client } = await supabaseAdmin
    .from("clients")
    .select("id, company, phone, website, notes")
    .eq("user_id", userId)
    .maybeSingle();
  if (!client) return;
  const isBlank = !client.company && !client.phone && !client.website && !client.notes;
  if (!isBlank) return;
  const { count } = await supabaseAdmin
    .from("projects")
    .select("id", { count: "exact", head: true })
    .eq("client_id", client.id);
  if (!count) {
    await supabaseAdmin.from("clients").delete().eq("id", client.id);
  }
}

export const listUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagedUser[]> => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: authData, error: authErr } =
      await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
    if (authErr) throw authErr;

    const [{ data: profiles }, { data: roles }] = await Promise.all([
      supabaseAdmin.from("profiles").select("id, name, phone, email"),
      supabaseAdmin.from("user_roles").select("user_id, role"),
    ]);

    const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));
    const roleMap = new Map<string, AppRole>();
    for (const r of roles ?? []) {
      const current = roleMap.get(r.user_id);
      const rank: Record<string, number> = {
        SUPER_ADMIN: 4,
        ADMIN: 3,
        TEAM_MEMBER: 2,
        CLIENT: 1,
      };
      if (!current || rank[r.role] > rank[current]) {
        roleMap.set(r.user_id, r.role as AppRole);
      }
    }

    return authData.users.map((u) => {
      const p = profileMap.get(u.id) as any;
      return {
        id: u.id,
        email: u.email ?? p?.email ?? null,
        name: p?.name ?? (u.user_metadata?.name as string) ?? null,
        phone: p?.phone ?? null,
        role: roleMap.get(u.id) ?? "CLIENT",
        created_at: u.created_at,
      };
    });
  });

export const setUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string; role: AppRole }) => d)
  .handler(async ({ context, data }) => {
    const isSuper = await assertAdmin(context);
    // Only super admins can grant SUPER_ADMIN or ADMIN
    if (!isSuper && (data.role === "SUPER_ADMIN" || data.role === "ADMIN")) {
      throw new Error("Only Super Admins can grant admin roles");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("user_roles").delete().eq("user_id", data.userId);
    const { error } = await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error) throw error;
    await cleanupStaleClientRecord(supabaseAdmin, data.userId, data.role);
    return { ok: true };
  });

export const createUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (d: {
      email: string;
      password: string;
      name: string;
      phone: string;
      role: AppRole;
    }) => d,
  )
  .handler(async ({ context, data }) => {
    const isSuper = await assertAdmin(context);
    if (!isSuper && (data.role === "SUPER_ADMIN" || data.role === "ADMIN")) {
      throw new Error("Only Super Admins can grant admin roles");
    }
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: created, error } = await supabaseAdmin.auth.admin.createUser({
      email: data.email,
      password: data.password,
      email_confirm: true,
      user_metadata: { name: data.name },
    });
    if (error) throw error;
    const newId = created.user!.id;

    await supabaseAdmin
      .from("profiles")
      .upsert({ id: newId, email: data.email, name: data.name, phone: data.phone });

    // handle_new_user trigger inserts a default role; replace with chosen role
    await supabaseAdmin.from("user_roles").delete().eq("user_id", newId);
    await supabaseAdmin
      .from("user_roles")
      .insert({ user_id: newId, role: data.role });
    await cleanupStaleClientRecord(supabaseAdmin, newId, data.role);

    return { ok: true, id: newId };
  });

export const deleteUserAccount = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { userId: string }) => d)
  .handler(async ({ context, data }) => {
    const isSuper = await assertAdmin(context);
    if (!isSuper) throw new Error("Only Super Admins can delete accounts");
    if (data.userId === context.userId)
      throw new Error("You cannot delete your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.auth.admin.deleteUser(data.userId);
    if (error) throw error;
    return { ok: true };
  });
