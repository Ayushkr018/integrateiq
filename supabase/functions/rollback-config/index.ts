import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { config_id, history_id, tenant_id, reason } = await req.json();
    if (!config_id || !history_id || !tenant_id) {
      return new Response(JSON.stringify({ error: "config_id, history_id, tenant_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get the history snapshot
    const { data: historyEntry } = await supabase
      .from("config_history")
      .select("*")
      .eq("id", history_id)
      .single();

    if (!historyEntry) {
      return new Response(JSON.stringify({ error: "History entry not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Save current config as new history entry before rollback
    const { data: currentConfig } = await supabase
      .from("integration_configs")
      .select("*")
      .eq("id", config_id)
      .single();

    if (currentConfig) {
      await supabase.from("config_history").insert({
        config_id,
        snapshot: { config: currentConfig.config, rolled_back_from: true },
        change_note: `Pre-rollback snapshot. Reason: ${reason || "Manual rollback"}`,
        changed_by: "system",
      });
    }

    // Apply the rollback
    const snapshot = historyEntry.snapshot as any;
    await supabase
      .from("integration_configs")
      .update({
        config: snapshot.config || snapshot,
        status: "draft",
        updated_at: new Date().toISOString(),
      })
      .eq("id", config_id);

    // Audit log
    await supabase.from("audit_logs").insert({
      tenant_id,
      action: "config_rolled_back",
      entity_type: "integration_config",
      entity_id: config_id,
      performed_by: "admin",
      payload: { history_id, reason, rolled_back_to: historyEntry.created_at },
    });

    console.log("rollback-config response: success");
    return new Response(JSON.stringify({ success: true, config_id, rolled_back_to: history_id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("rollback-config error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
