-- Personal notes & to-do items for staff members (private to the owner).
CREATE TABLE public.staff_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'NOTE' CHECK (kind IN ('NOTE','TODO')),
  title TEXT NOT NULL,
  content TEXT,
  is_done BOOLEAN NOT NULL DEFAULT false,
  due_date DATE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.staff_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Staff manage own notes" ON public.staff_notes
  FOR ALL TO authenticated
  USING (public.is_staff(auth.uid()) AND auth.uid() = user_id)
  WITH CHECK (public.is_staff(auth.uid()) AND auth.uid() = user_id);

CREATE TRIGGER staff_notes_set_updated_at
  BEFORE UPDATE ON public.staff_notes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
