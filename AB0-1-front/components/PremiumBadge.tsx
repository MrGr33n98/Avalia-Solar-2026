'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PremiumBadgeProps {
  className?: string;
}

/**
 * PremiumBadge - Componente oficial de selo para empresas verificadas (Premium)
 * Implementa a estética "Big Tech" com gradiente e diamante sólido.
 */
export default function PremiumBadge({ className }: PremiumBadgeProps) {
  return (
    <motion.div
      initial={{ scale: 0.95 }}
      animate={{ scale: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full",
        "bg-gradient-to-r from-violet-600 via-purple-500 to-blue-600",
        "text-white shadow-[0_2px_10px_-3px_rgba(99,102,241,0.5)] border border-white/20",
        "select-none cursor-default",
        className
      )}
    >
      <svg 
        viewBox="0 0 16 16" 
        className="w-3 h-3 fill-current flex-shrink-0 drop-shadow-[0_0_2px_rgba(255,255,255,0.3)]"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M8 1L15 8L8 15L1 8Z" />
      </svg>
      <span className="text-[10px] font-black uppercase tracking-[0.1em] leading-none whitespace-nowrap">
        Premium
      </span>
    </motion.div>
  );
}
