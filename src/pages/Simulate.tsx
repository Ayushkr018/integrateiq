import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase, TENANT_ID, callEdgeFunction } from '@/lib/supabase';
import { GeometricSpinner } from '@/components/ui/GeometricSpinner';
import { Play, ChevronDown, AlertTriangle } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { formatDistanceToNow } from 'date-fns';

export default function Simulate() {
  const [selectedConfigId, setSelectedConfigId] = useState('');
  const [payload, setPayload] = useState('{\n  "pan": "ABCDE1234F",\n  "mobile": "9876543210"\n}');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const { data: configs } = useQuery({
    queryKey: ['configs-for-sim'],
    queryFn: async () => {
      const { data } = await supabase.from('integration_configs').select('*, adapter_versions(version, adapters(name))').eq('tenant_id', TENANT_ID);
      return data ?? [];
    },
  });

  const { data: simHistory } = useQuery({
    queryKey: ['sim-history'],
    queryFn: async () => {
      const { data } = await supabase.from('simulations')
        .select('*, adapter_versions(version, adapters(name))')
        .eq('tenant_id', TENANT_ID)
        .order('created_at', { ascending: false })
        .limit(20);
      return data ?? [];
    },
  });

  const latencyData = simHistory?.slice(0, 10).reverse().map((s, i) => ({
    run: i + 1,
    ms: s.latency_ms || 0,
  })) || [];

  const runSim = async () => {
    if (!selectedConfigId) return;
    setLoading(true);
    setResult(null);
    setError('');
    try {
      let p; try { p = JSON.parse(payload); } catch { p = {}; }
      const config = configs?.find((c) => c.id === selectedConfigId);
      const data = await callEdgeFunction('simulate', {
        tenant_id: TENANT_ID,
        config_id: selectedConfigId,
        adapter_version_id: config?.adapter_version_id,
        request_payload: p,
      });
      setResult(data);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const [expandedSim, setExpandedSim] = useState<string | null>(null);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-[28px] font-bold tracking-[-0.04em] text-foreground">Simulation Runner</h1>
      <p className="text-sm text-muted-foreground mt-1">Test your integration configurations</p>

      <div className="mt-6 space-y-4">
        {/* Config selector */}
        <div className="border border-border bg-card p-4">
          <span className="label-text text-muted-foreground">Select Configuration</span>
          <select value={selectedConfigId} onChange={(e) => setSelectedConfigId(e.target.value)}
            className="w-full mt-2 bg-card border border-border text-sm text-foreground p-2 outline-none appearance-none"
            style={{ colorScheme: 'dark' }}>
            <option value="" className="bg-card text-foreground">Choose a configuration...</option>
            {configs?.map((c) => (
              <option key={c.id} value={c.id} className="bg-card text-foreground">
                {(c as any).adapter_versions?.adapters?.name || 'Config'} — {c.status} — {c.id.substring(0, 8)}
              </option>
            ))}
          </select>
        </div>

        {/* Payload */}
        <div className="border border-border bg-card p-4">
          <span className="label-text text-muted-foreground">Request Payload</span>
          <textarea value={payload} onChange={(e) => setPayload(e.target.value)}
            className="w-full mt-2 bg-transparent font-mono text-xs text-foreground outline-none resize-none border border-border p-3"
            rows={6} />
        </div>

        <motion.button whileTap={{ scale: 0.97 }} onClick={runSim} disabled={loading || !selectedConfigId}
          className="px-6 py-2.5 bg-primary text-primary-foreground text-sm font-medium flex items-center gap-2 disabled:opacity-50">
          {loading ? <><GeometricSpinner size={16} /> Running...</> : <><Play size={14} /> Run Simulation</>}
        </motion.button>

        {error && (
          <div className="border border-iq-red/30 bg-iq-red/5 p-4 text-sm text-iq-red flex items-center gap-2">
            <AlertTriangle size={16} /> {error}
          </div>
        )}

        {result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="grid gap-4" style={{ gridTemplateColumns: '1fr 1fr' }}>
            <div className="border border-border bg-card p-4">
              <span className="label-text text-muted-foreground">Request</span>
              <pre className="text-xs font-mono mt-2 overflow-auto max-h-48 text-foreground">{payload}</pre>
            </div>
            <div className="border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <span className="label-text text-muted-foreground">Response</span>
                <span className={`text-xs font-bold ${result.status === 'success' ? 'text-iq-green' : 'text-iq-red'}`}>
                  {(result.status || 'SUCCESS').toUpperCase()} • {result.latency_ms || 0}ms
                </span>
              </div>
              <pre className="text-xs font-mono mt-2 overflow-auto max-h-48 text-foreground">
                {JSON.stringify(result.response || result, null, 2)}
              </pre>
            </div>
          </motion.div>
        )}

        {/* Latency chart */}
        {latencyData.length > 0 && (
          <div className="border border-border bg-card p-4">
            <span className="label-text text-muted-foreground">Latency Trend</span>
            <div className="mt-3 h-40">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={latencyData}>
                  <defs>
                    <linearGradient id="latFill" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="hsl(var(--iq-cyan))" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="hsl(var(--iq-cyan))" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="run" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} />
                  <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 0, fontSize: 12 }} />
                  <Area type="monotone" dataKey="ms" stroke="hsl(var(--iq-cyan))" fill="url(#latFill)" strokeWidth={1.5} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Sim history */}
        {simHistory && simHistory.length > 0 && (
          <div className="border border-border bg-card p-4">
            <span className="label-text text-muted-foreground">Simulation History</span>
            <div className="mt-3 space-y-1">
              {simHistory.map((s) => (
                <div key={s.id}>
                  <button onClick={() => setExpandedSim(expandedSim === s.id ? null : s.id)}
                    className="w-full flex items-center gap-4 px-3 py-2 hover:bg-muted/30 transition-colors text-left">
                    <span className={`w-2 h-2 ${s.status === 'success' ? 'bg-iq-green' : 'bg-iq-red'}`} />
                    <span className="text-xs font-mono text-foreground flex-1">{s.id.substring(0, 8)}</span>
                    <span className="text-xs text-muted-foreground">{s.latency_ms}ms</span>
                    <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(s.created_at), { addSuffix: true })}</span>
                    <ChevronDown size={12} className={`text-muted-foreground transition-transform ${expandedSim === s.id ? 'rotate-180' : ''}`} />
                  </button>
                  {expandedSim === s.id && (
                    <div className="px-3 pb-3 grid gap-2" style={{ gridTemplateColumns: '1fr 1fr' }}>
                      <div><span className="label-text text-muted-foreground text-[10px]">Request</span>
                        <pre className="text-[10px] font-mono bg-muted/30 p-2 mt-1 overflow-auto max-h-32 text-foreground">{JSON.stringify(s.request_payload, null, 2)}</pre>
                      </div>
                      <div><span className="label-text text-muted-foreground text-[10px]">Response</span>
                        <pre className="text-[10px] font-mono bg-muted/30 p-2 mt-1 overflow-auto max-h-32 text-foreground">{JSON.stringify(s.response_payload, null, 2)}</pre>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
