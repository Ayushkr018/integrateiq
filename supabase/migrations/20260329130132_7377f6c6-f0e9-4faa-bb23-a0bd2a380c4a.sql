
-- Seed adapter versions for adapters that don't have versions yet
INSERT INTO public.adapter_versions (adapter_id, version, auth_type, base_url, is_latest, deprecated, sample_request, sample_response) VALUES
  ('da2a3394-32cf-4310-bd5b-4c9eea9c0e17', 'v3.0', 'oauth2', 'https://api.experian.in/v3', true, false, '{"pan":"ABCDE1234F","name":"Raj Kumar"}', '{"score":720,"report":{},"enquiries":[]}'),
  ('2c925f23-f892-46b1-9877-98b768fdd684', 'v2.0', 'otp', 'https://api.uidai.gov.in/ekyc/v2', true, false, '{"aadhaar":"XXXX1234","consent":true}', '{"name":"Raj Kumar","verified":true}'),
  ('5e780e7f-421d-4c2a-994c-dca81d7c0219', 'v1.0', 'api_key', 'https://api.gstn.gov.in/v1', true, false, '{"gstin":"22AAAAA0000A1Z5"}', '{"legal_name":"Test Corp","status":"Active"}'),
  ('47643a7f-7bff-43ab-a59b-6629620847ee', 'v4.2', 'oauth2', 'https://api.perfios.com/v4', true, false, '{"account_number":"1234567890","ifsc":"HDFC0001234"}', '{"avg_balance":150000,"salary_detected":true}'),
  ('7dbb63f7-d128-43ce-bca1-41d41a26db22', 'v2.1', 'oauth2', 'https://api.setu.co/v2', true, false, '{"consent_id":"CNS-123"}', '{"accounts":[],"status":"complete"}'),
  ('bbb8b4e5-dea8-4fdb-baf1-7fd60d390371', 'v2.0', 'api_key', 'https://api.razorpay.com/v2', true, false, '{"amount":50000,"vpa":"raj@upi"}', '{"transaction_id":"txn_123","status":"success"}'),
  ('834b31df-5f96-4b13-8ec6-b0217327abb0', 'v3.1', 'aadhaar_otp', 'https://api.digio.in/v3', true, false, '{"document_hash":"abc123","signer_name":"Raj Kumar"}', '{"signed":true,"certificate_id":"CERT-456"}');

-- Seed some demo audit logs
INSERT INTO public.audit_logs (tenant_id, action, entity_type, entity_id, performed_by, payload) VALUES
  ('00000000-0000-0000-0000-000000000001', 'document_parsed', 'document', gen_random_uuid(), 'system', '{"file_name":"BRD_Lending_Platform.pdf","services_found":5}'),
  ('00000000-0000-0000-0000-000000000001', 'adapters_matched', 'adapter', gen_random_uuid(), 'system', '{"matched_count":4,"confidence_avg":0.87}'),
  ('00000000-0000-0000-0000-000000000001', 'config_generated', 'integration_config', gen_random_uuid(), 'admin@testbank.com', '{"adapter":"CIBIL Credit Score","fields_mapped":6}'),
  ('00000000-0000-0000-0000-000000000001', 'simulation_run', 'simulation', gen_random_uuid(), 'admin@testbank.com', '{"status":"success","latency_ms":234}'),
  ('00000000-0000-0000-0000-000000000001', 'config_generated', 'integration_config', gen_random_uuid(), 'admin@testbank.com', '{"adapter":"Aadhaar eKYC","fields_mapped":4}'),
  ('00000000-0000-0000-0000-000000000001', 'document_parsed', 'document', gen_random_uuid(), 'system', '{"file_name":"API_Spec_v2.txt","services_found":3}'),
  ('00000000-0000-0000-0000-000000000001', 'simulation_run', 'simulation', gen_random_uuid(), 'admin@testbank.com', '{"status":"success","latency_ms":187}');
