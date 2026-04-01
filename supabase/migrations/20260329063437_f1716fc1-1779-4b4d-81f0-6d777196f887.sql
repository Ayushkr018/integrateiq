
-- Drop the spoofable current_setting-based policies
DROP POLICY IF EXISTS "tenant_isolation_documents" ON public.documents;
DROP POLICY IF EXISTS "tenant_isolation_configs" ON public.integration_configs;
DROP POLICY IF EXISTS "tenant_isolation_simulations" ON public.simulations;
DROP POLICY IF EXISTS "tenant_isolation_audit_logs" ON public.audit_logs;

-- Replace with deny-all for anon/authenticated (edge functions use service role to bypass RLS)
CREATE POLICY "deny_all_documents" ON public.documents FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_configs" ON public.integration_configs FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_simulations" ON public.simulations FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_audit_logs" ON public.audit_logs FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
