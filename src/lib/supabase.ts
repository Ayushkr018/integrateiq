import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lsvasredqhbbperwzyog.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxzdmFzcmVkcWhiYnBlcnd6eW9nIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ2OTUzOTAsImV4cCI6MjA5MDI3MTM5MH0.LzqR7_ZpbrN4_6pdAqu3lM1NH-RnGAW0sd_TVEv2Mjk';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export const TENANT_ID = '00000000-0000-0000-0000-000000000001';
export const EDGE_FN_BASE = `${SUPABASE_URL}/functions/v1`;

export async function callEdgeFunction(fnName: string, body: Record<string, unknown>) {
  const res = await fetch(`${EDGE_FN_BASE}/${fnName}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || 'Request failed');
  return data;
}
