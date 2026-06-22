import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { ensureMyConversation } from "@/lib/messages";
import { ChatThread } from "@/components/app/chat-thread";
import { MessageSquare } from "lucide-react";

export const Route = createFileRoute("/_authenticated/messages")({
  component: MessagesPage,
});

function MessagesPage() {
  const { user } = useAuth();

  const { data: conversation, isLoading } = useQuery({
    queryKey: ["my-conversation", user?.id],
    queryFn: () => ensureMyConversation(user!.id),
    enabled: !!user,
  });

  return (
    <div className="mx-auto flex h-[calc(100vh-7rem)] max-w-3xl flex-col">
      <div className="mb-4">
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <MessageSquare className="h-6 w-6 text-primary" /> Messages
        </h1>
        <p className="text-sm text-muted-foreground">
          Chat directly with the Lahza team.
        </p>
      </div>
      <div className="flex-1 overflow-hidden rounded-2xl border border-border bg-card">
        {isLoading || !conversation || !user ? (
          <div className="grid h-full place-items-center text-sm text-muted-foreground">
            Loading…
          </div>
        ) : (
          <ChatThread conversationId={conversation.id} currentUserId={user.id} />
        )}
      </div>
    </div>
  );
}
