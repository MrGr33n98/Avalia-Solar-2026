'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { ChevronRight, Sparkles, X } from 'lucide-react';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';

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
    <Alert className="relative overflow-hidden border-blue-100 bg-blue-50/30 p-4 shadow-none rounded-xl pr-12">
      <div className="flex items-start gap-3">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-100/80 text-blue-600">
          <Sparkles className="h-4.5 w-4.5" />
        </div>
        <div className="flex-1 min-w-0">
          <AlertTitle className="text-sm font-semibold text-slate-900 flex flex-wrap items-center gap-x-2 gap-y-0.5 leading-tight">
            <span>Bem-vindo, {firstName}!</span>
            <span className="text-xs font-normal text-slate-500">
              Complete seu onboarding para subir no ranking regional
            </span>
          </AlertTitle>
          <AlertDescription className="text-[11px] text-slate-500 mt-1">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <span>
                Passos concluídos: {steps.filter((s) => s.done).length} de {steps.length}
              </span>
              {nextAction && (
                <Button
                  asChild
                  className="h-8 shrink-0 items-center gap-1 rounded-lg bg-blue-600 px-3.5 text-xs font-semibold text-white hover:bg-blue-750 transition-colors shadow-none self-start sm:self-auto"
                >
                  <Link href={nextAction.href}>
                    <span>Próximo: {nextAction.label}</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
            </div>
          </AlertDescription>
        </div>
      </div>
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dispensar aviso"
        className="absolute top-3 right-3 rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </Alert>
  );
}
