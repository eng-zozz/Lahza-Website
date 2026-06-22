import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import {
  fetchConversations,
  ensureMyConversation,
  type ConversationWithMeta,
} from "@/lib/messages";
import { ChatThread } from "@/components/app/chat-thread";
import { Inbox, Mail } from "lucide-react";

export const Route = createFileRoute("/_authenticated/inbox")({
  validateSearch: (search: Record<string, unknown>) => ({
    client: typeof search.client === "string" ? search.client : undefined,
  }),
  component: InboxPage,
});

function InboxPage() {
  const { user, isStaff } = useAuth();
  const navigate = useNavigate();
  const { client: clientParam } = Route.useSearch();
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    if (user && !isStaff) navigate({ to: "/messages" });
  }, [user, isStaff, navigate]);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
    enabled: isStaff,
    refetchInterval: 30000,
  });

  // Deep link from a Client profile ("Message this client") — find or create
  // their conversation and select it.
  useEffect(() => {
    if (!clientParam || !isStaff) return;
    const existing = conversations.find((c) => c.client_id === clientParam);
    if (existing) {
      setSelected(existing.id);
    } else if (!isLoading) {
      ensureMyConversation(clientParam).then((c) => setSelected(c.id));
    }
  }, [clientParam, conversations, isLoading, isStaff]);

  const active = selected ?? conversations[0]?.id ?? null;

  return (
    <div className="space-y-4">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Inbox className="h-6 w-6 text-primary" /> Client Inbox
        </h1>
        <p className="text-sm text-muted-foreground">
          Respond to client conversations in real time.
        </p>
      </div>

      <div className="grid h-[calc(100vh-12rem)] gap-4 md:grid-cols-[320px_1fr]">
        <div className="overflow-y-auto rounded-2xl border border-border bg-card">
          {isLoading ? (
            <div className="p-6 text-center text-sm text-muted-foreground">Loading…</div>
          ) : conversations.length === 0 ? (
            <div className="p-6 text-center text-sm text-muted-foreground">
              No conversations yet.
            </div>
          ) : (
            <div className="divide-y divide-border">
              {conversations.map((c: ConversationWithMeta) => (
                <button
                  key={c.id}
                  onClick={() => setSelected(c.id)}
                  className={`flex w-full flex-col items-start gap-0.5 p-4 text-start transition-colors ${
                    active === c.id ? "bg-primary/10" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex w-full items-center justify-between gap-2">
                    <span className="truncate font-medium">
                      {c.client_name || c.client_email || "Client"}
                    </span>
                    {c.unread > 0 && (
                      <span className="grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-primary-foreground">
                        {c.unread}
                      </span>
                    )}
                  </div>
                  <span className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Mail className="h-3 w-3" /> {c.client_email}
                  </span>
                  {c.last_body && (
                    <span className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                      {c.last_body}
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          {active && user ? (
            <ChatThread conversationId={active} currentUserId={user.id} />
          ) : (
            <div className="grid h-full place-items-center text-sm text-muted-foreground">
              Select a conversation
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
