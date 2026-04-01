import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Known field mapping patterns for Indian fintech
const FIELD_MAPPING_RULES: Record<string, Record<string, { target: string; confidence: number; transform?: string }>> = {
  credit_bureau: {
    pan: { target: "pan_number", confidence: 0.98 },
    name: { target: "applicant_name", confidence: 0.92 },
    customer_name: { target: "applicant_name", confidence: 0.95 },
    dob: { target: "date_of_birth", confidence: 0.97 },
    mobile: { target: "mobile_number", confidence: 0.94 },
    address: { target: "residential_address", confidence: 0.85 },
    loan_amount: { target: "enquiry_amount", confidence: 0.88 },
    income: { target: "annual_income", confidence: 0.82 },
    employment_type: { target: "employment_category", confidence: 0.79 },
  },
  kyc: {
    pan: { target: "id_number", confidence: 0.96 },
    name: { target: "full_name", confidence: 0.94 },
    customer_name: { target: "full_name", confidence: 0.96 },
    dob: { target: "date_of_birth", confidence: 0.97 },
    mobile: { target: "registered_mobile", confidence: 0.91 },
    address: { target: "current_address", confidence: 0.87 },
    income: { target: "declared_income", confidence: 0.72 },
    employment_type: { target: "occupation", confidence: 0.76 },
  },
  payment: {
    customer_name: { target: "beneficiary_name", confidence: 0.93 },
    name: { target: "beneficiary_name", confidence: 0.90 },
    mobile: { target: "contact_number", confidence: 0.89 },
    loan_amount: { target: "transaction_amount", confidence: 0.95, transform: "multiply_100_paise" },
    pan: { target: "customer_id", confidence: 0.75 },
    address: { target: "billing_address", confidence: 0.70 },
  },
  gst: {
    pan: { target: "pan_of_entity", confidence: 0.92 },
    customer_name: { target: "legal_entity_name", confidence: 0.88 },
    name: { target: "legal_entity_name", confidence: 0.85 },
    address: { target: "principal_place_of_business", confidence: 0.80 },
  },
  banking: {
    pan: { target: "customer_pan", confidence: 0.90 },
    customer_name: { target: "account_holder_name", confidence: 0.94 },
    name: { target: "account_holder_name", confidence: 0.92 },
    mobile: { target: "registered_mobile", confidence: 0.88 },
    income: { target: "expected_monthly_credit", confidence: 0.76 },
  },
  esign: {
    customer_name: { target: "signer_name", confidence: 0.97 },
    name: { target: "signer_name", confidence: 0.95 },
    mobile: { target: "signer_mobile", confidence: 0.91 },
    pan: { target: "signer_identifier", confidence: 0.82 },
  },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tenant_id, adapter_version_id, source_fields } = await req.json();
    if (!tenant_id || !adapter_version_id) {
      return new Response(JSON.stringify({ error: "tenant_id and adapter_version_id required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Get adapter info
    const { data: version } = await supabase
      .from("adapter_versions")
      .select("*, adapters(*)")
      .eq("id", adapter_version_id)
      .single();

    if (!version) {
      return new Response(JSON.stringify({ error: "Adapter version not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const category = (version as any).adapters?.category || "kyc";
    const rules = FIELD_MAPPING_RULES[category] || FIELD_MAPPING_RULES.kyc;
    const fields = source_fields || ["pan", "mobile", "dob", "loan_amount", "customer_name"];

    // Generate field mappings
    const field_mappings = fields.map((field: string) => {
      const rule = rules[field];
      if (rule) {
        return {
          source_field: field,
          target_field: rule.target,
          ai_confidence: rule.confidence,
          is_ai_suggested: true,
          is_confirmed: false,
          transform_rule: rule.transform || null,
        };
      }
      return {
        source_field: field,
        target_field: `custom_${field}`,
        ai_confidence: 0.55,
        is_ai_suggested: true,
        is_confirmed: false,
        transform_rule: null,
      };
    });

    // Create integration config
    const config = {
      adapter: (version as any).adapters?.name,
      adapter_version: version.version,
      auth_type: version.auth_type,
      base_url: version.base_url,
      field_count: field_mappings.length,
      category,
      generated_at: new Date().toISOString(),
    };

    const { data: configRow } = await supabase.from("integration_configs").insert({
      tenant_id,
      adapter_version_id,
      config,
      status: "draft",
    }).select().single();

    const configId = configRow?.id;

    // Save field mappings
    if (configId) {
      const mappingInserts = field_mappings.map((m: any) => ({
        config_id: configId,
        source_field: m.source_field,
        target_field: m.target_field,
        ai_confidence: m.ai_confidence,
        is_ai_suggested: m.is_ai_suggested,
        is_confirmed: m.is_confirmed,
        transform_rule: m.transform_rule,
      }));
      await supabase.from("field_mappings").insert(mappingInserts);

      // Save initial config history
      await supabase.from("config_history").insert({
        config_id: configId,
        snapshot: { config, field_mappings },
        change_note: "Initial AI-generated configuration",
        changed_by: "ai_engine",
      });
    }

    // Audit log
    await supabase.from("audit_logs").insert({
      tenant_id,
      action: "config_generated",
      entity_type: "integration_config",
      entity_id: configId,
      performed_by: "ai_engine",
      payload: {
        adapter: (version as any).adapters?.name,
        fields_mapped: field_mappings.length,
        avg_confidence: field_mappings.reduce((s: number, m: any) => s + m.ai_confidence, 0) / field_mappings.length,
      },
    });

    const response = { config_id: configId, config, field_mappings };
    console.log("generate-config response:", JSON.stringify(response));
    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-config error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
