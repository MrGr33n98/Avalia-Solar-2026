'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { IcpSectionHeader } from './IcpSectionHeader';
import { IcpCheckboxCard } from './IcpCheckboxCard';
import { IcpNumericInput } from './IcpNumericInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Users, Lightbulb, Wallet, Hourglass } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { IcpProfileFormData } from '@/schemas/icp-profile-schema';

interface IcpDecisionSectionProps {
  form: UseFormReturn<IcpProfileFormData>;
}

const DECISION_PROFILES = [
  { id: 'decision_maker', label: 'Decisor Final', icon: Users },
  { id: 'influencer', label: 'Influenciador', icon: Users },
  { id: 'advisor', label: 'Recomendador', icon: Users },
  { id: 'buyer', label: 'Comprador', icon: Users },
  { id: 'non_decision', label: 'Não Decisor', icon: Users }
];

const MOTIVATIONS = [
  { id: 'bill_savings', label: 'Economia na Conta', icon: Lightbulb },
  { id: 'sustainability', label: 'Sustentabilidade', icon: Lightbulb },
  { id: 'independence', label: 'Independência Energética', icon: Lightbulb },
  { id: 'backup_power', label: 'Backup de Energia', icon: Lightbulb },
  { id: 'property_valuation', label: 'Valorização do Imóvel', icon: Lightbulb },
  { id: 'fleet_electrification', label: 'Eletrificação da Frota', icon: Lightbulb }
];

const URGENCY_OPTIONS = [
  { id: 'immediate', label: 'Imediata' },
  { id: '30_days', label: 'Até 30 dias' },
  { id: '3_months', label: 'Até 3 meses' },
  { id: '6_months', label: 'Até 6 meses' },
  { id: 'later', label: 'Acima de 6 meses' }
];

export function IcpDecisionSection({ form }: IcpDecisionSectionProps) {
  const decisionProfiles = form.watch('decision_profiles') || [];
  const motivations = form.watch('motivations') || [];
  const priceSensitivity = form.watch('price_sensitivity') || '';
  const urgency = form.watch('urgency') || '';
  const minTicket = form.watch('min_ticket');
  const maxTicket = form.watch('max_ticket');

  const handleDecisionProfileChange = (id: string, checked: boolean) => {
    const next = checked ? [...decisionProfiles, id] : decisionProfiles.filter((d) => d !== id);
    form.setValue('decision_profiles', next, { shouldDirty: true });
  };

  const handleMotivationChange = (id: string, checked: boolean) => {
    const next = checked ? [...motivations, id] : motivations.filter((m) => m !== id);
    form.setValue('motivations', next, { shouldDirty: true });
  };

  return (
    <Card className="bg-white border border-[#D8DEE8] rounded-md shadow-none p-5 md:p-6 space-y-6">
      <IcpSectionHeader
        title="Comportamento e Tomada de Decisão"
        description="Configure o perfil ideal do contato principal e seus motivadores de compra."
        badge="SEGMENTAÇÃO DE VENDA"
      />
      
      <CardContent className="p-0 space-y-6">
        {/* Perfil de Decisão */}
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#526071] block">
            Perfil de Decisão do Contato
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {DECISION_PROFILES.map((profile) => (
              <IcpCheckboxCard
                key={profile.id}
                checked={decisionProfiles.includes(profile.id)}
                onCheckedChange={(checked) => handleDecisionProfileChange(profile.id, checked)}
                label={profile.label}
                icon={profile.icon}
              />
            ))}
          </div>
        </div>

        {/* Motivação Principal */}
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#526071] block">
            Motivação Principal de Compra
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {MOTIVATIONS.map((mot) => (
              <IcpCheckboxCard
                key={mot.id}
                checked={motivations.includes(mot.id)}
                onCheckedChange={(checked) => handleMotivationChange(mot.id, checked)}
                label={mot.label}
                icon={mot.icon}
              />
            ))}
          </div>
        </div>

        {/* Sensibilidade ao preço e Urgência */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-tight text-[#0B1F3A] flex items-center gap-1.5">
              <Wallet className="h-3.5 w-3.5 text-[#1F5EFF]" />
              Sensibilidade ao Preço
            </Label>
            <Select
              value={priceSensitivity || ''}
              onValueChange={(val) => form.setValue('price_sensitivity', val, { shouldDirty: true })}
            >
              <SelectTrigger className="h-9 text-xs rounded-sm border-[#D8DEE8] bg-white text-[#0B1F3A] focus:ring-1 focus:ring-[#1F5EFF]">
                <SelectValue placeholder="Selecione a sensibilidade de orçamento" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#D8DEE8]">
                <SelectItem value="low" className="text-xs text-[#0B1F3A] focus:bg-[#EEF4FF]">Baixa (Foco em qualidade)</SelectItem>
                <SelectItem value="medium" className="text-xs text-[#0B1F3A] focus:bg-[#EEF4FF]">Média (Equilíbrio custo-benefício)</SelectItem>
                <SelectItem value="high" className="text-xs text-[#0B1F3A] focus:bg-[#EEF4FF]">Alta (Foco no menor preço)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-bold uppercase tracking-tight text-[#0B1F3A] flex items-center gap-1.5">
              <Hourglass className="h-3.5 w-3.5 text-[#1F5EFF]" />
              Urgência de Fechamento
            </Label>
            <Select
              value={urgency || ''}
              onValueChange={(val) => form.setValue('urgency', val, { shouldDirty: true })}
            >
              <SelectTrigger className="h-9 text-xs rounded-sm border-[#D8DEE8] bg-white text-[#0B1F3A] focus:ring-1 focus:ring-[#1F5EFF]">
                <SelectValue placeholder="Selecione a velocidade desejada" />
              </SelectTrigger>
              <SelectContent className="bg-white border-[#D8DEE8]">
                {URGENCY_OPTIONS.map((opt) => (
                  <SelectItem key={opt.id} value={opt.id} className="text-xs text-[#0B1F3A] focus:bg-[#EEF4FF]">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Ticket Esperado */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#D8DEE8]">
          <IcpNumericInput
            label="Ticket Mínimo do Projeto (R$)"
            value={minTicket ?? null}
            onChange={(val) => form.setValue('min_ticket', val, { shouldDirty: true })}
            placeholder="Ex: 5000"
            unit="BRL"
          />

          <IcpNumericInput
            label="Ticket Máximo do Projeto (R$)"
            value={maxTicket ?? null}
            onChange={(val) => form.setValue('max_ticket', val, { shouldDirty: true })}
            placeholder="Ex: 150000"
            unit="BRL"
          />
        </div>
      </CardContent>
    </Card>
  );
}
