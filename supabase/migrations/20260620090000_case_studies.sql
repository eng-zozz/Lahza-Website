-- Case studies: admin-managed marketing content, public read for published rows.
CREATE TABLE public.case_studies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT NOT NULL UNIQUE,
  company_name TEXT NOT NULL,
  client_name TEXT,
  industry TEXT,
  summary TEXT NOT NULL,
  logo_url TEXT,
  gallery_urls TEXT[] NOT NULL DEFAULT '{}',
  challenge TEXT,
  solution TEXT,
  technologies TEXT[] NOT NULL DEFAULT '{}',
  services TEXT[] NOT NULL DEFAULT '{}',
  results TEXT[] NOT NULL DEFAULT '{}',
  metrics JSONB NOT NULL DEFAULT '[]', -- [{ "label": "Response time", "before": "4h", "after": "2 min" }]
  timeline TEXT,
  published BOOLEAN NOT NULL DEFAULT true,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.case_studies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads published case studies" ON public.case_studies
  FOR SELECT TO anon, authenticated
  USING (published = true);

CREATE POLICY "Staff read all case studies" ON public.case_studies
  FOR SELECT TO authenticated
  USING (public.is_staff(auth.uid()));

CREATE POLICY "Admins manage case studies" ON public.case_studies
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'ADMIN') OR public.has_role(auth.uid(),'SUPER_ADMIN'))
  WITH CHECK (public.has_role(auth.uid(),'ADMIN') OR public.has_role(auth.uid(),'SUPER_ADMIN'));

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER case_studies_set_updated_at
  BEFORE UPDATE ON public.case_studies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Storage bucket for case study logos / gallery screenshots (public bucket — these
-- render on public marketing pages).
INSERT INTO storage.buckets (id, name, public)
VALUES ('case-study-images', 'case-study-images', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public reads case study images" ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = 'case-study-images');

CREATE POLICY "Admins upload case study images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'case-study-images'
    AND (public.has_role(auth.uid(),'ADMIN') OR public.has_role(auth.uid(),'SUPER_ADMIN'))
  );

CREATE POLICY "Admins update case study images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'case-study-images'
    AND (public.has_role(auth.uid(),'ADMIN') OR public.has_role(auth.uid(),'SUPER_ADMIN'))
  );

CREATE POLICY "Admins delete case study images" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'case-study-images'
    AND (public.has_role(auth.uid(),'ADMIN') OR public.has_role(auth.uid(),'SUPER_ADMIN'))
  );

-- Seed the existing Assiut Real Estate case study so it's editable from admin.
INSERT INTO public.case_studies (
  slug, company_name, client_name, industry, summary, challenge, solution,
  technologies, services, results, metrics, timeline, sort_order
) VALUES (
  'assiut-real-estate',
  'Assiut Real Estate',
  'Ibrahim Mohammed',
  'Real Estate',
  'An end-to-end AI automation suite that turned scattered social enquiries into a qualified, always-on sales pipeline.',
  'Assiut Real Estate is a growing property brokerage selling residential and commercial units. Most of their demand comes from Facebook groups, ads, and direct messages — generating a high volume of enquiries that the team struggled to answer quickly and consistently. Hundreds of incoming messages across Messenger, WhatsApp, and Facebook with slow response times meant qualified buyers were going cold before a human ever replied.',
  'Lahza built an AI lead qualification system connected to a Messenger chatbot, a WhatsApp chatbot, and automated Facebook group posting — so every enquiry is captured, scored, and routed the moment it arrives.',
  ARRAY['Meta Graph API','WhatsApp Cloud API','Supabase','Webhook Pipelines'],
  ARRAY['AI Lead Qualification System','Automated Facebook Group Posting','Messenger Chatbot','WhatsApp Chatbot'],
  ARRAY['Reclaimed dozens of hours per week previously spent on manual replies','Faster first-response time across every channel','Higher qualified-lead-to-viewing conversion rate'],
  '[{"label":"First response time","before":"~4 hours","after":"Under 2 minutes"},{"label":"Leads qualified before reaching sales","before":"0%","after":"~80%"}]'::jsonb,
  '6 weeks: Discovery & Analysis, System Design, Development, Testing, Deployment',
  0
)
ON CONFLICT (slug) DO NOTHING;
