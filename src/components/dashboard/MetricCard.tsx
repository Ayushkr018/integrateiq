import { motion } from 'framer-motion';
import { TrendingDown, TrendingUp, type LucideIcon } from 'lucide-react';
import { AnimatedCounter } from '@/components/ui/AnimatedCounter';

interface MetricCardProps {
  label: string;
  value: number;
  icon: LucideIcon;
  trend: string;
  up?: boolean;
  suffix?: string;
}

export function MetricCard({ label, value, icon: Icon, trend, up = true, suffix }: MetricCardProps) {
  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.2 }}
      className="surface-panel interactive-lift p-5"
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <span className="label-text text-muted-foreground">{label}</span>
          <div className="mt-3 flex items-end gap-3">
            <span className="text-3xl font-black tracking-[-0.04em] text-foreground">
              <AnimatedCounter value={value} suffix={suffix} />
            </span>
            <span className={`mb-1 inline-flex items-center gap-1 text-xs font-semibold ${up ? 'text-iq-green' : 'text-iq-red'}`}>
              {up ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trend}
            </span>
          </div>
        </div>
        <div className="surface-chip p-2.5 text-primary">
          <Icon size={16} />
        </div>
      </div>
    </motion.div>
  );
}