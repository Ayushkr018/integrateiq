import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, CheckCircle, AlertTriangle, Zap, Activity, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { formatDistanceToNow } from 'date-fns';
import { useAppStore } from '@/stores/appStore';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'error';
  title: string;
  message: string;
  time: Date;
  read: boolean;
}

const ICON_MAP = {
  success: CheckCircle,
  warning: AlertTriangle,
  info: Zap,
  error: AlertTriangle,
};

const COLOR_MAP = {
  success: 'text-iq-green',
  warning: 'text-iq-amber',
  info: 'text-iq-cyan',
  error: 'text-iq-red',
};

const BG_MAP = {
  success: 'bg-iq-green/5 border-iq-green/20',
  warning: 'bg-iq-amber/5 border-iq-amber/20',
  info: 'bg-iq-cyan/5 border-iq-cyan/20',
  error: 'bg-iq-red/5 border-iq-red/20',
};

function mapAuditToNotification(log: any): Notification {
  const typeMap: Record<string, 'success' | 'warning' | 'info' | 'error'> = {
    document_parsed: 'success',
    adapters_matched: 'info',
    config_generated: 'info',
    simulation_run: 'success',
    config_rolled_back: 'warning',
    config_activated: 'success',
  };
  const titleMap: Record<string, string> = {
    document_parsed: 'Document Parsed',
    adapters_matched: 'Adapters Matched',
    config_generated: 'Configuration Generated',
    simulation_run: 'Simulation Completed',
    config_rolled_back: 'Config Rolled Back',
    config_activated: 'Integration Activated',
  };
  return {
    id: log.id,
    type: typeMap[log.action] || 'info',
    title: titleMap[log.action] || log.action?.replace(/_/g, ' '),
    message: `${log.entity_type || 'Entity'}: ${log.entity_id?.substring(0, 12) || 'N/A'}`,
    time: new Date(log.created_at),
    read: false,
  };
}

export function NotificationDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const notificationPrefs = useAppStore((state) => state.notificationPrefs);

  const allowsNotification = (action?: string) => {
    if (!action) return notificationPrefs.auditEvents;
    if (action === 'simulation_run') return notificationPrefs.simComplete;
    if (action === 'config_generated' || action === 'config_rolled_back' || action === 'config_activated') return notificationPrefs.configChange;
    if (action.includes('security')) return notificationPrefs.securityAlert;
    return notificationPrefs.auditEvents || notificationPrefs.weeklyDigest;
  };

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('audit_logs').select('*').order('created_at', { ascending: false }).limit(30);
      if (data) setNotifications(data.filter((log) => allowsNotification(log.action)).map(mapAuditToNotification));
    };
    if (open) load();
  }, [open, notificationPrefs.auditEvents, notificationPrefs.configChange, notificationPrefs.securityAlert, notificationPrefs.simComplete, notificationPrefs.weeklyDigest]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase.channel('notif-realtime').on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'audit_logs' },
      (payload) => {
        if (!allowsNotification(payload.new.action)) return;
        const n = mapAuditToNotification(payload.new);
        setNotifications((prev) => [n, ...prev]);
      }
    ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const markAllRead = () => setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered = filter === 'unread' ? notifications.filter((n) => !n.read) : notifications;

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-background/60 backdrop-blur-sm z-40" onClick={onClose} />
          <motion.div
            initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-[400px] max-w-[92vw] bg-card border-l border-border z-50 flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="h-14 border-b border-border flex items-center justify-between px-4 shrink-0">
              <div className="flex items-center gap-2">
                <Bell size={16} className="text-primary" />
                <span className="text-sm font-bold text-foreground">Notifications</span>
                {unreadCount > 0 && (
                  <span className="text-[10px] px-1.5 py-0.5 bg-primary text-primary-foreground font-bold">{unreadCount}</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={markAllRead} className="text-[10px] text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider font-medium">
                  Mark all read
                </button>
                <button onClick={onClose} className="p-1.5 hover:bg-accent transition-colors text-muted-foreground">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Filter tabs */}
            <div className="flex border-b border-border">
              {(['all', 'unread'] as const).map((f) => (
                <button key={f} onClick={() => setFilter(f)}
                  className={`flex-1 py-2.5 text-xs font-medium uppercase tracking-wider transition-colors
                    ${filter === f ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'}`}>
                  {f} {f === 'unread' && unreadCount > 0 ? `(${unreadCount})` : ''}
                </button>
              ))}
            </div>

            {/* Notification list */}
            <div className="flex-1 overflow-y-auto">
              {filtered.length === 0 && (
                <div className="flex flex-col items-center justify-center h-40 text-muted-foreground">
                  <Bell size={24} className="mb-2 opacity-30" />
                  <span className="text-xs">No notifications</span>
                </div>
              )}
              {filtered.map((n, i) => {
                const Icon = ICON_MAP[n.type];
                return (
                   <motion.div
                    key={n.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.03 }}
                    onClick={() => setNotifications((prev) => prev.map((x) => x.id === n.id ? { ...x, read: true } : x))}
                     className={`mx-3 my-2 rounded-[18px] border border-border/60 px-4 py-3 cursor-pointer transition-colors hover:bg-accent/30
                      ${!n.read ? 'bg-accent/10' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-1.5 border ${BG_MAP[n.type]} shrink-0 mt-0.5`}>
                        <Icon size={12} className={COLOR_MAP[n.type]} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium text-foreground">{n.title}</span>
                          {!n.read && <span className="w-1.5 h-1.5 bg-primary shrink-0" />}
                        </div>
                        <span className="text-xs text-muted-foreground block mt-0.5 truncate">{n.message}</span>
                        <div className="flex items-center gap-1 mt-1.5 text-[10px] text-muted-foreground">
                          <Clock size={9} />
                          {formatDistanceToNow(n.time, { addSuffix: true })}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Footer */}
            <div className="border-t border-border px-4 py-3 flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <Activity size={12} className="text-iq-green" />
                <span className="text-[10px] text-iq-green font-medium">Real-time Connected</span>
              </div>
              <span className="text-[10px] text-muted-foreground">{notifications.length} events</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
