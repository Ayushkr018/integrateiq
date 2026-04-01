-- Lock down adapter_versions: replace permissive read with deny-all
DROP POLICY IF EXISTS "allow_read_adapter_versions" ON public.adapter_versions;
CREATE POLICY "deny_all_adapter_versions" ON public.adapter_versions
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);

-- Lock down adapters: replace permissive read with deny-all
DROP POLICY IF EXISTS "allow_read_adapters" ON public.adapters;
CREATE POLICY "deny_all_adapters" ON public.adapters
  FOR ALL TO anon, authenticated
  USING (false)
  WITH CHECK (false);