'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md';
  label?: string;
}

/**
 * PremiumBadge - Componente oficial de selo de plano comercial (PRO)
 * Estética Clean Enterprise / Swiss Design.
 */
export function PremiumBadge({ className, size = 'sm', label = 'PRO' }: PremiumBadgeProps) {
  const sizeClasses = {
    xs: 'gap-1 px-2 py-0.5 text-[9px] rounded-md',
    sm: 'gap-1.5 px-2.5 py-1 text-[10px] rounded-lg',
    md: 'gap-2 px-3 py-1.5 text-xs rounded-xl',
  };
  const iconClasses = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  return (
    <motion.div
      initial={{ scale: 0.98 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.2, ease: "easeOut" }}
      className={cn(
        "inline-flex items-center font-bold tracking-wider uppercase border border-violet-200 bg-violet-50 text-violet-700 dark:border-violet-900/50 dark:bg-violet-950/40 dark:text-violet-300 shadow-none",
        sizeClasses[size],
        "select-none cursor-default",
        className
      )}
      aria-label={`Plano Comercial ${label}`}
      title={`Plano Comercial ${label}`}
    >
      <svg 
        viewBox="0 0 24 24" 
        className={cn(
          iconClasses[size],
          "fill-violet-600 flex-shrink-0"
        )}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M6 2L2 8l10 14L22 8l-4-6H6zM8.5 4h7l2 3h-11l2-3z" />
      </svg>
      <span className="font-extrabold tracking-[0.08em] leading-none whitespace-nowrap text-violet-700 dark:text-violet-300">
        {label}
      </span>
    </motion.div>
  );
}

export default PremiumBadge;

