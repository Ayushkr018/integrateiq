import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { callEdgeFunction, TENANT_ID, supabase } from '@/lib/supabase';
import { useAppStore } from '@/stores/appStore';
import { GeometricSpinner } from '@/components/ui/GeometricSpinner';
import { ArrowRight, ArrowLeft, Check, X, Copy, Play, AlertTriangle, Sparkles, Zap } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0 } };

const STEPS = ['Match Adapters', 'Map Fields', 'Config Preview', 'Simulate & Activate'];
const DEFAULT_SOURCE_FIELDS = ['pan', 'mobile', 'dob', 'loan_amount', 'customer_name', 'address', 'income', 'employment_type'];

const SIM_LOADING_LINES = [
  '> Establishing secure connection...',
  '> Authenticating with service...',
  '> Dispatching request payload...',
  '> Awaiting upstream response...',
  '> Validating response schema...',
];

export default function Configure() {
  const [step, setStep] = useState(0);
  const { parsedResult, setParsedResult, setCurrentConfigId } = useAppStore();
  const { toast } = useToast();
  const navigate = useNavigate();

  // Step 0 state
  const [matching, setMatching] = useState(false);
  const [matchResults, setMatchResults] = useState<any[] | null>(null);
  const [selectedAdapters, setSelectedAdapters] = useState<Record<string, { included: boolean; versionId: string }>>({});

  // Step 1 state
  const [sourceFields, setSourceFields] = useState<string[]>(DEFAULT_SOURCE_FIELDS);
  const [newField, setNewField] = useState('');
  const [mappingLoading, setMappingLoading] = useState(false);
  const [mappings, setMappings] = useState<any>(null);
  const [configId, setConfigId] = useState<string | null>(null);

  // Step 3 state
  const [simPayload, setSimPayload] = useState('{\n  "pan": "ABCDE1234F",\n  "mobile": "9876543210",\n  "dob": "1990-01-15",\n  "loan_amount": 500000,\n  "customer_name": "Raj Kumar"\n}');
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<any>(null);
  const [simError, setSimError] = useState('');
  const [simLines, setSimLines] = useState<string[]>([]);

  // Auto-match on mount if parsedResult exists
  useEffect(() => {
    if (parsedResult && !matchResults && step === 0) {
      matchAdapters();
    }
  }, [parsedResult]);

  const matchAdapters = async () => {
    if (!parsedResult) {
      toast({ title: 'No document parsed', description: 'Please upload and parse a document first.', variant: 'destructive' });
      return;
    }
    setMatching(true);
    try {
      const data = await callEdgeFunction('match-adapters', {
        tenant_id: TENANT_ID,
        parsed_result: parsedResult,
      });
      console.log('match-adapters response:', data);
      const raw = data.matches || data.matched_adapters || data;
      const matches = Array.isArray(raw) ? raw : [];
      setMatchResults(matches);
      const sel: Record<string, { included: boolean; versionId: string }> = {};
      matches.forEach((m: any) => {
        const versions = m.versions || [];
        const latestV = versions.find((v: any) => v.is_latest && !v.deprecated) || versions.find((v: any) => !v.deprecated) || versions[0];
        sel[m.adapter_id || m.id] = { included: true, versionId: latestV?.id || '' };
      });
      setSelectedAdapters(sel);
      if (matches.length > 0) {
        toast({ title: `${matches.length} adapters matched`, description: 'Select adapters to configure.' });
      }
    } catch (e: any) {
      console.error('match-adapters error:', e);
      toast({ title: 'Match failed', description: e.message, variant: 'destructive' });
    } finally {
      setMatching(false);
    }
  };

  const generateConfig = async () => {
    const included = Object.entries(selectedAdapters).filter(([, v]) => v.included && v.versionId);
    if (included.length === 0) {
      toast({ title: 'No adapter selected', description: 'Select at least one adapter with a version.', variant: 'destructive' });
      return;
    }
    setMappingLoading(true);
    try {
      const [adapterId, { versionId }] = included[0];
      console.log('generate-config request:', { tenant_id: TENANT_ID, adapter_version_id: versionId, source_fields: sourceFields });
      const data = await callEdgeFunction('generate-config', {
        tenant_id: TENANT_ID,
        adapter_version_id: versionId,
        source_fields: sourceFields,
      });
      console.log('generate-config response:', data);
      setMappings(data);
      const cid = data.config_id || data.id || null;
      setConfigId(cid);
      setCurrentConfigId(cid);
      toast({ title: 'AI Mappings generated', description: `${data.field_mappings?.length || 0} field mappings created.` });
    } catch (e: any) {
      console.error('generate-config error:', e);
      toast({ title: 'Config generation failed', description: e.message, variant: 'destructive' });
    } finally {
      setMappingLoading(false);
    }
  };

  const runSimulation = async () => {
    if (!configId) return;
    setSimLoading(true);
    setSimResult(null);
    setSimError('');
    setSimLines([]);

    for (let i = 0; i < SIM_LOADING_LINES.length; i++) {
      await new Promise((r) => setTimeout(r, 350));
      setSimLines((l) => [...l, SIM_LOADING_LINES[i]]);
    }

    const included = Object.entries(selectedAdapters).filter(([, v]) => v.included);
    const versionId = included[0]?.[1]?.versionId;

    try {
      let payload;
      try { payload = JSON.parse(simPayload); } catch { payload = {}; }
      const data = await callEdgeFunction('simulate', {
        tenant_id: TENANT_ID,
        config_id: configId,
        adapter_version_id: versionId,
        request_payload: payload,
      });
      console.log('simulate response:', data);
      setSimResult(data);
      setSimLines((l) => [...l, `> Response received — ${data.latency_ms || 0}ms`]);
    } catch (e: any) {
      console.error('simulate error:', e);
      setSimError(e.message);
    } finally {
      setSimLoading(false);
    }
  };

  const activateConfig = async () => {
    if (!configId) return;
    try {
      await callEdgeFunction('simulate', {
        tenant_id: TENANT_ID,
        config_id: configId,
        adapter_version_id: Object.values(selectedAdapters).find(v => v.included)?.versionId,
        request_payload: { activation_check: true },
      });
      toast({ title: 'Configuration activated', description: 'Your integration is now live.' });
    } catch (e: any) {
      toast({ title: 'Activation failed', description: e.message, variant: 'destructive' });
    }
  };

  const canGoNext = () => {
    if (step === 0) return matchResults && matchResults.length > 0;
    if (step === 1) return !!mappings;
    if (step === 2) return !!configId;
    return false;
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.04em] text-foreground">Configure Integration</h1>
          <p className="text-sm text-muted-foreground mt-1">AI-powered step-by-step integration configuration wizard</p>
        </div>
        {!parsedResult && (
          <motion.button whileTap={{ scale: 0.97 }} onClick={() => navigate('/upload')}
            className="self-start sm:self-auto px-4 py-2 bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2">
            Upload Document First <ArrowRight size={14} />
          </motion.button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center justify-center mt-8 mb-8 overflow-x-auto gap-0 flex-nowrap px-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center shrink-0">
            <motion.div
              whileHover={{ scale: 1.1 }}
              onClick={() => {
                if (i < step) setStep(i);
                if (i === step + 1 && canGoNext()) setStep(i);
              }}
              className={`w-9 h-9 flex items-center justify-center text-xs font-bold cursor-pointer rotate-45 transition-all shrink-0
                ${i < step ? 'bg-iq-green text-background' :
                  i === step ? 'bg-primary text-primary-foreground glow-primary' :
                  'border border-border text-muted-foreground'}`}
            >
              <span className="-rotate-45">{i < step ? <Check size={14} /> : i + 1}</span>
            </motion.div>
            {i < STEPS.length - 1 && (
              <div className={`w-8 sm:w-20 h-[2px] mx-1 sm:mx-2 transition-colors shrink-0 ${i < step ? 'bg-iq-green' : 'bg-border'}`} />
            )}
          </div>
        ))}
      </div>
      <div className="text-center text-sm font-semibold text-foreground mb-6 flex items-center justify-center gap-2">
        <Zap size={14} className="text-primary" />
        {STEPS[step]}
      </div>

      {/* Step 0: Match Adapters */}
      <AnimatePresence mode="wait">
        {step === 0 && (
          <motion.div key="step0" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            {!parsedResult && (
              <div className="border border-border bg-card p-8 text-center">
                <AlertTriangle size={32} className="text-iq-amber mx-auto mb-3" />
                <p className="text-sm text-muted-foreground">No parsed document found. Upload a document first to auto-match adapters.</p>
                <button onClick={() => navigate('/upload')} className="mt-3 text-sm text-primary underline">Go to Upload & Parse →</button>
              </div>
            )}
            {parsedResult && !matchResults && !matching && (
              <div className="border border-border bg-card p-8 text-center">
                <Sparkles size={32} className="text-primary mx-auto mb-3" />
                <p className="text-sm text-foreground font-medium">Ready to match adapters</p>
                <p className="text-xs text-muted-foreground mt-1">AI will analyze your document and find matching integration adapters.</p>
                <motion.button whileTap={{ scale: 0.97 }} onClick={matchAdapters}
                  className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 mx-auto">
                  <Sparkles size={14} /> Run AI Matching
                </motion.button>
              </div>
            )}
            {matching && (
              <div className="flex flex-col items-center py-12">
                <GeometricSpinner size={48} />
                <span className="text-sm text-muted-foreground mt-4">Analyzing document and matching adapters...</span>
              </div>
            )}
            {matchResults && matchResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="label-text text-muted-foreground">{matchResults.length} Adapters Matched</span>
                  <span className="text-xs text-iq-green font-medium">AI Confidence Scores</span>
                </div>
                {matchResults.map((m: any, i: number) => (
                  <motion.div key={m.adapter_id || i} variants={fadeUp} initial="hidden" animate="show" transition={{ delay: i * 0.06 }}
                    className="border border-border bg-card p-4 flex items-center gap-4 hover:border-primary/30 transition-colors">
                    <input type="checkbox" checked={selectedAdapters[m.adapter_id || m.id]?.included ?? true}
                      onChange={() => setSelectedAdapters((s) => ({
                        ...s,
                        [m.adapter_id || m.id]: { ...s[m.adapter_id || m.id], included: !s[m.adapter_id || m.id]?.included }
                      }))}
                      className="w-4 h-4 accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-foreground">{m.adapter_name || m.detected_service}</span>
                        {m.mandatory && <span className="text-[10px] px-1.5 py-0.5 bg-iq-red/10 text-iq-red font-bold">REQUIRED</span>}
                      </div>
                      <span className="text-xs text-muted-foreground block truncate">{m.reason}</span>
                      {m.versions && m.versions.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {m.versions.map((v: any) => (
                            <span key={v.id} className={`text-[10px] px-1.5 py-0.5 border ${
                              v.deprecated ? 'border-iq-red/30 text-iq-red line-through' :
                              v.is_latest ? 'border-iq-cyan/50 text-iq-cyan' : 'border-border text-muted-foreground'
                            }`}>{v.version}{v.is_latest ? ' ✓' : ''}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="text-right shrink-0">
                      <div className="text-lg font-extrabold text-foreground">{Math.round((m.confidence || 0) * 100)}%</div>
                      <div className="w-24 h-1.5 bg-muted mt-1">
                        <motion.div initial={{ width: 0 }} animate={{ width: `${(m.confidence || 0) * 100}%` }}
                          transition={{ duration: 0.8, delay: i * 0.1 }}
                          className={`h-full ${m.confidence > 0.8 ? 'bg-iq-green' : m.confidence > 0.6 ? 'bg-iq-amber' : 'bg-iq-red'}`} />
                      </div>
                    </div>
                  </motion.div>
                ))}
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(1)}
                  className="mt-4 px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2">
                  Configure Selected <ArrowRight size={14} />
                </motion.button>
              </div>
            )}
            {matchResults && matchResults.length === 0 && (
              <div className="border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">No matching adapters found. Try uploading a more detailed document.</p>
              </div>
            )}
          </motion.div>
        )}

        {/* Step 1: Field Mapping */}
        {step === 1 && (
          <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Source fields */}
              <div className="border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="label-text text-muted-foreground">Your System Fields</span>
                  <span className="text-[10px] text-iq-cyan font-medium">{sourceFields.length} fields</span>
                </div>
                <div className="space-y-1.5">
                  {sourceFields.map((f) => (
                    <div key={f} className="flex items-center justify-between px-2 py-1.5 bg-muted/30 text-sm hover:bg-muted/50 transition-colors">
                      <span className="text-foreground font-mono text-xs">{f}</span>
                      <button onClick={() => setSourceFields((s) => s.filter((x) => x !== f))} className="text-muted-foreground hover:text-iq-red transition-colors">
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  <div className="flex gap-2 mt-2">
                    <input value={newField} onChange={(e) => setNewField(e.target.value)} placeholder="Add custom field..."
                      className="flex-1 px-2 py-1.5 bg-transparent border border-border text-xs outline-none text-foreground focus:border-primary/50 transition-colors"
                      onKeyDown={(e) => { if (e.key === 'Enter' && newField.trim()) { setSourceFields((s) => [...s, newField.trim()]); setNewField(''); } }}
                    />
                    <button onClick={() => { if (newField.trim()) { setSourceFields((s) => [...s, newField.trim()]); setNewField(''); } }}
                      className="px-3 py-1.5 text-xs bg-primary text-primary-foreground font-medium">Add</button>
                  </div>
                </div>
              </div>

              {/* Target / mapping */}
              <div className="border border-border bg-card p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="label-text text-muted-foreground">Adapter Target Fields</span>
                  {mappings && <span className="text-[10px] text-iq-green font-medium">AI MAPPED</span>}
                </div>
                {mappings ? (
                  <div className="space-y-2">
                    {(mappings.field_mappings || mappings.mappings || []).map((m: any, i: number) => (
                      <motion.div key={i} initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                        className="flex items-center gap-2 text-xs px-2 py-2 bg-muted/30 hover:bg-muted/50 transition-colors">
                        <span className="font-mono text-foreground">{m.source_field}</span>
                        <ArrowRight size={10} className="text-primary shrink-0" />
                        <span className="font-mono text-iq-cyan">{m.target_field}</span>
                        {m.transform_rule && (
                          <span className="text-[9px] px-1 py-0.5 bg-iq-amber/10 text-iq-amber font-medium ml-1">{m.transform_rule}</span>
                        )}
                        <span className={`ml-auto text-[10px] font-bold ${
                          (m.ai_confidence || 0) > 0.85 ? 'text-iq-green' :
                          (m.ai_confidence || 0) > 0.7 ? 'text-iq-amber' : 'text-iq-red'
                        }`}>
                          {Math.round((m.ai_confidence || m.confidence || 0) * 100)}%
                        </span>
                      </motion.div>
                    ))}
                  </div>
                ) : (
                  <div className="py-8 text-center">
                    <Sparkles size={24} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-xs text-muted-foreground">Click "Generate AI Mappings" to auto-map fields</p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-4">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(0)}
                className="px-4 py-2.5 border border-border text-sm text-muted-foreground flex items-center gap-2 hover:text-foreground transition-colors">
                <ArrowLeft size={14} /> Back
              </motion.button>
              {!mappings && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={generateConfig} disabled={mappingLoading}
                  className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 disabled:opacity-50 glow-primary">
                  {mappingLoading ? <><GeometricSpinner size={16} /> Generating AI Mappings...</> : <><Sparkles size={14} /> Generate AI Mappings</>}
                </motion.button>
              )}
              {mappings && (
                <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(2)}
                  className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2">
                  Continue to Preview <ArrowRight size={14} />
                </motion.button>
              )}
            </div>
          </motion.div>
        )}

        {/* Step 2: Config Preview */}
        {step === 2 && (
          <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
            <div className="grid grid-cols-1 md:grid-cols-[60fr_40fr] gap-6">
              <div className="border border-border bg-card p-4 relative">
                <div className="flex items-center justify-between mb-3">
                  <span className="label-text text-muted-foreground">Configuration JSON</span>
                  <button onClick={() => { navigator.clipboard.writeText(JSON.stringify(mappings, null, 2)); toast({ title: 'Copied to clipboard!' }); }}
                    className="p-1.5 hover:bg-accent text-muted-foreground transition-colors"><Copy size={14} /></button>
                </div>
                <pre className="text-xs font-mono overflow-auto max-h-96 text-foreground leading-relaxed bg-muted/20 p-3">
                  {JSON.stringify(mappings, null, 2)}
                </pre>
              </div>
              <div className="space-y-4">
                <div className="border border-border bg-card p-4">
                  <span className="label-text text-muted-foreground">Config Metadata</span>
                  <div className="space-y-2.5 mt-3 text-sm">
                    <div className="flex justify-between"><span className="text-muted-foreground">Config ID</span><span className="font-mono text-xs text-foreground">{configId?.substring(0, 8)}...</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Tenant</span><span className="text-foreground">Test Bank Ltd</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span className="text-iq-amber font-bold text-xs">DRAFT</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Fields Mapped</span><span className="text-foreground font-medium">{mappings?.field_mappings?.length || 0}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Adapter</span><span className="text-foreground text-xs">{mappings?.config?.adapter || 'N/A'}</span></div>
                  </div>
                </div>
                <div className="border border-iq-green/20 bg-iq-green/5 p-3">
                  <div className="flex items-center gap-2 text-xs text-iq-green font-medium">
                    <Check size={12} /> Configuration validated — ready for simulation
                  </div>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-4">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(1)}
                className="px-4 py-2.5 border border-border text-sm text-muted-foreground flex items-center gap-2 hover:text-foreground transition-colors">
                <ArrowLeft size={14} /> Back
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(3)}
                className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2">
                Proceed to Simulate <ArrowRight size={14} />
              </motion.button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Simulate & Activate */}
        {step === 3 && (
          <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="border border-border bg-card p-4">
                <span className="label-text text-muted-foreground">Request Payload</span>
                <textarea value={simPayload} onChange={(e) => setSimPayload(e.target.value)}
                  className="w-full mt-2 bg-muted/20 font-mono text-xs text-foreground outline-none resize-none border border-border p-3 focus:border-primary/50 transition-colors"
                  rows={8} />
              </div>
              <div className="border border-border bg-card p-4">
                <span className="label-text text-muted-foreground">Simulation Console</span>
                <div className="mt-2 bg-muted/20 border border-border p-3 font-mono text-xs min-h-[180px] overflow-auto">
                  {simLines.length === 0 && <span className="text-muted-foreground">Waiting for simulation...</span>}
                  {simLines.map((line, i) => (
                    <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-iq-green">{line}</motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button whileTap={{ scale: 0.97 }} onClick={() => setStep(2)}
                className="px-4 py-2.5 border border-border text-sm text-muted-foreground flex items-center gap-2 hover:text-foreground transition-colors">
                <ArrowLeft size={14} /> Back
              </motion.button>
              <motion.button whileTap={{ scale: 0.97 }} onClick={runSimulation} disabled={simLoading}
                className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 disabled:opacity-50">
                {simLoading ? <><GeometricSpinner size={16} /> Running...</> : <><Play size={14} /> Run Simulation</>}
              </motion.button>
            </div>

            {simError && (
              <div className="border border-iq-red/30 bg-iq-red/5 p-4 text-sm text-iq-red flex items-center gap-2">
                <AlertTriangle size={16} /> {simError}
                <button onClick={runSimulation} className="ml-auto text-xs underline">Retry</button>
              </div>
            )}

            {simResult && (
              <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <div className="flex items-center gap-3">
                  <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                    className={`px-3 py-1 text-sm font-bold ${simResult.status === 'success' ? 'bg-iq-green/10 text-iq-green' : 'bg-iq-red/10 text-iq-red'}`}>
                    {(simResult.status || 'SUCCESS').toUpperCase()}
                  </motion.span>
                  <span className="text-xs text-muted-foreground">{simResult.latency_ms || 0}ms latency</span>
                  <span className="text-xs text-muted-foreground">Simulation ID: {simResult.simulation_id?.substring(0, 8)}</span>
                </div>

                <div className="border border-border bg-card p-4">
                  <span className="label-text text-muted-foreground">Response Payload</span>
                  <pre className="text-xs font-mono mt-2 overflow-auto max-h-48 text-foreground bg-muted/20 p-3">
                    {JSON.stringify(simResult.response || simResult.mock_response || simResult, null, 2)}
                  </pre>
                </div>

                <motion.button whileTap={{ scale: 0.97 }} onClick={activateConfig}
                  className="w-full py-3 bg-iq-green text-background font-bold text-sm flex items-center justify-center gap-2"
                  animate={{ boxShadow: ['0 0 15px hsl(160 100% 45% / 0.2)', '0 0 25px hsl(160 100% 45% / 0.4)', '0 0 15px hsl(160 100% 45% / 0.2)'] }}
                  transition={{ duration: 2, repeat: Infinity }}>
                  <Check size={16} /> Save & Activate Configuration
                </motion.button>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
