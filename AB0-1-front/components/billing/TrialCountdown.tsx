'use client';

import { Clock, ShieldAlert } from 'lucide-react';

interface TrialCountdownProps {
  trialEnd: string | null;
}

export function TrialCountdown({ trialEnd }: TrialCountdownProps) {
  if (!trialEnd) return null;

  // Calcula dias restantes
  const calculateDaysLeft = () => {
    const end = new Date(trialEnd).getTime();
    const now = Date.now();
    const diffTime = end - now;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const daysLeft = calculateDaysLeft();

  // Estilos baseados no número de dias restantes
  const isUrgent = daysLeft <= 3;
  
  const textCls = isUrgent
    ? 'text-red-700 bg-red-50 border-red-200/50'
    : 'text-brand-blue bg-brand-blue/5 border-brand-blue/10';

  const Icon = isUrgent ? ShieldAlert : Clock;

  return (
    <div className={`flex items-center gap-2.5 px-4 py-2.5 rounded-full border text-xs font-semibold ${textCls} shadow-sm max-w-fit transition-all`}>
      <Icon className={`h-4 w-4 shrink-0 ${isUrgent ? 'animate-bounce' : ''}`} />
      <span>
        {daysLeft === 0 ? (
          'Seu período de teste termina hoje!'
        ) : daysLeft === 1 ? (
          'Resta apenas 1 dia de teste!'
        ) : (
          `Restam ${daysLeft} dias de teste no plano Pro.`
        )}
      </span>
    </div>
  );
}
