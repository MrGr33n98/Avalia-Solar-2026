'use client';

import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TrustScoreDialProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showLabel?: boolean;
}

export default function TrustScoreDial({
  score,
  size = 'md',
  className,
  showLabel = true
}: TrustScoreDialProps) {
  const normalizedScore = Math.min(Math.max(score, 0), 100);
  
  // Size-base config
  const sizes = {
    sm: { diameter: 60, strokeWidth: 4, fontSize: 'text-xs' },
    md: { diameter: 80, strokeWidth: 6, fontSize: 'text-sm' },
    lg: { diameter: 120, strokeWidth: 8, fontSize: 'text-2xl' }
  };
  
  const { diameter, strokeWidth, fontSize } = sizes[size];
  const radius = (diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (normalizedScore / 100) * circumference;

  // Gauge colors based on score
  const getScoreColor = (s: number) => {
    if (s >= 90) return 'text-emerald-500';
    if (s >= 70) return 'text-blue-500';
    if (s >= 50) return 'text-amber-500';
    return 'text-red-500';
  };

  const getScoreBg = (s: number) => {
    if (s >= 90) return 'bg-emerald-50';
    if (s >= 70) return 'bg-blue-50';
    if (s >= 50) return 'bg-amber-50';
    return 'bg-red-50';
  };

  return (
    <div className={cn("relative flex flex-col items-center justify-center", className)}>
      <div 
        className={cn(
          "relative rounded-full flex items-center justify-center p-3 shadow-inner bg-white border border-slate-100",
          "clay-surface clay-convex transition-all",
          size === 'lg' ? 'h-32 w-32' : size === 'md' ? 'h-24 w-24' : 'h-16 w-16'
        )}
      >
        <svg
          width={diameter}
          height={diameter}
          className="transform -rotate-90 select-none pointer-events-none"
        >
          {/* Background circle */}
          <circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            className="text-slate-100"
          />
          {/* Progress circle */}
          <motion.circle
            cx={diameter / 2}
            cy={diameter / 2}
            r={radius}
            fill="transparent"
            stroke="currentColor"
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset: offset }}
            transition={{ duration: 1.5, ease: "easeOut", delay: 0.2 }}
            className={cn(getScoreColor(normalizedScore), "drop-shadow-[0_0_8px_rgba(0,0,0,0.1)]")}
            strokeLinecap="round"
          />
        </svg>

        {/* Center label */}
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.span 
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 }}
            className={cn("font-black tracking-tighter text-slate-900", fontSize)}
          >
            {normalizedScore}
          </motion.span>
          {size === 'lg' && (
            <span className="text-[10px] uppercase font-black text-slate-400 tracking-widest -mt-1">Trust</span>
          )}
        </div>
      </div>
      
      {showLabel && size !== 'sm' && (
        <div className={cn(
          "mt-2 px-3 py-0.5 rounded-full text-[10px] font-black uppercase tracking-widest border",
          getScoreColor(normalizedScore),
          getScoreBg(normalizedScore),
          "border-current/10"
        )}>
          {normalizedScore >= 90 ? 'Excelente' : normalizedScore >= 70 ? 'Bom' : 'Razoável'}
        </div>
      )}
    </div>
  );
}
