-- Fix: registering / being assigned the CLIENT role never created a row in
-- public.clients, so the CRM "Clients" directory and the project "Client"
-- assignment dropdown were always empty even when client accounts existed.
--
-- This adds a trigger that auto-creates a public.clients row (linked via
-- user_id) the moment a user is granted the CLIENT role, and backfills any
-- client users that already exist without one.

CREATE OR REPLACE FUNCTION public.handle_client_role_assigned()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.role = 'CLIENT' THEN
    INSERT INTO public.clients (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_user_role_client_assigned ON public.user_roles;
CREATE TRIGGER on_user_role_client_assigned
  AFTER INSERT ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.handle_client_role_assigned();

-- Backfill: any existing user already holding the CLIENT role but missing a
-- clients record (e.g. signed up / was created before this fix shipped).
INSERT INTO public.clients (user_id)
SELECT ur.user_id
FROM public.user_roles ur
WHERE ur.role = 'CLIENT'
  AND NOT EXISTS (SELECT 1 FROM public.clients c WHERE c.user_id = ur.user_id)
ON CONFLICT (user_id) DO NOTHING;
