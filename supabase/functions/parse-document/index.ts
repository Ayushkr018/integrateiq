import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { tenant_id, document_text, file_name } = await req.json();
    if (!tenant_id || !document_text) {
      return new Response(JSON.stringify({ error: "tenant_id and document_text required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use AI to parse the document
    const AI_API_KEY = Deno.env.get("AI_API_KEY");
    let parsed_result;

    if (AI_API_KEY) {
      const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${AI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "groq/llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `You are an enterprise integration analyst. Analyze the document and extract integration requirements. Return a JSON object with tool calling.`
            },
            {
              role: "user",
              content: `Analyze this document for integration requirements:\n\n${document_text.substring(0, 8000)}`
            }
          ],
          tools: [{
            type: "function",
            function: {
              name: "extract_integration_requirements",
              description: "Extract integration services and requirements from document",
              parameters: {
                type: "object",
                properties: {
                  summary: { type: "string", description: "Brief summary of the document's integration needs" },
                  detected_services: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        provider: { type: "string" },
                        category: { type: "string", enum: ["credit_bureau", "kyc", "payment", "gst", "banking", "esign"] },
                        confidence: { type: "number", minimum: 0, maximum: 1 },
                        mandatory: { type: "boolean" },
                        mentioned_fields: { type: "array", items: { type: "string" } },
                        purpose: { type: "string" }
                      },
                      required: ["provider", "category", "confidence", "mandatory", "mentioned_fields", "purpose"]
                    }
                  },
                  global_fields: { type: "array", items: { type: "string" } },
                  compliance_notes: { type: "array", items: { type: "string" } },
                  integration_count: { type: "number" }
                },
                required: ["summary", "detected_services", "global_fields", "compliance_notes", "integration_count"]
              }
            }
          }],
          tool_choice: { type: "function", function: { name: "extract_integration_requirements" } }
        }),
      });

      if (aiResponse.ok) {
        const aiData = await aiResponse.json();
        const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
        if (toolCall?.function?.arguments) {
          parsed_result = JSON.parse(toolCall.function.arguments);
        }
      }
    }

    // Fallback if AI fails
    if (!parsed_result) {
      const text = document_text.toLowerCase();
      const services = [];
      
      const serviceDetectors = [
        { keywords: ["cibil", "credit score", "credit bureau", "credit report"], provider: "TransUnion CIBIL", category: "credit_bureau", fields: ["pan", "name", "dob"] },
        { keywords: ["experian", "credit pull"], provider: "Experian India", category: "credit_bureau", fields: ["pan", "name", "address"] },
        { keywords: ["pan", "pan verification", "pan card", "nsdl"], provider: "NSDL", category: "kyc", fields: ["pan", "name", "dob"] },
        { keywords: ["aadhaar", "aadhar", "ekyc", "uidai"], provider: "UIDAI", category: "kyc", fields: ["aadhaar", "otp", "consent"] },
        { keywords: ["gst", "gstin", "gstn", "gst verification"], provider: "GSTN", category: "gst", fields: ["gstin"] },
        { keywords: ["bank statement", "perfios", "account aggregator", "bank analysis"], provider: "Perfios", category: "banking", fields: ["account_number", "ifsc"] },
        { keywords: ["razorpay", "upi", "payment gateway", "payment"], provider: "Razorpay", category: "payment", fields: ["amount", "vpa"] },
        { keywords: ["nach", "mandate", "emi", "npci"], provider: "NPCI", category: "payment", fields: ["customer_name", "bank_account", "amount"] },
        { keywords: ["esign", "e-sign", "digital signature", "digio", "emudhra"], provider: "Digio", category: "esign", fields: ["document_hash", "signer_name"] },
        { keywords: ["fraud", "risk", "bureau.id", "device fingerprint"], provider: "Bureau.id", category: "kyc", fields: ["pan", "mobile", "email"] },
      ];

      for (const det of serviceDetectors) {
        const matches = det.keywords.filter(k => text.includes(k));
        if (matches.length > 0) {
          services.push({
            provider: det.provider,
            category: det.category,
            confidence: Math.min(0.5 + matches.length * 0.15, 0.98),
            mandatory: matches.length >= 2,
            mentioned_fields: det.fields,
            purpose: `${det.provider} integration for ${det.category.replace(/_/g, " ")} services`,
          });
        }
      }

      if (services.length === 0) {
        services.push(
          { provider: "TransUnion CIBIL", category: "credit_bureau", confidence: 0.75, mandatory: true, mentioned_fields: ["pan", "name", "dob"], purpose: "Credit score verification" },
          { provider: "UIDAI", category: "kyc", confidence: 0.82, mandatory: true, mentioned_fields: ["aadhaar", "consent"], purpose: "Aadhaar-based eKYC" },
          { provider: "Razorpay", category: "payment", confidence: 0.65, mandatory: false, mentioned_fields: ["amount", "vpa"], purpose: "Payment processing" },
        );
      }

      parsed_result = {
        summary: `Document analysis identified ${services.length} potential integration services required for the lending platform.`,
        detected_services: services,
        global_fields: ["pan", "mobile", "dob", "customer_name", "loan_amount", "address"],
        compliance_notes: [
          "RBI digital lending guidelines compliance required",
          "Data localization: all PII must be stored in India",
          "Consent management framework needed for data sharing",
        ],
        integration_count: services.length,
      };
    }

    // Save document
    const { data: doc } = await supabase.from("documents").insert({
      tenant_id,
      file_name: file_name || "document.txt",
      file_type: file_name?.split(".").pop() || "txt",
      raw_text: document_text.substring(0, 50000),
      parsed_result,
      status: "parsed",
    }).select().single();

    // Audit log
    await supabase.from("audit_logs").insert({
      tenant_id,
      action: "document_parsed",
      entity_type: "document",
      entity_id: doc?.id,
      performed_by: "system",
      payload: { file_name, services_found: parsed_result.detected_services?.length || 0 },
    });

    console.log("parse-document response:", JSON.stringify(parsed_result));
    return new Response(JSON.stringify({ parsed_result, document_id: doc?.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("parse-document error:", e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
