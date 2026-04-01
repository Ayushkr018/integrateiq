
DROP POLICY IF EXISTS "allow_read_tenants" ON public.tenants;
CREATE POLICY "deny_all_tenants" ON public.tenants FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
