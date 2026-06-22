-- 1) Phone on profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- 2) Conversations (one thread per client, owned by a client user, handled by staff)
CREATE TABLE public.conversations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  client_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL DEFAULT 'General',
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Clients view own conversations" ON public.conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = client_id OR public.is_staff(auth.uid()));
CREATE POLICY "Clients create own conversations" ON public.conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = client_id OR public.is_staff(auth.uid()));
CREATE POLICY "Owner or staff update conversations" ON public.conversations
  FOR UPDATE TO authenticated
  USING (auth.uid() = client_id OR public.is_staff(auth.uid()))
  WITH CHECK (auth.uid() = client_id OR public.is_staff(auth.uid()));
CREATE POLICY "Staff delete conversations" ON public.conversations
  FOR DELETE TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE TRIGGER trg_conversations_updated BEFORE UPDATE ON public.conversations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Messages
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id uuid NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  body text NOT NULL,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View messages in own conversations" ON public.messages
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND (c.client_id = auth.uid() OR public.is_staff(auth.uid()))
  ));
CREATE POLICY "Send messages in own conversations" ON public.messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.conversations c
      WHERE c.id = conversation_id
        AND (c.client_id = auth.uid() OR public.is_staff(auth.uid()))
    )
  );
CREATE POLICY "Update read state in own conversations" ON public.messages
  FOR UPDATE TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND (c.client_id = auth.uid() OR public.is_staff(auth.uid()))
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_id
      AND (c.client_id = auth.uid() OR public.is_staff(auth.uid()))
  ));

CREATE INDEX idx_messages_conversation ON public.messages(conversation_id, created_at);

-- 4) Realtime
ALTER TABLE public.messages REPLICA IDENTITY FULL;
ALTER TABLE public.conversations REPLICA IDENTITY FULL;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;