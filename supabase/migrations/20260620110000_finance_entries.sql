-- Lightweight finance tracker: revenue + expenses, admin/super-admin only.
CREATE TABLE public.finance_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  type TEXT NOT NULL CHECK (type IN ('REVENUE','EXPENSE')),
  amount NUMERIC(12,2) NOT NULL CHECK (amount >= 0),
  category TEXT NOT NULL,
  description TEXT,
  entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  created_by UUID NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX finance_entries_entry_date_idx ON public.finance_entries (entry_date);

ALTER TABLE public.finance_entries ENABLE ROW LEVEL SECURITY;

-- Financial data is sensitive: Admins and Super Admins only, no Team Member access.
CREATE POLICY "Admins manage finance entries" ON public.finance_entries
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ADMIN') OR public.has_role(auth.uid(),'SUPER_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(),'ADMIN') OR public.has_role(auth.uid(),'SUPER_ADMIN'));

CREATE TRIGGER finance_entries_set_updated_at
  BEFORE UPDATE ON public.finance_entries
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
