import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { ChevronDown, Download, FileText } from 'lucide-react';
import { downloadAuditPdf } from '@/lib/reporting';

const ACTION_COLORS: Record<string, string> = {
  document_parsed: 'bg-iq-cyan',
  adapters_matched: 'bg-primary',
  config_generated: 'bg-iq-amber',
  simulation_run: 'bg-iq-green',
  config_rolled_back: 'bg-iq-red',
};

export default function AuditLog() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState('');
  const [exportOpen, setExportOpen] = useState(false);
  const exportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (exportRef.current && !exportRef.current.contains(e.target as Node)) setExportOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const { data: logs } = useQuery({
    queryKey: ['audit-logs-full'],
    queryFn: async () => {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    if (!logs) return [];
    if (!actionFilter) return logs;
    return logs.filter((l) => l.action === actionFilter);
  }, [logs, actionFilter]);

  const actions = useMemo(() => {
    if (!logs) return [];
    return [...new Set(logs.map((l) => l.action))];
  }, [logs]);

  const exportCSV = () => {
    if (!filtered.length) return;
    const headers = ['id', 'action', 'entity_type', 'entity_id', 'created_at'];
    const rows = filtered.map((l) => headers.map((h) => (l as any)[h] || '').join(','));
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'audit_log.csv'; a.click();
  };

  const exportPDF = () => {
    if (!filtered.length) return;
    downloadAuditPdf(filtered);
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-[28px] font-bold tracking-[-0.04em] text-foreground">Audit Log</h1>
          <p className="text-sm text-muted-foreground mt-1">Complete platform activity trail</p>
        </div>
        <div className="relative" ref={exportRef}>
          <button onClick={() => setExportOpen(!exportOpen)}
            className="px-4 py-2 bg-primary text-primary-foreground text-sm rounded-full flex items-center gap-2 shadow-lg shadow-primary/20">
            <Download size={14} /> Download Report <ChevronDown size={12} className={`transition-transform ${exportOpen ? 'rotate-180' : ''}`} />
          </button>
          <AnimatePresence>
            {exportOpen && (
              <motion.div initial={{ opacity: 0, y: -4, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: -4, scale: 0.95 }}
                className="absolute right-0 mt-2 w-48 surface-panel p-1 z-50 shadow-2xl">
                <button onClick={() => { exportPDF(); setExportOpen(false); }}
                  className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-accent/50 rounded-[14px] flex items-center gap-2 transition-colors">
                  <FileText size={14} className="text-iq-red" /> Export as PDF
                </button>
                <button onClick={() => { exportCSV(); setExportOpen(false); }}
                  className="w-full text-left px-3 py-2.5 text-sm text-foreground hover:bg-accent/50 rounded-[14px] flex items-center gap-2 transition-colors">
                  <FileText size={14} className="text-iq-cyan" /> Export as CSV
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mt-6">
        <select value={actionFilter} onChange={(e) => setActionFilter(e.target.value)}
          className="bg-card border border-border rounded-xl text-sm text-foreground px-3 py-1.5 outline-none">
          <option value="">All Actions</option>
          {actions.map((a) => <option key={a} value={a}>{a?.replace(/_/g, ' ')}</option>)}
        </select>
      </div>

      {/* Timeline */}
      <div className="mt-6 relative">
        <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: 'linear-gradient(to bottom, hsl(var(--iq-violet)), transparent)' }} />

        <div className="space-y-4">
          {filtered.map((log, i) => {
            const isLeft = i % 2 === 0;
            const expanded = expandedId === log.id;
            return (
              <motion.div key={log.id}
                initial={{ opacity: 0, x: isLeft ? -16 : 16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className={`flex items-start gap-4 ${isLeft ? 'pr-[52%]' : 'pl-[52%]'}`}>

                <div className="absolute left-1/2 -translate-x-1/2 mt-2">
                  <div className={`w-3 h-3 rounded-full ${ACTION_COLORS[log.action] || 'bg-primary'}`} />
                </div>

                <div className={`w-full surface-panel p-4 ${isLeft ? 'text-right' : ''}`}>
                  <div className={`flex items-center gap-2 ${isLeft ? 'flex-row-reverse' : ''}`}>
                    <span className="text-sm font-medium text-foreground capitalize">{log.action?.replace(/_/g, ' ')}</span>
                    <span className="text-xs text-muted-foreground">
                      {log.created_at ? formatDistanceToNow(new Date(log.created_at), { addSuffix: true }) : ''}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1 font-mono">
                    {log.entity_type}: {log.entity_id?.substring(0, 12)}...
                  </p>
                  <button onClick={() => setExpandedId(expanded ? null : log.id)}
                    className="text-xs text-primary mt-2 flex items-center gap-1 hover:underline">
                    <ChevronDown size={10} className={expanded ? 'rotate-180' : ''} />
                    {expanded ? 'Hide' : 'Details'}
                  </button>
                  {expanded && log.payload && (
                    <pre className="text-[10px] font-mono bg-muted/30 p-2 mt-2 overflow-auto max-h-32 text-left rounded-lg text-foreground">
                      {JSON.stringify(log.payload, null, 2)}
                    </pre>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {(!filtered || filtered.length === 0) && (
          <div className="py-16 text-center text-sm text-muted-foreground">
            No activity recorded yet. Start by uploading a document.
          </div>
        )}
      </div>
    </motion.div>
  );
}
