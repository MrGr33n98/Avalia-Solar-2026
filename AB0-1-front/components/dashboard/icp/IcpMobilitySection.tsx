'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { IcpSectionHeader } from './IcpSectionHeader';
import { IcpCheckboxCard } from './IcpCheckboxCard';
import { IcpSliderField } from './IcpSliderField';
import { IcpNumericInput } from './IcpNumericInput';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Car, Calendar, DollarSign, Briefcase } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { IcpProfileFormData } from '@/schemas/icp-profile-schema';

interface IcpMobilitySectionProps {
  form: UseFormReturn<IcpProfileFormData>;
}

const CHARGER_TYPES = [
  { id: 'ac_wallbox', label: 'AC Wallbox Residencial' },
  { id: 'ac_comercial', label: 'AC Comercial' },
  { id: 'dc_rapido', label: 'DC Rápido' },
  { id: 'dc_ultrarrapido', label: 'DC Ultrarrápido' },
  { id: 'ambos_ac_dc', label: 'Ambos AC + DC' },
  { id: 'condominio', label: 'Solução para Condomínio' },
  { id: 'frota_empresarial', label: 'Frota Empresarial' },
  { id: 'hub_recarga', label: 'Hub de Recarga' },
  { id: 'off_grid', label: 'Sistema Off-Grid' }
];

const APPLICATIONS = [
  { id: 'residential', label: 'Residencial' },
  { id: 'condominium', label: 'Condomínio' },
  { id: 'enterprise', label: 'Empresa' },
  { id: 'shopping', label: 'Shopping' },
  { id: 'hotel', label: 'Hotel' },
  { id: 'parking', label: 'Estacionamento' },
  { id: 'station', label: 'Posto de Recarga' },
  { id: 'fleet', label: 'Frota Logística' },
  { id: 'transit', label: 'Transporte Público' }
];

const TIMEFRAMES = [
  { id: 'immediate', label: 'Imediato' },
  { id: '30_days', label: 'Até 30 dias' },
  { id: '3_months', label: 'Até 3 meses' },
  { id: '6_months', label: 'Até 6 meses' },
  { id: 'later', label: 'Acima de 6 meses' }
];

