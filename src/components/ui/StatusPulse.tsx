import { motion } from 'framer-motion';

interface StatusPulseProps {
  status: 'online' | 'warning' | 'error' | 'idle';
  size?: number;
  label?: string;
}

const STATUS_COLORS = {
  online: 'bg-iq-green',
  warning: 'bg-iq-amber',
  error: 'bg-iq-red',
  idle: 'bg-muted-foreground',
};

export function StatusPulse({ status, size = 8, label }: StatusPulseProps) {
  return (
    <div className="flex items-center gap-2">
      <div className="relative" style={{ width: size, height: size }}>
        <div className={`absolute inset-0 ${STATUS_COLORS[status]}`} />
        {status === 'online' && (
          <div className={`absolute inset-0 ${STATUS_COLORS[status]} pulse-ring`} />
        )}
      </div>
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
    </div>
  );
}
