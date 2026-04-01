import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase, TENANT_ID, callEdgeFunction } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { RotateCcw, AlertTriangle, ChevronRight } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function HistoryRollback() {
  const [selectedConfigId, setSelectedConfigId] = useState<string | null>(null);
  const [rollbackTarget, setRollbackTarget] = useState<any>(null);
  const [rollbackLoading, setRollbackLoading] = useState(false);
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: configs } = useQuery({
    queryKey: ['configs-history'],
    queryFn: async () => {
      const { data } = await supabase.from('integration_configs')
        .select('*, adapter_versions(version, adapters(name, provider))')
        .eq('tenant_id', TENANT_ID)
        .order('updated_at', { ascending: false });
      return data ?? [];
    },
  });

  const { data: history } = useQuery({
    queryKey: ['config-history', selectedConfigId],
    queryFn: async () => {
      if (!selectedConfigId) return [];
      const { data } = await supabase.from('config_history')
        .select('*')
        .eq('config_id', selectedConfigId)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
    enabled: !!selectedConfigId,
  });

  const doRollback = async () => {
    if (!rollbackTarget || !selectedConfigId) return;
    setRollbackLoading(true);
    try {
      await callEdgeFunction('rollback-config', {
        config_id: selectedConfigId,
        history_id: rollbackTarget.id,
        tenant_id: TENANT_ID,
        reason: 'Manual rollback via UI',
      });
      toast({ title: 'Rollback successful', description: 'Configuration has been restored.' });
      setRollbackTarget(null);
      qc.invalidateQueries({ queryKey: ['config-history'] });
      qc.invalidateQueries({ queryKey: ['configs-history'] });
    } catch (e: any) {
      toast({ title: 'Rollback failed', description: e.message, variant: 'destructive' });
    } finally {
      setRollbackLoading(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}>
      <h1 className="text-[28px] font-bold tracking-[-0.04em] text-foreground">History & Rollback</h1>
      <p className="text-sm text-muted-foreground mt-1">View configuration versions and rollback changes</p>

      <div className="mt-6 grid gap-6" style={{ gridTemplateColumns: '40fr 60fr' }}>
        {/* Config list */}
        <div className="space-y-2">
          <span className="label-text text-muted-foreground">Configurations</span>
          {configs?.map((c) => (
            <motion.button key={c.id} whileHover={{ x: 4 }}
              onClick={() => setSelectedConfigId(c.id)}
              className={`w-full border p-3 text-left transition-colors flex items-center gap-3
                ${selectedConfigId === c.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-primary/30'}`}>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-foreground block truncate">
                  {(c as any).adapter_versions?.adapters?.name || 'Configuration'}
                </span>
                <span className="text-xs text-muted-foreground">{(c as any).adapter_versions?.version}</span>
              </div>
              <span className={`text-[10px] font-medium px-1.5 py-0.5 ${
                c.status === 'active' ? 'bg-iq-green/10 text-iq-green' :
                c.status === 'draft' ? 'bg-iq-amber/10 text-iq-amber' : 'bg-muted text-muted-foreground'
              }`}>{c.status?.toUpperCase()}</span>
              <ChevronRight size={14} className="text-muted-foreground shrink-0" />
            </motion.button>
          ))}
          {(!configs || configs.length === 0) && (
            <div className="text-center py-8 text-sm text-muted-foreground">No configurations found.</div>
          )}
        </div>

        {/* History timeline */}
        <div>
          {selectedConfigId ? (
            <div className="space-y-3">
              <span className="label-text text-muted-foreground">Version History</span>
              <div className="relative">
                <div className="absolute left-[11px] top-4 bottom-4 w-px bg-border" />
                {history?.map((h, i) => (
                  <motion.div key={h.id}
                    initial={{ opacity: 0, x: 8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-start gap-4 py-3 relative"
                  >
                    <div className="w-[6px] h-[6px] bg-primary mt-2 ml-[8px] z-10" />
                    <div className="flex-1 border border-border bg-card p-3">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted-foreground">
                          {h.created_at ? formatDistanceToNow(new Date(h.created_at), { addSuffix: true }) : ''}
                        </span>
                        <span className="text-[10px] text-muted-foreground">{h.changed_by || 'system'}</span>
                      </div>
                      {h.change_note && <p className="text-xs text-foreground mt-1">{h.change_note}</p>}
                      <div className="flex items-center gap-2 mt-2">
                        <button onClick={() => setRollbackTarget(h)}
                          className="text-xs text-iq-red flex items-center gap-1 hover:underline">
                          <RotateCcw size={10} /> Rollback
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))}
                {(!history || history.length === 0) && (
                  <div className="text-center py-8 text-sm text-muted-foreground">No history entries for this config.</div>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-16 text-sm text-muted-foreground">Select a configuration to view its history.</div>
          )}
        </div>
      </div>

      {/* Rollback confirmation modal */}
      <AnimatePresence>
        {rollbackTarget && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center"
            onClick={() => setRollbackTarget(null)}>
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }} exit={{ scale: 0.95 }}
              className="w-full max-w-md border border-border bg-card p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={18} className="text-iq-amber" />
                <h3 className="text-sm font-bold text-foreground">Confirm Rollback</h3>
              </div>
              <p className="text-xs text-muted-foreground mb-4">
                This action will replace your current configuration with the selected version.
                This cannot be undone automatically.
              </p>
              {rollbackTarget.config_snapshot && (
                <pre className="text-[10px] font-mono bg-muted/30 p-3 overflow-auto max-h-32 mb-4 text-foreground">
                  {JSON.stringify(rollbackTarget.config_snapshot, null, 2)}
                </pre>
              )}
              <div className="flex gap-2 justify-end">
                <button onClick={() => setRollbackTarget(null)}
                  className="px-4 py-2 border border-border text-sm text-muted-foreground hover:text-foreground">Cancel</button>
                <motion.button whileTap={{ scale: 0.97 }} onClick={doRollback} disabled={rollbackLoading}
                  className="px-4 py-2 bg-iq-red text-white text-sm font-medium disabled:opacity-50">
                  {rollbackLoading ? 'Rolling back...' : 'Confirm Rollback'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
