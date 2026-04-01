import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const tenantId = '00000000-0000-0000-0000-000000000001';

  // Insert simulations
  const { error: simError } = await supabase.from('simulations').insert([
    { tenant_id: tenantId, status: 'success', latency_ms: 847, request_payload: { pan: 'ABCDE1234F', mobile: '9876543210' }, response_payload: { score: 745, status: 'approved' } },
    { tenant_id: tenantId, status: 'success', latency_ms: 1203, request_payload: { aadhaar_consent: true }, response_payload: { verified: true, name: 'Raj Kumar' } },
    { tenant_id: tenantId, status: 'failed', latency_ms: 2100, request_payload: { gstn: '29ABCDE1234F1Z5' }, response_payload: { error: 'timeout' } },
    { tenant_id: tenantId, status: 'success', latency_ms: 634, request_payload: { amount: 500000 }, response_payload: { payment_id: 'pay_xyz123', status: 'captured' } },
    { tenant_id: tenantId, status: 'success', latency_ms: 912, request_payload: { pan: 'FGHIJ5678K' }, response_payload: { score: 812, status: 'approved' } },
    { tenant_id: tenantId, status: 'success', latency_ms: 445, request_payload: { mobile: '9988776655' }, response_payload: { kyc_status: 'complete' } },
    { tenant_id: tenantId, status: 'success', latency_ms: 1567, request_payload: { gstn: '07XYZAB1234C1D6' }, response_payload: { business_name: 'ABC Traders', active: true } },
    { tenant_id: tenantId, status: 'failed', latency_ms: 3200, request_payload: { pan: 'LMNOP9012Q' }, response_payload: { error: 'service_unavailable' } },
  ]);

  // Insert audit logs
  const { error: auditError } = await supabase.from('audit_logs').insert([
    { tenant_id: tenantId, action: 'document_parsed', entity_type: 'document', performed_by: 'system', payload: { file: 'lending_brd.txt', services_detected: 4 } },
    { tenant_id: tenantId, action: 'adapters_matched', entity_type: 'adapter', performed_by: 'system', payload: { count: 4, categories: ['credit_bureau', 'kyc', 'payment', 'gst'] } },
    { tenant_id: tenantId, action: 'config_generated', entity_type: 'config', performed_by: 'system', payload: { mappings: 8, confidence: 0.87 } },
    { tenant_id: tenantId, action: 'simulation_run', entity_type: 'simulation', performed_by: 'system', payload: { status: 'success', latency_ms: 847 } },
    { tenant_id: tenantId, action: 'simulation_run', entity_type: 'simulation', performed_by: 'system', payload: { status: 'success', latency_ms: 1203 } },
    { tenant_id: tenantId, action: 'config_rolled_back', entity_type: 'config', performed_by: 'admin', payload: { version: 'v1.0', reason: 'field mapping update' } },
    { tenant_id: tenantId, action: 'simulation_run', entity_type: 'simulation', performed_by: 'system', payload: { status: 'failed', latency_ms: 2100 } },
    { tenant_id: tenantId, action: 'document_parsed', entity_type: 'document', performed_by: 'system', payload: { file: 'kyc_requirements.pdf', services_detected: 2 } },
    { tenant_id: tenantId, action: 'adapters_matched', entity_type: 'adapter', performed_by: 'system', payload: { count: 2, categories: ['kyc', 'esign'] } },
    { tenant_id: tenantId, action: 'config_generated', entity_type: 'config', performed_by: 'system', payload: { mappings: 5, confidence: 0.92 } },
  ]);

  return new Response(JSON.stringify({
    success: true,
    simulations_error: simError?.message || null,
    audit_error: auditError?.message || null,
  }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
});
