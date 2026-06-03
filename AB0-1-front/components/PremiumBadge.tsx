'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

/**
 * PremiumBadge - Componente oficial de selo para empresas verificadas (Premium)
 * Implementa a estética "Big Tech" com gradiente e diamante sólido.
 */
export function PremiumBadge({ className, size = 'sm' }: PremiumBadgeProps) {
  const sizeClasses = {
    xs: 'gap-1 px-1.5 py-0.5 text-[9px]',
    sm: 'gap-1.5 px-2.5 py-1 text-[10px]',
    md: 'gap-2 px-3 py-1.5 text-xs',
  };
  const iconClasses = {
    xs: 'w-2.5 h-2.5',
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
  };

  return (
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "inline-flex items-center rounded-full",
        sizeClasses[size],
        "bg-gradient-to-r from-violet-600 via-purple-500 to-blue-600",
        "text-white shadow-[0_2px_10px_-3px_rgba(99,102,241,0.5)] border border-white/20",
        "select-none cursor-default",
        className
      )}
    >
      <svg 
        viewBox="0 0 24 24" 
        className={cn(
          iconClasses[size],
          "fill-current flex-shrink-0 drop-shadow-[0_0_2px_rgba(255,255,255,0.3)]"
        )}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M6 2L2 8l10 14L22 8l-4-6H6zM8.5 4h7l2 3h-11l2-3z" />
      </svg>
      <span className="font-black uppercase tracking-[0.1em] leading-none whitespace-nowrap">
        Premium
      </span>
    </motion.div>
  );
}

export default PremiumBadge;
