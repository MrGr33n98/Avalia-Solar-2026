'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { IcpSectionHeader } from './IcpSectionHeader';
import { IcpStateGrid } from './IcpStateGrid';
import { IcpCheckboxCard } from './IcpCheckboxCard';
import { IcpSliderField } from './IcpSliderField';
import { Map, MapPin, Building, Globe } from 'lucide-react';
import type { UseFormReturn } from 'react-hook-form';
import type { IcpProfileFormData } from '@/schemas/icp-profile-schema';

interface IcpLocationSectionProps {
  form: UseFormReturn<IcpProfileFormData>;
}

const ZONES = [
  { id: 'urban', label: 'Zona Urbana', icon: Building },
  { id: 'rural', label: 'Zona Rural', icon: MapPin },
  { id: 'periurban', label: 'Zona Periurbana', icon: MapPin },
  { id: 'industrial', label: 'Zona Industrial', icon: Map }
];

export function IcpLocationSection({ form }: IcpLocationSectionProps) {
  const nationwide = form.watch('nationwide');
  const targetStates = form.watch('target_states') || [];
  const targetCities = form.watch('target_cities') || [];

  const [activeTab, setActiveTab] = useState<'states' | 'radius'>('states');
  const [radiusKm, setRadiusKm] = useState<number>(50);
  const [baseState, setBaseState] = useState<string>('SP');
  const [baseCity, setBaseCity] = useState<string>('');
  const [selectedZones, setSelectedZones] = useState<string[]>(['urban', 'industrial']);

  const handleNationwideChange = (val: boolean) => {
    form.setValue('nationwide', val, { shouldDirty: true });
    if (val) {
      form.setValue('target_states', [], { shouldDirty: true });
    }
  };

  const handleStatesChange = (states: string[]) => {
    form.setValue('target_states', states, { shouldDirty: true });
  };

  const toggleZone = (id: string, checked: boolean) => {
    if (checked) {
      setSelectedZones([...selectedZones, id]);
    } else {
      setSelectedZones(selectedZones.filter((z) => z !== id));
    }
  };

  return (
    <Card className="bg-white border border-[#D8DEE8] rounded-md shadow-none p-5 md:p-6 space-y-6">
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-[#D8DEE8]">
        <div className="space-y-1">
          <h3 className="text-sm font-black uppercase tracking-tight text-[#0B1F3A]">
            Localização Geográfica
          </h3>
          <p className="text-[10.5px] font-medium text-[#526071]">
            Defina o território de abrangência operacional de vendas da sua empresa.
          </p>
        </div>
        
        <div className="flex items-center gap-2">
          <Globe className="h-4 w-4 text-[#1F5EFF]" />
          <span className="text-[10px] font-black text-[#526071] uppercase tracking-wider">
            Cobertura Nacional
          </span>
          <Switch
            checked={nationwide}
            onCheckedChange={handleNationwideChange}
            aria-label="Ativar cobertura geográfica nacional"
          />
        </div>
      </div>

      <CardContent className="p-0">
        {nationwide ? (
          <div className="rounded-md border border-dashed border-[#1F5EFF]/20 bg-[#EEF4FF]/20 p-8 text-center space-y-2">
            <Globe className="h-7 w-7 text-[#1F5EFF] mx-auto animate-pulse" />
            <h4 className="text-xs font-black text-[#0B1F3A] uppercase tracking-wide">Atuação a Nível Federal Habilitada</h4>
            <p className="text-[11px] text-[#526071] max-w-sm mx-auto leading-relaxed">
              Sua empresa está elegível para receber leads de qualquer cidade ou estado do território brasileiro sem nenhuma trava geográfica.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <Tabs value={activeTab} onValueChange={(val: any) => setActiveTab(val)} className="w-full">
              <TabsList className="grid grid-cols-2 h-9 p-0.5 bg-[#F8FAFC] border border-[#D8DEE8] rounded-sm mb-5">
                <TabsTrigger
                  value="states"
                  className="text-[10.5px] font-black uppercase tracking-wider text-[#526071] data-[state=active]:bg-white data-[state=active]:text-[#1F5EFF] data-[state=active]:shadow-2xs rounded-sm h-full"
                >
                  Estados
                </TabsTrigger>
                <TabsTrigger
                  value="radius"
                  className="text-[10.5px] font-black uppercase tracking-wider text-[#526071] data-[state=active]:bg-white data-[state=active]:text-[#1F5EFF] data-[state=active]:shadow-2xs rounded-sm h-full"
                >
                  Raio de Atendimento
                </TabsTrigger>
              </TabsList>

              {/* Tab Estados */}
              <TabsContent value="states" className="mt-0 outline-none">
                <IcpStateGrid
                  selectedStates={targetStates}
                  onChange={handleStatesChange}
                />
              </TabsContent>

              {/* Tab Raio de Atendimento */}
              <TabsContent value="radius" className="mt-0 outline-none space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                  <div className="space-y-2">
                    <Label className="text-xs font-bold uppercase tracking-tight text-[#0B1F3A]">Estado Base</Label>
                    <Input
                      value={baseState}
                      onChange={(e) => setBaseState(e.target.value.toUpperCase().slice(0, 2))}
                      placeholder="SP"
                      maxLength={2}
                      className="h-9 text-xs font-bold rounded-sm border-[#D8DEE8] bg-white text-[#0B1F3A]"
                    />
                  </div>

                  <div className="space-y-2 sm:col-span-2">
                    <Label className="text-xs font-bold uppercase tracking-tight text-[#0B1F3A]">Cidade Base</Label>
                    <Input
                      value={baseCity}
                      onChange={(e) => setBaseCity(e.target.value)}
                      placeholder="Ex: Campinas"
                      className="h-9 text-xs font-bold rounded-sm border-[#D8DEE8] bg-white text-[#0B1F3A]"
                    />
                  </div>
                </div>

                <IcpSliderField
                  label="Raio em Quilômetros"
                  value={radiusKm}
                  onValueChange={setRadiusKm}
                  min={10}
                  max={400}
                  step={10}
                  unit="km"
                  helperText="Define a cobertura circular operacional partindo da cidade base especificada."
                />

                {/* Zonas de interesse */}
                <div className="space-y-3">
                  <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-[#526071] block">
                    Zonas Operacionais de Interesse
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                    {ZONES.map((zone) => (
                      <IcpCheckboxCard
                        key={zone.id}
                        checked={selectedZones.includes(zone.id)}
                        onCheckedChange={(checked) => toggleZone(zone.id, checked)}
                        label={zone.label}
                        icon={zone.icon}
                      />
                    ))}
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
