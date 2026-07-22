'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { IcpSectionHeader } from './IcpSectionHeader';
import { IcpSliderField } from './IcpSliderField';
import type { UseFormReturn } from 'react-hook-form';
import type { IcpProfileFormData } from '@/schemas/icp-profile-schema';

interface IcpFinancialSectionProps {
  form: UseFormReturn<IcpProfileFormData>;
}

export function IcpFinancialSection({ form }: IcpFinancialSectionProps) {
  const minMonthlyBill = form.watch('min_monthly_bill');
  const minSystemKwp = form.watch('min_system_kwp');

  // We will simulate "consumo mensal" (kWh) based on "faturamento" (R$ / 0.95 average tariff per kWh)
  // to avoid duplication since Rails API has min_monthly_bill and min_system_kwp, 
  // but the UX spec demands R$ bill slider, kWh consumption slider, and kWp system size slider.
  // We can calculate kWh as bill / 0.92, and vice-versa, or keep local states.
  // Let's bind "Consumo mensal (kWh)" reatively to "min_monthly_bill" / 0.85 (approx tariff rate)
  // so adjusting R$ adjusts kWh and vice versa, which is extremely slick!
  const calculatedKwh = Math.round(minMonthlyBill / 0.85);

  const handleBillChange = (val: number) => {
    form.setValue('min_monthly_bill', val, { shouldDirty: true });
  };

  const handleKwhChange = (val: number) => {
    // Sync back to bill: bill = kWh * 0.85
    const syncedBill = Math.round(val * 0.85);
    form.setValue('min_monthly_bill', syncedBill, { shouldDirty: true });
  };

  const handleKwpChange = (val: number) => {
    form.setValue('min_system_kwp', val, { shouldDirty: true });
  };

  return (
    <Card className="bg-white border border-[#D8DEE8] rounded-md shadow-none p-5 md:p-6">
      <IcpSectionHeader
        title="Perfil Financeiro e Consumo"
        description="Filtre leads de energia solar residencial ou corporativa através do faturamento energético estimado."
        badge="FAIXAS OPERACIONAIS"
      />
      
      <CardContent className="p-0 grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Fatura Mensal Mínima */}
        <IcpSliderField
          label="Fatura Mensal de Energia"
          tooltipText="O valor em Reais (R$) médio cobrado na conta de luz mensal do lead."
          value={minMonthlyBill}
          onValueChange={handleBillChange}
          min={200}
          max={50000}
          step={100}
          unit="R$"
          isCurrency
          helperText="Exclui leads com faturamento elétrico abaixo desta linha."
        />

        {/* Consumo Mensal Mínimo (Sincronizado) */}
        <IcpSliderField
          label="Consumo Mensal Médio"
          tooltipText="Consumo em kWh estimado ou medido mensalmente pelo lead."
          value={calculatedKwh}
          onValueChange={handleKwhChange}
          min={100}
          max={10000}
          step={50}
          unit="kWh"
          helperText="Sincronizado de forma reativa com o valor em Reais da fatura."
        />

        {/* Potência Mínima do Sistema (kWp) */}
        <IcpSliderField
          label="Potência Mínima do Gerador"
          tooltipText="Potência instalada em kWp mínima do sistema fotovoltaico para a qualificação."
          value={minSystemKwp}
          onValueChange={handleKwpChange}
          min={1}
          max={500}
          step={1}
          unit="kWp"
          helperText="Potência nominal de pico recomendada para o escopo do projeto."
        />
      </CardContent>
    </Card>
  );
}
