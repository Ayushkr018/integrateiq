
-- Add SELECT RLS policies for anon/authenticated on all tables
CREATE POLICY "allow_select_adapters" ON public.adapters FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow_select_adapter_versions" ON public.adapter_versions FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow_select_audit_logs" ON public.audit_logs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow_select_tenants" ON public.tenants FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow_select_documents" ON public.documents FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow_select_integration_configs" ON public.integration_configs FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow_select_simulations" ON public.simulations FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow_select_config_history" ON public.config_history FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "allow_select_field_mappings" ON public.field_mappings FOR SELECT TO anon, authenticated USING (true);
