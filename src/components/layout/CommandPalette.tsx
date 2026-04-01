import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import {
  LayoutDashboard, Upload, Box, Settings, Play, ScrollText, History
} from 'lucide-react';

const PAGES = [
  { label: 'Dashboard', to: '/', icon: LayoutDashboard },
  { label: 'Upload & Parse', to: '/upload', icon: Upload },
  { label: 'Adapter Catalog', to: '/adapters', icon: Box },
  { label: 'Configure', to: '/configure', icon: Settings },
  { label: 'Simulate', to: '/simulate', icon: Play },
  { label: 'Audit Log', to: '/audit', icon: ScrollText },
  { label: 'History & Rollback', to: '/history', icon: History },
];

export function CommandPalette({ open, onClose }: { open: boolean; onClose: () => void }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  const filtered = PAGES.filter((p) =>
    p.label.toLowerCase().includes(query.toLowerCase())
  );

  const go = (to: string) => {
    navigate(to);
    setQuery('');
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-start justify-center pt-[20vh]"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            className="w-full max-w-lg border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <input
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search pages, actions..."
              className="w-full px-4 py-3 bg-transparent text-lg outline-none border-b border-border text-foreground placeholder:text-muted-foreground"
              onKeyDown={(e) => {
                if (e.key === 'Escape') onClose();
                if (e.key === 'Enter' && filtered.length > 0) go(filtered[0].to);
              }}
            />
            <div className="py-2 max-h-64 overflow-y-auto">
              <div className="px-3 py-1">
                <span className="label-text text-muted-foreground">Pages</span>
              </div>
              {filtered.map((page) => (
                <button
                  key={page.to}
                  onClick={() => go(page.to)}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm hover:bg-accent transition-colors text-foreground"
                >
                  <page.icon size={16} className="text-muted-foreground" />
                  {page.label}
                </button>
              ))}
              {filtered.length === 0 && (
                <div className="px-4 py-6 text-center text-sm text-muted-foreground">No results</div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
