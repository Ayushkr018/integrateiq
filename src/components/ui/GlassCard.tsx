import { motion, HTMLMotionProps } from 'framer-motion';
import { ReactNode } from 'react';

interface GlassCardProps extends HTMLMotionProps<"div"> {
  children: ReactNode;
  accent?: 'violet' | 'cyan' | 'green' | 'amber' | 'red';
  hover?: boolean;
  className?: string;
}

const ACCENT_GRADIENT = {
  violet: 'hsl(var(--iq-violet))',
  cyan: 'hsl(var(--iq-cyan))',
  green: 'hsl(var(--iq-green))',
  amber: 'hsl(var(--iq-amber))',
  red: 'hsl(var(--iq-red))',
};

export function GlassCard({ children, accent, hover = true, className = '', ...props }: GlassCardProps) {
  return (
    <motion.div
      whileHover={hover ? { y: -3, transition: { duration: 0.2 } } : undefined}
      className={`glass-panel clip-angular relative overflow-hidden ${className}`}
      {...props}
    >
      {accent && (
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{ background: ACCENT_GRADIENT[accent] }}
        />
      )}
      {/* Corner accent */}
      {accent && (
        <div
          className="absolute top-0 left-0 w-0 h-0"
          style={{
            borderLeft: `4px solid ${ACCENT_GRADIENT[accent]}`,
            borderBottom: '4px solid transparent',
          }}
        />
      )}
      {children}
    </motion.div>
  );
}
