import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tenant_id, parsed_result } = await req.json();
    if (!tenant_id || !parsed_result) {
      return new Response(JSON.stringify({ error: "tenant_id and parsed_result required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get all adapters with versions
    const { data: adapters } = await supabase
      .from("adapters")
      .select("*, adapter_versions(*)");

    const detectedServices = parsed_result.detected_services || [];
    const matches: any[] = [];

    // Match detected services to adapters
    for (const svc of detectedServices) {
      const categoryMatches = adapters?.filter(a => a.category === svc.category) || [];
      
      for (const adapter of categoryMatches) {
        const nameMatch = adapter.provider.toLowerCase().includes(svc.provider.toLowerCase()) ||
                          svc.provider.toLowerCase().includes(adapter.provider.toLowerCase());
        const confidence = nameMatch ? Math.min(svc.confidence + 0.1, 0.99) : svc.confidence * 0.7;

        const versions = (adapter.adapter_versions || []).map((v: any) => ({
          id: v.id,
          version: v.version,
          deprecated: v.deprecated || false,
          is_latest: v.is_latest || false,
          auth_type: v.auth_type,
          base_url: v.base_url,
        }));

        matches.push({
          adapter_id: adapter.id,
          adapter_name: adapter.name,
          provider: adapter.provider,
          category: adapter.category,
          detected_service: svc.provider,
          confidence: Math.round(confidence * 100) / 100,
          reason: `Matched ${svc.provider} → ${adapter.name} (${svc.category.replace(/_/g, " ")})`,
          mandatory: svc.mandatory,
          versions,
        });
      }
    }

    // Sort by confidence
    matches.sort((a, b) => b.confidence - a.confidence);

    // Audit log
    await supabase.from("audit_logs").insert({
      tenant_id,
      action: "adapters_matched",
      entity_type: "adapter",
      entity_id: matches[0]?.adapter_id || null,
      performed_by: "system",
      payload: { matched_count: matches.length, confidence_avg: matches.length ? matches.reduce((s, m) => s + m.confidence, 0) / matches.length : 0 },
    });

    console.log("match-adapters response:", JSON.stringify({ matches_count: matches.length }));
    return new Response(JSON.stringify({ matches }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("match-adapters error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
