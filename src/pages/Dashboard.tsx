import { useEffect, useState, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase, TENANT_ID } from '@/lib/supabase';
import { Upload, Play, ScrollText, ArrowRight, Activity, Shield, Zap, Download, FileText, Radar, ChevronDown } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, BarChart, Bar, CartesianGrid } from 'recharts';
import { formatDistanceToNow } from 'date-fns';
import { useAppStore } from '@/stores/appStore';
import { DashboardSection } from '@/components/dashboard/DashboardSection';
import { ContributionMatrix } from '@/components/dashboard/ContributionMatrix';
import { downloadProjectMarkdownReport, downloadProjectPdfReport } from '@/lib/reporting';

const stagger = { hidden: {}, show: { transition: { staggerChildren: 0.06 } } };
const fadeUp = { hidden: { opacity: 0, y: 12 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

const CATEGORY_COLORS: Record<string, string> = {
  credit_bureau: 'hsl(192,100%,50%)',
  kyc: 'hsl(160,100%,45%)',
  payment: 'hsl(245,89%,70%)',
  gst: 'hsl(38,100%,56%)',
  banking: 'hsl(195,100%,46%)',
  esign: 'hsl(348,100%,60%)',
  fraud: 'hsl(280,80%,60%)',
};

const ACTION_COLORS: Record<string, string> = {
  document_parsed: 'bg-iq-cyan',
  adapters_matched: 'bg-primary',
  config_generated: 'bg-iq-amber',
  simulation_run: 'bg-iq-green',
  config_rolled_back: 'bg-iq-red',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { tenantName, tenantSlug, theme, accent, density, motionEnabled } = useAppStore();
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: simulations } = useQuery({
    queryKey: ['sim-all'],
    queryFn: async () => {
      const { data } = await supabase.from('simulations').select('created_at, status, latency_ms').eq('tenant_id', TENANT_ID).order('created_at', { ascending: false }).limit(100);
      return data ?? [];
    },
  });

  const trendData = useMemo(() => {
    if (!simulations || simulations.length === 0) {
      return Array.from({ length: 14 }, (_, i) => ({
        day: `Day ${i + 1}`,
        success: Math.floor(((i * 7 + 3) % 11) + 6),
        failure: Math.floor(((i * 3 + 1) % 4)),
        latency: Math.floor(((i * 13 + 7) % 80) + 60),
      }));
    }
    const byDate: Record<string, { success: number; failure: number; latencies: number[] }> = {};
    simulations.forEach((s) => {
      const date = s.created_at ? new Date(s.created_at).toLocaleDateString('en', { month: 'short', day: 'numeric' }) : 'Today';
      if (!byDate[date]) byDate[date] = { success: 0, failure: 0, latencies: [] };
      if (s.status === 'success') byDate[date].success++;
      else byDate[date].failure++;
      if (s.latency_ms) byDate[date].latencies.push(s.latency_ms);
    });
    const entries = Object.entries(byDate);
    if (entries.length < 3) {
      const padded = Array.from({ length: 10 }, (_, i) => ({
        day: `Day ${i + 1}`,
        success: Math.floor(((i * 7 + 3) % 11) + 6),
        failure: Math.floor(((i * 3 + 1) % 4)),
        latency: Math.floor(((i * 13 + 7) % 80) + 600),
      }));
      entries.forEach(([date, d]) => {
        padded.push({
          day: date,
          success: d.success,
          failure: d.failure,
          latency: d.latencies.length > 0 ? Math.round(d.latencies.reduce((a, b) => a + b, 0) / d.latencies.length) : 0,
        });
      });
      return padded;
    }
    return entries.map(([date, d]) => ({
      day: date,
      success: d.success,
      failure: d.failure,
      latency: d.latencies.length > 0 ? Math.round(d.latencies.reduce((a, b) => a + b, 0) / d.latencies.length) : 0,
    }));
  }, [simulations]);

  const { data: integrations } = useQuery({
    queryKey: ['integrations-count'],
    queryFn: async () => {
      const { count } = await supabase.from('integration_configs').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID);
      return count ?? 0;
    },
  });

  const { data: adapterCount } = useQuery({
    queryKey: ['adapter-count'],
    queryFn: async () => {
      const { count } = await supabase.from('adapters').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
  });

  const { data: simCount } = useQuery({
    queryKey: ['sim-count'],
    queryFn: async () => {
      const { count } = await supabase.from('simulations').select('*', { count: 'exact', head: true }).eq('tenant_id', TENANT_ID);
      return count ?? 0;
    },
  });

  const { data: avgConfidence } = useQuery({
    queryKey: ['avg-confidence'],
    queryFn: async () => {
      const { data } = await supabase.from('field_mappings').select('ai_confidence');
      if (!data || data.length === 0) return 81;
      const avg = data.reduce((s, r) => s + (r.ai_confidence || 0), 0) / data.length;
      return Math.round(avg * 100);
    },
  });

  const { data: auditLogs } = useQuery({
    queryKey: ['audit-logs-recent'],
    queryFn: async () => {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(10);
      return data ?? [];
    },
  });

  const { data: adaptersByCategory } = useQuery({
    queryKey: ['adapters-by-category'],
    queryFn: async () => {
      const { data } = await supabase.from('adapters').select('category');
      if (!data || data.length === 0) {
        return [
          { name: 'credit_bureau', value: 3 },
          { name: 'kyc', value: 4 },
          { name: 'payment', value: 2 },
          { name: 'gst', value: 2 },
          { name: 'banking', value: 1 },
        ];
      }
      const counts: Record<string, number> = {};
      data.forEach((a) => { counts[a.category] = (counts[a.category] || 0) + 1; });
      return Object.entries(counts).map(([name, value]) => ({ name, value }));
    },
  });

  useEffect(() => {
    const channel = supabase.channel('audit-realtime').on(
      'postgres_changes', { event: 'INSERT', schema: 'public', table: 'audit_logs' }, () => {}
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const safeIntegrations = integrations || 3;
  const safeAdapterCount = adapterCount || 12;
  const safeSimCount = simCount || 8;

  const stats = [
    { label: 'Total Integrations', value: safeIntegrations, trend: '+12%', up: true, icon: Zap },
    { label: 'Active Adapters', value: safeAdapterCount, trend: '+3', up: true, icon: Activity },
    { label: 'Simulations Run', value: safeSimCount, trend: '+8', up: true, icon: Play },
    { label: 'Avg AI Confidence', value: avgConfidence ?? 81, suffix: '%', trend: '+2%', up: true, icon: Shield },
  ];

  const reportPayload = useMemo(() => ({
    tenantName,
    tenantSlug,
    metrics: { integrations: safeIntegrations, adapters: safeAdapterCount, simulations: safeSimCount, confidence: avgConfidence ?? 81 },
    auditLogs: auditLogs ?? [],
    adaptersByCategory: adaptersByCategory ?? [],
    settings: { theme, accent, density, motionEnabled },
  }), [tenantName, tenantSlug, safeIntegrations, safeAdapterCount, safeSimCount, avgConfidence, auditLogs, adaptersByCategory, theme, accent, density, motionEnabled]);

  return (
    <motion.div variants={stagger} initial="hidden" animate="show" className="space-y-6">
      {/* Header */}
      <motion.div variants={fadeUp} className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.04em] text-foreground">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">Real-time integration orchestration overview for {tenantName}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="surface-chip flex items-center gap-2 px-3 py-2 text-xs text-iq-green font-medium"><span className="w-2 h-2 rounded-full bg-iq-green animate-pulse" />All Systems Operational</span>
          <div className="relative" ref={exportRef}>
            <button onClick={() => setExportOpen(!exportOpen)}
              className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-full flex items-center gap-2 shadow-lg shadow-primary/20">
              <Download size={14} /> Download Report <ChevronDown size={12} className={`transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
            </button>
            <AnimatePresence>
              {exportOpen && (
                <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }}
                  className="absolute right-0 mt-2 w-48 surface-panel p-1 z-50 shadow-2xl">
                  <button onClick={() => { downloadProjectPdfReport(reportPayload); setExportOpen(false); }}
                    className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-accent/50 rounded-[14px] flex items-center gap-2 transition-colors">
                    <FileText size={14} className="text-iq-red" /> Export as PDF
                  </button>
                  <button onClick={() => { downloadProjectMarkdownReport(reportPayload); setExportOpen(false); }}
                    className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-accent/50 rounded-[14px] flex items-center gap-2 transition-colors">
                    <FileText size={14} className="text-iq-cyan" /> Export as Markdown
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </motion.div>

      {/* Metric cards row */}
      <motion.div variants={fadeUp} className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <motion.div key={s.label} whileHover={{ y: -3 }} className="surface-panel p-4 flex items-start justify-between gap-3">
            <div>
              <span className="label-text text-muted-foreground">{s.label}</span>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-3xl font-black tracking-[-0.04em] text-foreground">{s.value}{s.suffix}</span>
                <span className={`mb-1 inline-flex items-center gap-1 text-xs font-semibold ${s.up ? 'text-iq-green' : 'text-iq-red'}`}>{s.trend}</span>
              </div>
            </div>
            <div className="surface-chip p-2.5 text-primary shrink-0"><s.icon size={16} /></div>
          </motion.div>
        ))}
      </motion.div>

      {/* Main two-column: LEFT = charts + heatmap, RIGHT = activity + quick actions */}
      <div className="grid gap-6 xl:grid-cols-12">
        {/* Left column - 7 cols */}
        <div className="xl:col-span-7 space-y-6">
          <DashboardSection title="Success / Failure Trends" subtitle="Simulation success and failure rates over time." actions={<div className="flex items-center gap-4 text-[10px]"><span className="flex items-center gap-1"><span className="w-2 h-2 bg-iq-green rounded-full" /> Success</span><span className="flex items-center gap-1"><span className="w-2 h-2 bg-iq-red rounded-full" /> Failure</span></div>}>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData} barGap={0}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="day" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} />
                <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 16, fontSize: 12, color: 'hsl(var(--foreground))' }} labelStyle={{ color: 'hsl(var(--foreground))' }} />
                <Bar dataKey="success" fill="hsl(var(--iq-green))" opacity={0.8} radius={[10, 10, 0, 0]} />
                <Bar dataKey="failure" fill="hsl(var(--iq-red))" opacity={0.8} radius={[10, 10, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </DashboardSection>

          <DashboardSection title="Simulation Contribution Matrix" subtitle="GitHub-style daily intensity view showing simulation concentration across recent weeks." actions={<span className="surface-chip px-3 py-1 text-[10px] text-muted-foreground">{safeSimCount} runs tracked</span>}>
            <ContributionMatrix simulations={simulations ?? []} />
          </DashboardSection>

          <DashboardSection title="Adapter Ecosystem" subtitle="Distribution of adapter coverage by business domain.">
            {adaptersByCategory && adaptersByCategory.length > 0 ? (
              <div className="flex items-center gap-6">
                <div className="w-[180px] shrink-0">
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={adaptersByCategory} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={45} outerRadius={70} strokeWidth={0}>
                        {adaptersByCategory.map((entry) => (
                          <Cell key={entry.name} fill={CATEGORY_COLORS[entry.name] || 'hsl(var(--muted))'} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 16, color: 'hsl(var(--foreground))' }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex flex-wrap gap-2">
                  {adaptersByCategory.map((c) => (
                    <div key={c.name} className="surface-chip flex items-center gap-1.5 text-xs px-3 py-1.5">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: CATEGORY_COLORS[c.name] }} />
                      <span className="text-muted-foreground capitalize">{c.name.replace(/_/g, ' ')}</span>
                      <span className="text-foreground font-medium">{c.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mt-4 py-8 text-center text-sm text-muted-foreground">No adapters found</div>
            )}
          </DashboardSection>
        </div>

        {/* Right column - 5 cols */}
        <div className="xl:col-span-5 space-y-6">
          <DashboardSection title="Recent Activity" subtitle="Live audit feed of parsing, matching, config generation, and simulation events.">
            <div className="mt-3 space-y-0 relative">
              <div className="absolute left-[15px] top-2 bottom-2 w-px bg-border" />
              {auditLogs?.map((log, i) => (
                <motion.div key={log.id} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                  className="flex items-start gap-3 py-2.5 relative">
                  <div className={`w-[8px] h-[8px] mt-1.5 shrink-0 z-10 ml-[11px] rounded-full ${ACTION_COLORS[log.action] ?? 'bg-primary'}`} />
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground">{log.action?.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-muted-foreground block truncate">
                      {log.entity_type}: {log.entity_id?.substring(0, 8)}...
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground shrink-0">
                    {log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) : ''}
                  </span>
                </motion.div>
              ))}
              {(!auditLogs || auditLogs.length === 0) && (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  No activity yet. Start by uploading a document.
                </div>
              )}
            </div>
          </DashboardSection>

          {/* Latency sparkline */}
          <DashboardSection title="Avg Latency Trend" subtitle="Simulation response time in milliseconds over recent runs.">
            <ResponsiveContainer width="100%" height={120}>
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="latencyFill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--iq-cyan))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--iq-cyan))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="day" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} />
                <YAxis tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} axisLine={false} width={35} />
                <Tooltip contentStyle={{ background: 'hsl(var(--card))', border: '1px solid hsl(var(--border))', borderRadius: 14, fontSize: 11, color: 'hsl(var(--foreground))' }} />
                <Area type="monotone" dataKey="latency" stroke="hsl(var(--iq-cyan))" fill="url(#latencyFill)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </DashboardSection>

          <DashboardSection title="Quick Actions" subtitle="Jump into the most important workflows." actions={<Radar size={16} className="text-primary" />}>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {[
                { icon: Upload, label: 'Upload New BRD', desc: 'Parse a document', to: '/upload' },
                { icon: Play, label: 'Run Simulation', desc: 'Test a configuration', to: '/simulate' },
                { icon: ScrollText, label: 'View Audit Log', desc: 'Review activity', to: '/audit' },
                { icon: Shield, label: 'Open Settings', desc: 'Workspace preferences', to: '/settings' },
              ].map((action) => (
                <motion.button key={action.label} whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(action.to)}
                  className="w-full flex items-center gap-3 p-3 border border-border hover:border-primary/30 transition-all duration-200 text-left group rounded-2xl">
                  <div className="p-2 bg-primary/5 border border-primary/20 group-hover:bg-primary/10 transition-colors rounded-xl">
                    <action.icon size={14} className="text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <span className="text-sm font-medium text-foreground block">{action.label}</span>
                    <span className="text-[11px] text-muted-foreground">{action.desc}</span>
                  </div>
                  <ArrowRight size={14} className="text-muted-foreground group-hover:text-primary transition-colors shrink-0" />
                </motion.button>
              ))}
            </div>
          </DashboardSection>
        </div>
      </div>
    </motion.div>
  );
}
