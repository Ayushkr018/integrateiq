
-- Lock down config_history and field_mappings (same pattern - both had USING: true)
DROP POLICY IF EXISTS "allow_read_config_history" ON public.config_history;
DROP POLICY IF EXISTS "allow_read_field_mappings" ON public.field_mappings;
CREATE POLICY "deny_all_config_history" ON public.config_history FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
CREATE POLICY "deny_all_field_mappings" ON public.field_mappings FOR ALL TO anon, authenticated USING (false) WITH CHECK (false);
