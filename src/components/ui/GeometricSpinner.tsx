import { motion } from 'framer-motion';

export function GeometricSpinner({ size = 32 }: { size?: number }) {
  const s = size / 2;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 border-2 border-primary"
        style={{ width: s, height: s, top: size / 4, left: size / 4 }}
      />
      <motion.div
        animate={{ rotate: -360 }}
        transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
        className="absolute inset-0 border-2 border-secondary"
        style={{ width: s * 0.7, height: s * 0.7, top: size * 0.325, left: size * 0.325 }}
      />
    </div>
  );
}
