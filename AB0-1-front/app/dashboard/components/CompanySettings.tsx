'use client';

import { Settings, Save } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import AnalyticsSettings from './AnalyticsSettings';

interface CompanySettingsProps {
  companyId: string;
}

export default function CompanySettings({ companyId }: CompanySettingsProps) {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Configurações</h2>
        <p className="text-white/40">Configure CTAs e preferências da empresa</p>
      </div>

      {/* Tour Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Tour Guiado</CardTitle>
          <CardDescription>Reveja o tutorial do dashboard a qualquer momento</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <p className="text-sm text-white/40">
              Faça um tour pelas principais funcionalidades do dashboard
            </p>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => {
                if (typeof window !== 'undefined') {
                  const { startDashboardTour } = require('@/lib/tour');
                  startDashboardTour();
                }
              }}>
                Iniciar Tour
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>CTAs Personalizados</CardTitle>
          <CardDescription>Configure os botões de ação do seu perfil</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>CTA Primário - Label</Label>
              <Input placeholder="Solicitar Orçamento" />
            </div>
            <div className="space-y-2">
              <Label>CTA Primário - URL</Label>
              <Input placeholder="https://..." />
            </div>
            <div className="space-y-2">
              <Label>CTA Secundário - Label</Label>
              <Input placeholder="Fale Conosco" />
            </div>
            <div className="space-y-2">
              <Label>CTA Secundário - URL</Label>
              <Input placeholder="https://..." />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Template WhatsApp</Label>
            <Textarea 
              placeholder="Olá! Gostaria de saber mais sobre..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>UTM Source</Label>
              <Input placeholder="website" />
            </div>
            <div className="space-y-2">
              <Label>UTM Medium</Label>
              <Input placeholder="organic" />
            </div>
            <div className="space-y-2">
              <Label>UTM Campaign</Label>
              <Input placeholder="spring2024" />
            </div>
          </div>
          <Button>
            <Save className="h-[18px] w-[18px] mr-2" />
            Salvar Configurações
          </Button>
        </CardContent>
      </Card>

      <AnalyticsSettings companyId={companyId} />
    </div>
  );
}
