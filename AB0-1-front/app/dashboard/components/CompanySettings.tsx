'use client';

import React from 'react';
import { 
  Settings2, 
  Save, 
  PlayCircle, 
  MousePointer2, 
  Target, 
  MessageSquare, 
  Link2, 
  Layers,
  ShieldAlert,
  Terminal,
  Settings,
  Zap
} from 'lucide-react';
import { motion } from 'framer-motion';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import AnalyticsSettings from './AnalyticsSettings';
import MetricCard from './MetricCard';

interface CompanySettingsProps {
  companyId: string;
}

export default function CompanySettings({ companyId }: CompanySettingsProps) {
  return (
    <div className="space-y-12">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Settings2 className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Operational Intelligence</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase text-white leading-none">
            Settings <span className="text-primary">Center</span>
          </h2>
          <p className="text-sm text-white/40 max-w-lg font-medium leading-relaxed">
            Configure as diretivas de conversão, rastreamento analítico e protocolos de experiência do usuário.
          </p>
        </div>
        
        <Button className="h-12 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-primary/20 transition-all active:scale-95 group">
          <Save className="h-4 w-4 mr-2 group-hover:scale-110 transition-transform" />
          Sincronizar Configurações
        </Button>
      </div>

      {/* Config Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Nós de Conversão"
          value="4"
          icon={Target}
          description="CTAs táticos configurados"
          variant="glass"
        />
        <MetricCard
          title="Tracking Status"
          value="Ativo"
          icon={Zap}
          description="UTM Pipeline operacional"
          variant="glass"
        />
        <MetricCard
          title="UX Health"
          value="98%"
          icon={PlayCircle}
          description="Integridade do tour guiado"
          variant="glass"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-8">
          {/* Conversion Protocol (CTAs) */}
          <Card className="clay-precision bg-[#002B4D]/50 backdrop-blur-xl border-none rounded-[3rem] overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5 bg-white/[0.01]">
                <div className="flex items-center justify-between">
                   <CardTitle className="text-xl font-black text-white uppercase tracking-tight">Conversion Protocol</CardTitle>
                   <Badge className="bg-primary/10 text-primary border-none font-black text-[9px] px-3">LEAD GEN</Badge>
                </div>
                <CardDescription className="text-white/40 font-medium">Configure os vetores de ação direta no seu perfil analítico.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-10">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-2 mb-2">
                     <div className="h-2 w-2 rounded-full bg-primary" />
                     <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Vetor Primário</Label>
                  </div>
                  <div className="space-y-4">
                    <Input placeholder="Label: Solicitar Orçamento" className="h-14 px-6 rounded-2xl bg-black/40 border-white/5 text-sm font-bold focus:ring-primary/30" />
                    <div className="relative group">
                      <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                      <Input placeholder="URL: https://..." className="h-14 pl-12 pr-6 rounded-2xl bg-black/40 border-white/5 text-sm font-medium focus:ring-primary/30" />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                   <div className="flex items-center gap-2 mb-2">
                     <div className="h-2 w-2 rounded-full bg-white/40" />
                     <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">Vetor Secundário</Label>
                  </div>
                  <div className="space-y-4">
                    <Input placeholder="Label: Fale Conosco" className="h-14 px-6 rounded-2xl bg-black/40 border-white/5 text-sm font-bold focus:ring-primary/30" />
                    <div className="relative group">
                      <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-primary transition-colors" />
                      <Input placeholder="URL: https://..." className="h-14 pl-12 pr-6 rounded-2xl bg-black/40 border-white/5 text-sm font-medium focus:ring-primary/30" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-8 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between pl-1">
                   <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400">Mensageiria Direta (WhatsApp)</Label>
                   <MessageSquare className="h-4 w-4 text-brand-green/30" />
                </div>
                <Textarea 
                  placeholder="Olá! Estive analisando sua empresa no Avalia Solar e gostaria de uma proposta de projeto..."
                  rows={4}
                  className="p-6 rounded-3xl bg-black/40 border-white/5 text-sm font-medium focus:ring-emerald-500/30 resize-none leading-relaxed"
                />
              </div>

              <div className="pt-8 border-t border-white/5">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 pl-1 mb-6 block">Matriz de Atribuição (UTMs)</Label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block ml-2">Source</span>
                    <Input placeholder="website" className="h-12 px-6 rounded-xl bg-black/40 border-white/5 text-xs font-bold" />
                  </div>
                  <div className="space-y-2">
                     <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block ml-2">Medium</span>
                    <Input placeholder="organic" className="h-12 px-6 rounded-xl bg-black/40 border-white/5 text-xs font-bold" />
                  </div>
                  <div className="space-y-2">
                     <span className="text-[9px] font-black text-white/20 uppercase tracking-widest block ml-2">Campaign</span>
                    <Input placeholder="spring2024" className="h-12 px-6 rounded-xl bg-black/40 border-white/5 text-xs font-bold" />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <AnalyticsSettings companyId={companyId} />
        </div>

        <div className="lg:col-span-4 space-y-8">
          {/* Guided Protocol (Tour) */}
          <Card className="clay-precision bg-gradient-to-br from-indigo-600/20 to-primary/20 border-none rounded-[3rem] p-10 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
               <Layers className="h-32 w-32 text-white" />
            </div>
            <div className="relative z-10 space-y-6">
               <div className="h-14 w-14 rounded-2xl bg-white/10 flex items-center justify-center border border-white/10">
                  <PlayCircle className="h-7 w-7 text-white" />
               </div>
               <div>
                 <h4 className="text-2xl font-black text-white uppercase tracking-tighter mb-2">Protocolo Guiado</h4>
                 <p className="text-sm text-white/60 font-medium leading-relaxed">
                   Reinicie o mapeamento sensorial de funcionalidades para novos operadores ou revisão técnica.
                 </p>
               </div>
               <Button 
                onClick={() => {
                  if (typeof window !== 'undefined') {
                    const { startDashboardTour } = require('@/lib/tour');
                    startDashboardTour();
                  }
                }}
                className="w-full h-14 bg-white text-indigo-600 font-black uppercase tracking-widest text-[11px] rounded-2xl hover:bg-white/90 active:scale-95 shadow-2xl transition-all"
               >
                 Iniciar Onboarding v3.0
               </Button>
            </div>
          </Card>

          <Card className="clay-precision bg-[#001D33] border border-white/5 rounded-[3rem] p-10 space-y-6">
             <div className="flex items-center gap-3 text-amber-500">
                <ShieldAlert className="h-5 w-5" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Safety Protocol</span>
             </div>
             <p className="text-[11px] text-white/30 font-medium leading-relaxed">
                As alterações na matriz de conversão são propagadas instantaneamente para todos os <span className="text-white font-bold">Authority Nodes</span> ativos na rede. Certifique-se de validar as URLs de destino antes de sincronizar.
             </p>
             <div className="p-4 rounded-2xl bg-black/40 border border-white/5 font-mono text-[10px] text-blue-400">
                <div className="flex items-center gap-2 mb-1">
                   <Terminal className="h-3 w-3" />
                   <span>LOG_STREAM</span>
                </div>
                <p className="opacity-50 italic">Waiting for sync command...</p>
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
