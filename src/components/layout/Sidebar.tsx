import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, Upload, Box, Settings, Play,
  ScrollText, History, ChevronLeft, ChevronRight, Cog, X
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { Logo } from './Logo';

const NAV_GROUPS = [
  {
    label: 'CORE',
    items: [
      { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
      { to: '/upload', icon: Upload, label: 'Upload & Parse' },
      { to: '/adapters', icon: Box, label: 'Adapter Catalog' },
    ],
  },
  {
    label: 'WORKFLOW',
    items: [
      { to: '/configure', icon: Settings, label: 'Configure' },
      { to: '/simulate', icon: Play, label: 'Simulate' },
    ],
  },
  {
    label: 'GOVERNANCE',
    items: [
      { to: '/audit', icon: ScrollText, label: 'Audit Log' },
      { to: '/history', icon: History, label: 'History & Rollback' },
    ],
  },
  {
    label: 'SYSTEM',
    items: [
      { to: '/settings', icon: Cog, label: 'Settings' },
    ],
  },
];

export function Sidebar() {
  const { sidebarCollapsed, toggleSidebar, tenantName, sidebarMobileOpen, closeMobileSidebar } = useAppStore();
  const location = useLocation();

  const sidebarContent = (collapsed: boolean) => (
    <>
      <Logo collapsed={collapsed} />

      <nav className="flex-1 overflow-y-auto px-2 space-y-4 mt-2">
        {NAV_GROUPS.map((group) => (
          <div key={group.label}>
            <AnimatePresence>
              {!collapsed && (
                <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                  className="label-text text-muted-foreground px-2 mb-1 block">
                  {group.label}
                </motion.span>
              )}
            </AnimatePresence>
            <div className="space-y-0.5">
              {group.items.map((item, i) => {
                const isActive = location.pathname === item.to;
                return (
                  <motion.div key={item.to} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}>
                    <NavLink to={item.to}
                      onClick={closeMobileSidebar}
                      className={`flex items-center gap-3 rounded-[16px] px-3 py-2.5 text-sm relative transition-all duration-200
                        ${isActive ? 'bg-accent text-foreground shadow-lg shadow-primary/5' : 'text-sidebar-foreground hover:bg-accent/50 hover:text-foreground'}`}>
                      {isActive && (
                        <motion.div layoutId="sidebar-active"
                          className="absolute left-1 top-1 bottom-1 w-1 rounded-full bg-primary" />
                      )}
                      <item.icon size={16} className="shrink-0" />
                      <AnimatePresence>
                        {!collapsed && (
                          <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            className="truncate">{item.label}</motion.span>
                        )}
                      </AnimatePresence>
                    </NavLink>
                  </motion.div>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Tenant info */}
      <div className="border-t border-border px-3 py-3">
        <AnimatePresence>
          {!collapsed && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="surface-panel flex items-center gap-2 px-3 py-2.5">
                <span className="w-2 h-2 bg-iq-green animate-pulse-dot inline-block" />
                <span className="text-xs font-medium text-foreground truncate">{tenantName}</span>
              </div>
              <span className="text-[10px] text-iq-green ml-4">Connected</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <motion.aside
        animate={{ width: sidebarCollapsed ? 60 : 240 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="hidden md:flex h-screen flex-col border-r border-border bg-sidebar relative shrink-0 overflow-hidden"
        style={{
          borderImage: 'linear-gradient(to bottom, hsl(var(--iq-violet)), transparent) 1',
        }}
      >
        {sidebarContent(sidebarCollapsed)}

        {/* Collapse button */}
        <button onClick={toggleSidebar}
          className="border-t border-border p-2 flex items-center justify-center hover:bg-accent/50 transition-colors text-muted-foreground">
          {sidebarCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </motion.aside>

      {/* Mobile sidebar overlay */}
      <AnimatePresence>
        {sidebarMobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm md:hidden"
              onClick={closeMobileSidebar}
            />
            {/* Drawer */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className="fixed left-0 top-0 z-50 h-full w-[260px] flex flex-col border-r border-border bg-sidebar overflow-hidden md:hidden"
              style={{
                borderImage: 'linear-gradient(to bottom, hsl(var(--iq-violet)), transparent) 1',
              }}
            >
              {sidebarContent(false)}

              {/* Close button */}
              <button onClick={closeMobileSidebar}
                className="border-t border-border p-2 flex items-center justify-center hover:bg-accent/50 transition-colors text-muted-foreground">
                <X size={16} />
              </button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