export function IcpMobilitySection({ form }: IcpMobilitySectionProps) {
  const evActive = form.watch('ev_active');
  const minEvChargersCount = form.watch('min_ev_chargers_count');
  const minEvVehiclesCount = form.watch('min_ev_vehicles_count') ?? 0;
  const evChargerTypes = form.watch('ev_charger_types') || [];
  const evApplications = form.watch('ev_applications') || [];
  const evTimeframe = form.watch('ev_timeframe') || '';
  const evBudget = form.watch('ev_budget') || '';

  const handleToggleEvActive = (val: boolean) => {
    form.setValue('ev_active', val, { shouldDirty: true });
  };

  const handleChargerTypesChange = (id: string, checked: boolean) => {
    const next = checked ? [...evChargerTypes, id] : evChargerTypes.filter((t) => t !== id);
    form.setValue('ev_charger_types', next, { shouldDirty: true });
  };

  const handleApplicationsChange = (id: string, checked: boolean) => {
    const next = checked ? [...evApplications, id] : evApplications.filter((a) => a !== id);
    form.setValue('ev_applications', next, { shouldDirty: true });
  };

  const handleChargersCountChange = (val: number) => {
    form.setValue('min_ev_chargers_count', val, { shouldDirty: true });
  };

  const handleVehiclesCountChange = (val: number) => {
    form.setValue('min_ev_vehicles_count', val, { shouldDirty: true });
  };

  return (
    <Card className="bg-white border border-[#D8DEE8] rounded-md shadow-none p-5 md:p-6">
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#D8DEE8] mb-6">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-tight text-[#0B1F3A]">
            Mobilidade Elétrica e Carregadores EV
          </h3>
          <p className="text-[10.5px] font-medium text-[#526071]">
            Qualifique leads interessados em infraestrutura de recarga de veículos elétricos e frotas corporativas.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <span className="text-[10px] font-black text-[#526071] uppercase tracking-wider">
            {evActive ? 'ATIVADO' : 'DESATIVADO'}
          </span>
          <Switch
            checked={evActive}
            onCheckedChange={handleToggleEvActive}
            aria-label="Ativar regras de mobilidade elétrica"
          />
        </div>
      </div>

      {evActive && (
        <CardContent className="p-0 space-y-8 animate-in fade-in duration-200">
          {/* Sliders de Unidades de Carregadores e Veículos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <IcpSliderField
              label="Quantidade Mínima de Carregadores"
              tooltipText="Número de plugues ou totens de carregamento que o lead necessita."
              value={minEvChargersCount}
              onValueChange={handleChargersCountChange}
              min={0}
              max={50}
              step={1}
              unit="Unidades"
              helperText="Filtra demandas com quantidades de carregadores menores do que o especificado."
            />

            <IcpSliderField
              label="Tamanho Mínimo da Frota Elétrica"
              tooltipText="Quantidade de veículos elétricos ou híbridos atualmente em operação ou previstos pelo lead."
              value={minEvVehiclesCount}
              onValueChange={handleVehiclesCountChange}
              min={0}
              max={100}
              step={1}
              unit="Veículos"
              helperText="Útil para focar em grandes frotas logísticas ou frotas empresariais."
            />
          </div>

          {/* Tipo de Carregador */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#526071] block">
              Tipos de Carregadores Permitidos (Seleção Múltipla)
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {CHARGER_TYPES.map((type) => (
                <IcpCheckboxCard
                  key={type.id}
                  checked={evChargerTypes.includes(type.id)}
                  onCheckedChange={(checked) => handleChargerTypesChange(type.id, checked)}
                  label={type.label}
                  icon={Zap}
                />
              ))}
            </div>
          </div>

          {/* Aplicações do Projeto */}
          <div className="space-y-3">
            <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#526071] block">
              Aplicações do Projeto EV
            </Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {APPLICATIONS.map((app) => (
                <IcpCheckboxCard
                  key={app.id}
                  checked={evApplications.includes(app.id)}
                  onCheckedChange={(checked) => handleApplicationsChange(app.id, checked)}
                  label={app.label}
                  icon={Briefcase}
                />
              ))}
            </div>
          </div>

          {/* Prazos e Orçamentos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-tight text-[#0B1F3A] flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-[#1F5EFF]" />
                Prazo Esperado de Implantação
              </Label>
              <Select
                value={evTimeframe}
                onValueChange={(val) => form.setValue('ev_timeframe', val, { shouldDirty: true })}
              >
                <SelectTrigger className="h-9 text-xs rounded-sm border-[#D8DEE8] bg-white text-[#0B1F3A] focus:ring-1 focus:ring-[#1F5EFF]">
                  <SelectValue placeholder="Selecione o prazo operacional máximo" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#D8DEE8]">
                  {TIMEFRAMES.map((tf) => (
                    <SelectItem key={tf.id} value={tf.id} className="text-xs text-[#0B1F3A] focus:bg-[#EEF4FF] focus:text-[#0B1F3A]">
                      {tf.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold uppercase tracking-tight text-[#0B1F3A] flex items-center gap-1.5">
                <DollarSign className="h-3.5 w-3.5 text-[#1F5EFF]" />
                Orçamento Previsto (Faixa Estimada)
              </Label>
              <Select
                value={evBudget}
                onValueChange={(val) => form.setValue('ev_budget', val, { shouldDirty: true })}
              >
                <SelectTrigger className="h-9 text-xs rounded-sm border-[#D8DEE8] bg-white text-[#0B1F3A] focus:ring-1 focus:ring-[#1F5EFF]">
                  <SelectValue placeholder="Selecione a faixa de investimento disponível" />
                </SelectTrigger>
                <SelectContent className="bg-white border-[#D8DEE8]">
                  <SelectItem value="low" className="text-xs text-[#0B1F3A] focus:bg-[#EEF4FF]">Até R$ 10.000</SelectItem>
                  <SelectItem value="medium" className="text-xs text-[#0B1F3A] focus:bg-[#EEF4FF]">R$ 10.000 a R$ 50.000</SelectItem>
                  <SelectItem value="high" className="text-xs text-[#0B1F3A] focus:bg-[#EEF4FF]">R$ 50.000 a R$ 150.000</SelectItem>
                  <SelectItem value="enterprise" className="text-xs text-[#0B1F3A] focus:bg-[#EEF4FF]">Acima de R$ 150.000</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      )}

      {!evActive && (
        <div className="rounded-md border border-[#D8DEE8] bg-[#F8FAFC] p-6 text-center text-xs font-medium text-[#526071]">
          Regras de Mobilidade Elétrica desativadas para esta qualificação.
        </div>
      )}
    </Card>
  );
}
