import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Mock responses by adapter category
const MOCK_RESPONSES: Record<string, any> = {
  credit_bureau: {
    score: 750,
    report_id: `RPT-${Date.now()}`,
    status: "active",
    accounts_count: 5,
    overdue_accounts: 0,
    credit_utilization: "32%",
    enquiries_last_30_days: 2,
  },
  kyc: {
    verified: true,
    name_match: true,
    status: "valid",
    verification_id: `VRF-${Date.now()}`,
    match_score: 0.96,
  },
  payment: {
    transaction_id: `TXN-${Date.now()}`,
    status: "success",
    utr: `UTR${Math.random().toString(36).substring(2, 14).toUpperCase()}`,
    settled: true,
  },
  gst: {
    gstin_status: "Active",
    legal_name: "Test Corporation Pvt Ltd",
    filing_status: "Up to date",
    last_filed_return: "GSTR-3B",
    last_filed_date: "2025-12-15",
  },
  banking: {
    avg_monthly_balance: 245000,
    salary_detected: true,
    monthly_credits: 5,
    monthly_debits: 23,
    bounce_count: 0,
    analysis_period: "6 months",
  },
  esign: {
    signed: true,
    certificate_id: `CERT-${Date.now()}`,
    timestamp: new Date().toISOString(),
    signer_verified: true,
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tenant_id, config_id, adapter_version_id, request_payload } = await req.json();
    if (!tenant_id || !config_id) {
      return new Response(JSON.stringify({ error: "tenant_id and config_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const startTime = Date.now();

    // Get adapter info for mock response
    let category = "kyc";
    if (adapter_version_id) {
      const { data: version } = await supabase
        .from("adapter_versions")
        .select("*, adapters(category)")
        .eq("id", adapter_version_id)
        .single();
      category = (version as any)?.adapters?.category || "kyc";
    }

    // Simulate network latency (100-400ms)
    const simulatedLatency = 100 + Math.floor(Math.random() * 300);
    await new Promise(r => setTimeout(r, Math.min(simulatedLatency, 500)));

    const latency_ms = Date.now() - startTime;
    const mockResponse = MOCK_RESPONSES[category] || MOCK_RESPONSES.kyc;
    const status = Math.random() > 0.05 ? "success" : "error"; // 95% success rate

    const response_payload = status === "success"
      ? { ...mockResponse, request_echo: request_payload }
      : { error: "TIMEOUT", message: "Upstream service did not respond", code: "E504" };

    // Save simulation
    const { data: sim } = await supabase.from("simulations").insert({
      tenant_id,
      config_id,
      adapter_version_id,
      request_payload: request_payload || {},
      response_payload,
      latency_ms,
      status,
    }).select().single();

    // Audit log
    await supabase.from("audit_logs").insert({
      tenant_id,
      action: "simulation_run",
      entity_type: "simulation",
      entity_id: sim?.id,
      performed_by: "system",
      payload: { config_id, status, latency_ms, category },
    });

    const result = {
      simulation_id: sim?.id,
      status,
      latency_ms,
      response: response_payload,
      mock_response: response_payload,
      config_id,
    };

    console.log("simulate response:", JSON.stringify(result));
    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("simulate error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
