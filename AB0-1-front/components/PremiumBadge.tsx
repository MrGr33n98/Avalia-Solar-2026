'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md';
}

/**
 * PremiumBadge - Componente oficial de selo para empresas verificadas (Premium)
 * Estética Clean Enterprise / Swiss Design: borda fina, fundo azul bem suave e texto azul de marca.
 */
export function PremiumBadge({ className, size = 'sm' }: PremiumBadgeProps) {
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
        "inline-flex items-center font-bold tracking-wider uppercase border border-[#CBD5E1] bg-white text-slate-800 dark:border-slate-700 dark:bg-slate-850 dark:text-slate-200 shadow-none",
        sizeClasses[size],
        "select-none cursor-default",
        className
      )}
    >
      <svg 
        viewBox="0 0 24 24" 
        className={cn(
          iconClasses[size],
          "fill-[#2563EB] flex-shrink-0"
        )}
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M6 2L2 8l10 14L22 8l-4-6H6zM8.5 4h7l2 3h-11l2-3z" />
      </svg>
      <span className="font-extrabold tracking-[0.08em] leading-none whitespace-nowrap text-slate-700 dark:text-slate-300">
        Premium
      </span>
    </motion.div>
  );
}

export default PremiumBadge;

