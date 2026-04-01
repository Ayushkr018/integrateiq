import { useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Sun, Moon, Bell } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { useState, useEffect, useCallback } from 'react';
import { CommandPalette } from './CommandPalette';
import { NotificationDrawer } from './NotificationDrawer';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

const PAGE_NAMES: Record<string, string> = {
  '/': 'Dashboard',
  '/upload': 'Upload & Parse',
  '/adapters': 'Adapter Catalog',
  '/configure': 'Configure',
  '/simulate': 'Simulate',
  '/audit': 'Audit Log',
  '/history': 'History & Rollback',
  '/settings': 'Settings',
};

export function Header() {
  const location = useLocation();
  const { theme, toggleTheme, tenantName } = useAppStore();
  const [cmdOpen, setCmdOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const pageName = PAGE_NAMES[location.pathname] || 'Page';

  const { data: unreadCount } = useQuery({
    queryKey: ['unread-notif-count'],
    queryFn: async () => {
      const { count } = await supabase.from('audit_logs').select('*', { count: 'exact', head: true });
      return count ?? 0;
    },
    refetchInterval: 15000,
  });

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault();
      setCmdOpen(true);
    }
  }, []);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <>
      <header className="h-14 border-b border-border flex items-center justify-between px-5 bg-card/50 backdrop-blur-sm shrink-0">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm">
          <span className="surface-chip px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{tenantName}</span>
          <span className="text-muted-foreground/40">/</span>
          <motion.span key={pageName} initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
            className="font-medium text-foreground">{pageName}</motion.span>
        </div>

        {/* Search */}
        <button onClick={() => setCmdOpen(true)}
          className="surface-chip hidden items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground transition-all duration-200 hover:border-primary/30 hover:text-foreground md:flex">
          <Search size={14} />
          <span>Search...</span>
          <kbd className="text-[10px] bg-muted px-1.5 py-0.5 font-mono">⌘K</kbd>
        </button>

        {/* Right actions */}
        <div className="flex items-center gap-3">
          <motion.button whileTap={{ scale: 0.95 }} onClick={toggleTheme}
            className="surface-chip p-2 text-muted-foreground transition-colors hover:text-foreground">
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </motion.button>

          <motion.button whileTap={{ scale: 0.95 }} onClick={() => setNotifOpen(true)}
            className="surface-chip relative p-2 text-muted-foreground transition-colors hover:text-foreground">
            <Bell size={16} />
            {(unreadCount ?? 0) > 0 && (
              <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }}
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-iq-red text-[9px] text-primary-foreground font-bold px-1 shadow-lg shadow-destructive/20">
                {(unreadCount ?? 0) > 99 ? '99+' : unreadCount}
              </motion.span>
            )}
          </motion.button>

          <div className="w-px h-6 bg-border mx-1" />

          <motion.div whileHover={{ scale: 1.05 }}
            className="w-9 h-9 flex items-center justify-center rounded-[14px] text-xs font-bold text-primary-foreground cursor-pointer shadow-lg"
            style={{ background: 'linear-gradient(135deg, hsl(var(--iq-violet)), hsl(var(--iq-cyan)))' }}>
            AB
          </motion.div>
        </div>
      </header>

      <CommandPalette open={cmdOpen} onClose={() => setCmdOpen(false)} />
      <NotificationDrawer open={notifOpen} onClose={() => setNotifOpen(false)} />
    </>
  );
}
