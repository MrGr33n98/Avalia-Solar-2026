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
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-850 via-emerald-800 to-teal-850 p-6 text-white shadow-md">
      {/* Detalhes de Background Decorativos */}
      <div className="absolute right-0 top-0 h-32 w-32 rounded-full bg-emerald-500/10 blur-2xl" />
      <div className="absolute bottom-0 left-1/3 h-24 w-24 rounded-full bg-teal-500/10 blur-xl" />

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between relative z-10">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-emerald-300 animate-pulse" />
            <h2 className="text-lg font-bold">
              Bem-vindo, {firstName}! Vamos completar o seu onboarding?
            </h2>
          </div>
          <p className="mt-1 text-sm text-emerald-100/90 max-w-2xl">
            Complete os passos abaixo para aumentar sua visibilidade, validar suas contribuições de energia solar e subir no ranking regional!
          </p>

          {/* Passos de Onboarding */}
          <div className="mt-4 flex flex-wrap gap-3">
            {steps.map((step, idx) => (
              <div
                key={step.label}
                className="flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1 text-xs backdrop-blur-md"
              >
                {step.done ? (
                  <CheckCircle2 className="h-4 w-4 text-emerald-300 fill-emerald-950/20" />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-white/20 text-[10px] font-bold">
                    {idx + 1}
                  </span>
                )}
                <span className={step.done ? 'text-emerald-200 line-through' : 'font-medium'}>
                  {step.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {nextAction && (
          <Link
            href={nextAction.href}
            className="flex items-center justify-center gap-1.5 self-start rounded-xl bg-white px-5 py-3 text-sm font-bold text-emerald-850 hover:bg-emerald-50 transition-colors shadow md:self-center"
          >
            Próximo passo: {nextAction.label}
            <ChevronRight className="h-4 w-4" />
          </Link>
        )}
      </div>
    </div>
  );
}
