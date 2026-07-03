'use client';

import React from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';

interface OnboardingBarProps {
  profileCompletion?: number;
  reviewsCount?: number;
}

export function OnboardingBar({
  profileCompletion = 75,
  reviewsCount = 0,
}: OnboardingBarProps) {
  const { user } = useAuth();

  if (!user) return null;

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
      done: false, // mock
      href: '#',
    },
  ];

  const currentStepIndex = steps.findIndex((step) => !step.done);
  const nextAction = currentStepIndex !== -1 ? steps[currentStepIndex] : null;

  return (
    <div className="relative overflow-hidden rounded-none border border-slate-200 bg-white p-5 text-slate-950 shadow-none">

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-blue-600" />
            <h2 className="text-lg font-semibold text-slate-950">
              Bem-vindo, {firstName}! Vamos completar o seu onboarding?
            </h2>
          </div>
          <p className="mt-1 text-sm text-slate-650 max-w-2xl">
            Complete os passos abaixo para aumentar sua visibilidade, validar suas contribuições de energia solar e subir no ranking regional!
          </p>

          {/* Passos de Onboarding */}
          <div className="mt-4 flex flex-wrap gap-3">
            {steps.map((step, idx) => (
              <div
                key={step.label}
                className={`flex items-center gap-1.5 rounded-sm border px-3 py-1.5 text-xs ${
                  step.done
                    ? 'border-emerald-200 bg-emerald-50/40 text-slate-700 line-through'
                    : 'border-slate-200 bg-slate-50 text-slate-700 font-medium'
                }`}
              >
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-sm bg-blue-600 text-[10px] font-semibold text-white">
                    {idx + 1}
                  </span>
                )}
                <span>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {nextAction && (
          <Link
            href={nextAction.href}
            className="flex items-center justify-center gap-1.5 self-start rounded-none bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-blue-700 md:self-center"
          >
            Próximo passo: {nextAction.label}
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
