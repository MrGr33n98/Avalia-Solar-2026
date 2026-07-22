'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { IcpRadioCard } from './IcpRadioCard';
import type { UseFormReturn } from 'react-hook-form';
import type { IcpProfileFormData } from '@/schemas/icp-profile-schema';

interface IcpStrictnessCardProps {
  form: UseFormReturn<IcpProfileFormData>;
}

export function IcpStrictnessCard({ form }: IcpStrictnessCardProps) {
  const strictnessLevel = form.watch('strictness_level');

  const setLevel = (level: 'flexible' | 'balanced' | 'strict') => {
    form.setValue('strictness_level', level, { shouldDirty: true });
  };

  return (
    <Card className="bg-white border border-[#D8DEE8] rounded-md shadow-none p-4 md:p-5 space-y-4">
      <div className="space-y-1">
        <h3 className="text-xs font-black uppercase tracking-tight text-[#0B1F3A]">
          Nível de Rigor
        </h3>
        <p className="text-[10px] text-[#526071] font-medium leading-relaxed">
          Defina o quão estrito deve ser o filtro para considerar um lead como dentro ou fora do ICP.
        </p>
      </div>

      <CardContent className="p-0 space-y-2.5">
        <IcpRadioCard
          checked={strictnessLevel === 'flexible'}
          onClick={() => setLevel('flexible')}
          label="Flexível"
          description="Receba leads que atendam parcialmente aos critérios (threshold de 50%)."
        />

        <IcpRadioCard
          checked={strictnessLevel === 'balanced'}
          onClick={() => setLevel('balanced')}
          label="Moderado"
          description="Equilibra o volume e a qualidade de leads (threshold de 70%)."
          badge="Recomendado"
        />

        <IcpRadioCard
          checked={strictnessLevel === 'strict'}
          onClick={() => setLevel('strict')}
          label="Rígido"
          description="Prioriza apenas leads altamente aderentes ao ICP (threshold de 85%)."
        />
      </CardContent>
    </Card>
  );
}
