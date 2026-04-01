import { motion, AnimatePresence } from 'framer-motion';

export function Logo({ collapsed }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-3 px-4 py-5">
      <motion.svg
        width="28"
        height="28"
        viewBox="0 0 28 28"
        fill="none"
        whileHover={{ rotate: 45 }}
        transition={{ duration: 0.4 }}
        className="shrink-0"
      >
        <motion.path
          d="M14 2L26 14L14 26L2 14L14 2Z"
          fill="hsl(var(--iq-violet))"
          opacity="0.7"
          animate={{ opacity: [0.5, 0.8, 0.5] }}
          transition={{ duration: 3, repeat: Infinity }}
        />
        <motion.path
          d="M14 6L22 14L14 22L6 14L14 6Z"
          fill="hsl(var(--iq-cyan))"
          opacity="0.8"
          animate={{ opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 3, repeat: Infinity, delay: 0.5 }}
        />
      </motion.svg>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            className="flex flex-col"
          >
            <span className="text-sm font-bold tracking-tight text-foreground">IntegrateIQ</span>
            <span className="text-[10px] font-medium uppercase tracking-[0.1em] text-gradient">
              Enterprise Edition
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
