import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/stores/appStore';

export function AppLayout() {
  const location = useLocation();
  const density = useAppStore((state) => state.density);

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <AnimatePresence mode="wait">
          <motion.main
            key={location.pathname}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`flex-1 overflow-y-auto relative ${density === 'compact' ? 'p-4 lg:p-5' : 'p-5 lg:p-7'}`}
            data-density={density}
          >
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
              <div className="absolute -top-24 right-[-4rem] h-64 w-64 rounded-full bg-primary/10 blur-3xl" />
              <div className="absolute bottom-0 left-[-3rem] h-56 w-56 rounded-full bg-secondary/10 blur-3xl" />
            </div>
            <div className="relative z-10">
              <Outlet />
            </div>
          </motion.main>
        </AnimatePresence>
      </div>
    </div>
  );
}
