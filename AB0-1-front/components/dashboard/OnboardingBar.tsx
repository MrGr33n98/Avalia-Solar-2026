'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, ChevronRight, Sparkles, X } from 'lucide-react';

interface OnboardingBarProps {
  profileCompletion?: number;
  reviewsCount?: number;
}

export function OnboardingBar({
  profileCompletion = 0,
  reviewsCount = 0,
}: OnboardingBarProps) {
  const { user } = useAuth();
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const isDismissed = localStorage.getItem('as-onboarding-dismissed') === 'true';
      setDismissed(isDismissed);
    }
  }, []);

  if (!user || dismissed) return null;

  const firstName = user.name.split(' ')[0];

  // Passos de Onboarding
  const steps = [
    {
      label: 'Dados do perfil',
      done: profileCompletion >= 100,
      href: '/review-dashboard/profile',
    },
    {
      label: 'Primeira avaliação',
      done: reviewsCount > 0,
      href: '/companies',
    },
    {
      label: 'Verificar conta',
      done: false,
      href: '/review-dashboard/profile',
    },
  ];

  const currentStepIndex = steps.findIndex((step) => !step.done);
  const nextAction = currentStepIndex !== -1 ? steps[currentStepIndex] : null;

  const handleDismiss = () => {
    localStorage.setItem('as-onboarding-dismissed', 'true');
    setDismissed(true);
  };

  return (
    <div className="relative overflow-hidden rounded-xl border border-blue-100 bg-gradient-to-r from-blue-50/50 to-indigo-50/20 px-4 py-3 text-slate-900 shadow-none transition-all">
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100/80 text-blue-600">
            <Sparkles className="h-4.5 w-4.5" />
          </div>
          <div className="min-w-0">
            <h2 className="text-sm font-semibold text-slate-900 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span>Bem-vindo, {firstName}!</span>
              <span className="text-xs font-normal text-slate-500">
                Complete seu onboarding para subir no ranking regional
              </span>
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              Passos concluídos: {steps.filter((s) => s.done).length} de {steps.length}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {nextAction && (
            <Link
              href={nextAction.href}
              className="inline-flex h-8 items-center justify-center gap-1 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white transition-colors hover:bg-blue-700"
            >
              <span>Próximo: {nextAction.label}</span>
              <ChevronRight className="h-3 w-3" />
            </Link>
          )}

          <button
            type="button"
            onClick={handleDismiss}
            aria-label="Dispensar aviso"
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
