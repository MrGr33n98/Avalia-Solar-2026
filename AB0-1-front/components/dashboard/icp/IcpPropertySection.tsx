'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { IcpSectionHeader } from './IcpSectionHeader';
import { IcpCheckboxCard } from './IcpCheckboxCard';
import { Building, Compass, Home, Landmark, Shield } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { IcpProfileFormData } from '@/schemas/icp-profile-schema';

interface IcpPropertySectionProps {
  form: UseFormReturn<IcpProfileFormData>;
}

const PROPERTY_TYPES = [
  { id: 'residential', label: 'Residencial', icon: Home },
  { id: 'commercial', label: 'Comercial', icon: Building },
  { id: 'industrial', label: 'Industrial', icon: Building },
  { id: 'rural', label: 'Rural', icon: Compass },
  { id: 'condominium', label: 'Condomínio', icon: Home },
  { id: 'public', label: 'Prédio Público', icon: Landmark }
];

const ROOF_TYPES = [
  { id: 'colonial', label: 'Cerâmico / Colonial' },
  { id: 'metalico', label: 'Metálico' },
  { id: 'fibrocimento', label: 'Fibrocimento' },
  { id: 'laje', label: 'Laje / Concreto' },
  { id: 'carport', label: 'Carport' },
  { id: 'solo', label: 'Solo / Usina' },
  { id: 'telhado_verde', label: 'Telhado Verde' },
  { id: 'fachada_vidro', label: 'Fachada de Vidro' },
  { id: 'tracker', label: 'Tracker' }
];

const ORIENTATIONS = [
  { id: 'norte', label: 'Norte' },
  { id: 'nordeste', label: 'Nordeste' },
  { id: 'noroeste', label: 'Noroeste' },
  { id: 'leste', label: 'Leste' },
  { id: 'oeste', label: 'Oeste' },
  { id: 'sul', label: 'Sul' }
];

export function IcpPropertySection({ form }: IcpPropertySectionProps) {
  const targetAudiences = form.watch('target_audiences') || [];
  const preferredRoofTypes = form.watch('preferred_roof_types') || [];
  const targetRegions = form.watch('target_regions') || []; // Using targetRegions as orientation keys to avoid schema mismatch

  const handleAudienceChange = (id: string, checked: boolean) => {
    const next = checked ? [...targetAudiences, id] : targetAudiences.filter((a) => a !== id);
    form.setValue('target_audiences', next, { shouldDirty: true });
  };

  const handleRoofChange = (id: string, checked: boolean) => {
    const next = checked ? [...preferredRoofTypes, id] : preferredRoofTypes.filter((r) => r !== id);
    form.setValue('preferred_roof_types', next, { shouldDirty: true });
  };

  const handleOrientationChange = (id: string, checked: boolean) => {
    const next = checked ? [...targetRegions, id] : targetRegions.filter((o) => o !== id);
    form.setValue('target_regions', next, { shouldDirty: true });
  };

  return (
    <Card className="bg-white border border-[#D8DEE8] rounded-md shadow-none p-5 md:p-6 space-y-6">
      <IcpSectionHeader
        title="Tipo de Imóvel e Estrutura"
        description="Selecione as tipologias de propriedade, fixação de telhados e orientações solares preferenciais para as prospecções."
        badge="INFRAESTRUTURA"
      />
      
      <CardContent className="p-0 space-y-6">
        {/* Grupo A: Tipo de Imóvel */}
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#526071] block">
            A. Tipo de Imóvel
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {PROPERTY_TYPES.map((prop) => (
              <IcpCheckboxCard
                key={prop.id}
                checked={targetAudiences.includes(prop.id)}
                onCheckedChange={(checked) => handleAudienceChange(prop.id, checked)}
                label={prop.label}
                icon={prop.icon}
              />
            ))}
          </div>
        </div>

        {/* Grupo B: Estrutura ou Telhado */}
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#526071] block">
            B. Estrutura de Instalação / Fixação
          </Label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            {ROOF_TYPES.map((roof) => (
              <IcpCheckboxCard
                key={roof.id}
                checked={preferredRoofTypes.includes(roof.id)}
                onCheckedChange={(checked) => handleRoofChange(roof.id, checked)}
                label={roof.label}
              />
            ))}
          </div>
        </div>

        {/* Grupo C: Orientação */}
        <div className="space-y-3">
          <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#526071] block">
            C. Orientação Solar (Módulos)
          </Label>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-2.5">
            {ORIENTATIONS.map((ori) => (
              <IcpCheckboxCard
                key={ori.id}
                checked={targetRegions.includes(ori.id)}
                onCheckedChange={(checked) => handleOrientationChange(ori.id, checked)}
                label={ori.label}
              />
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
