import { supabase } from "@/integrations/supabase/client";

export interface Conversation {
  id: string;
  client_id: string;
  subject: string;
  last_message_at: string;
  created_at: string;
}

export interface Message {
  id: string;
  conversation_id: string;
  sender_id: string;
  body: string;
  read_at: string | null;
  created_at: string;
}

export interface ConversationWithMeta extends Conversation {
  client_name: string | null;
  client_email: string | null;
  unread: number;
  last_body: string | null;
}

/** Client side: get (or create) the signed-in client's conversation. */
export async function ensureMyConversation(userId: string): Promise<Conversation> {
  const { data: existing } = await supabase
    .from("conversations")
    .select("*")
    .eq("client_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();
  if (existing) return existing as Conversation;

  const { data, error } = await supabase
    .from("conversations")
    .insert({ client_id: userId, subject: "General" })
    .select("*")
    .single();
  if (error) throw error;
  return data as Conversation;
}

/** Staff side: all conversations with client + unread meta. */
export async function fetchConversations(): Promise<ConversationWithMeta[]> {
  const { data: convos, error } = await supabase
    .from("conversations")
    .select("*")
    .order("last_message_at", { ascending: false });
  if (error) throw error;

  const list = (convos ?? []) as Conversation[];
  if (list.length === 0) return [];

  const clientIds = [...new Set(list.map((c) => c.client_id))];
  const { data: profiles } = await supabase
    .from("profiles")
    .select("id, name, email")
    .in("id", clientIds);
  const pMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  const { data: msgs } = await supabase
    .from("messages")
    .select("conversation_id, body, created_at, read_at, sender_id")
    .in(
      "conversation_id",
      list.map((c) => c.id),
    )
    .order("created_at", { ascending: false });

  return list.map((c) => {
    const cMsgs = (msgs ?? []).filter((m: any) => m.conversation_id === c.id);
    const last = cMsgs[0];
    const unread = cMsgs.filter(
      (m: any) => m.sender_id === c.client_id && !m.read_at,
    ).length;
    const p = pMap.get(c.client_id) as any;
    return {
      ...c,
      client_name: p?.name ?? null,
      client_email: p?.email ?? null,
      unread,
      last_body: last?.body ?? null,
    };
  });
}

export async function fetchMessages(conversationId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as Message[];
}

export async function sendMessage(
  conversationId: string,
  senderId: string,
  body: string,
) {
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: senderId, body });
  if (error) throw error;
  await supabase
    .from("conversations")
    .update({ last_message_at: new Date().toISOString() })
    .eq("id", conversationId);
}

/** Mark messages from the other party as read. */
export async function markRead(conversationId: string, myUserId: string) {
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", myUserId)
    .is("read_at", null);
}

/** Unread count for the signed-in user across their visible conversations. */
export async function fetchUnreadCount(myUserId: string): Promise<number> {
  const { count } = await supabase
    .from("messages")
    .select("id", { count: "exact", head: true })
    .neq("sender_id", myUserId)
    .is("read_at", null);
  return count ?? 0;
}
