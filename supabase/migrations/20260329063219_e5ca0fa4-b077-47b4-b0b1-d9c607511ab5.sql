
-- Add RLS policies for tables that have RLS enabled but no policies

-- adapters: read-only for all (public catalog)
CREATE POLICY "allow_read_adapters" ON public.adapters FOR SELECT TO anon, authenticated USING (true);

-- adapter_versions: read-only for all (public catalog)
CREATE POLICY "allow_read_adapter_versions" ON public.adapter_versions FOR SELECT TO anon, authenticated USING (true);

-- tenants: read-only for all
CREATE POLICY "allow_read_tenants" ON public.tenants FOR SELECT TO anon, authenticated USING (true);

-- audit_logs: tenant-scoped access
CREATE POLICY "tenant_isolation_audit_logs" ON public.audit_logs FOR ALL TO anon, authenticated USING (tenant_id = (current_setting('app.tenant_id', true))::uuid);

-- field_mappings: read access (joined through config)
CREATE POLICY "allow_read_field_mappings" ON public.field_mappings FOR SELECT TO anon, authenticated USING (true);

-- config_history: read access (joined through config)
CREATE POLICY "allow_read_config_history" ON public.config_history FOR SELECT TO anon, authenticated USING (true);
