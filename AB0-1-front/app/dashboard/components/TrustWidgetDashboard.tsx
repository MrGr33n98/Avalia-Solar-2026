'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ShieldCheck, 
  Copy, 
  Check, 
  ExternalLink, 
  Trophy, 
  Zap, 
  Globe, 
  Code2, 
  Smartphone, 
  Monitor, 
  Layout, 
  Maximize,
  ArrowRight,
  Info
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import WidgetBadge from './WidgetBadge';
import { cn } from '@/lib/utils';
import MetricCard from './MetricCard';

interface TrustWidgetDashboardProps {
  company: any;
}

export default function TrustWidgetDashboard({ company }: TrustWidgetDashboardProps) {
  const [copied, setCopied] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [size, setSize] = useState<'small' | 'medium' | 'large'>('medium');
  const [showRank, setShowRank] = useState(true);
  
  const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
  const apiKey = company?.api_key || 'SUA_API_KEY';
  const companyId = company?.id || 'ID';

  const snippet = `<div 
    data-avalia-solar-widget 
    data-company-id="${companyId}" 
    data-api-key="${apiKey}"
    data-theme="${theme}"
    data-size="${size}"
    data-show-rank="${showRank}"
  ></div>
  <script src="${apiBaseUrl}/trust-widget-embed.js" async></script>`;

  const handleCopy = () => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(snippet);
      setCopied(true);
      toast.success('Script de autoridade copiado!');
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const mockCompanyData = {
    name: company?.name || 'Sua Empresa',
    verified: company?.verified ?? true,
    trust_score: company?.trust_score || 95,
    rating_avg: company?.rating_avg || 4.8,
    reviews_count: company?.reviews_count || 124,
    verified_badge_image_url: company?.verified_badge_image_url,
    public_profile_url: '#',
    priority_score: company?.priority_score || 100,
  };

  return (
    <div className="space-y-12">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-emerald-500 mb-1">
            <Globe className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Trust Network Distribution</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase text-white leading-none">
            Authority <span className="text-emerald-500">Node</span>
          </h2>
          <p className="text-sm text-white/40 max-w-lg font-medium leading-relaxed">
            Distribua sua prova social e reputação certificada em tempo real para qualquer endpoint externo através de nosso protocolo de widget assíncrono.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="h-14 w-14 rounded-2xl bg-white/[0.02] border border-white/5 flex items-center justify-center">
              <Code2 className="h-6 w-6 text-white/20" />
           </div>
           <div>
              <p className="text-[10px] font-black text-white/40 uppercase tracking-widest mb-1">API Protocol</p>
              <Badge className="bg-emerald-500/10 text-emerald-500 border-none font-black text-[9px] px-3">ACTIVE v2.4</Badge>
           </div>
        </div>
      </div>

      {/* Distribution Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Taxa de Impressão"
          value="14.2k"
          change="+8%"
          changeType="positive"
          icon={Monitor}
          color="blue"
        />
        <MetricCard
          title="Trust Score"
          value={`${mockCompanyData.trust_score}%`}
          icon={ShieldCheck}
          color="emerald"
        />
        <MetricCard
          title="CTR Estimado"
          value="4.8%"
          change="+1.2%"
          changeType="positive"
          icon={Zap}
          color="amber"
        />
        <MetricCard
          title="Status de Rede"
          value="Online"
          icon={Globe}
          color="blue"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <Card className="clay-precision bg-[#002B4D]/50 backdrop-blur-xl border-none rounded-[3rem] overflow-hidden shadow-2xl">
            <CardHeader className="p-8 border-b border-white/5">
              <CardTitle className="text-xl font-black text-white uppercase tracking-tight">Configuração de Interface</CardTitle>
              <CardDescription className="text-white/40 font-medium">Personalize os parâmetros de visualização do seu nó de autoridade.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Theme Selector */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 pl-1">Esquema Digital (Tema)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setTheme('light')}
                    className={cn(
                      "group h-14 rounded-2xl border transition-all flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest",
                      theme === 'light' 
                        ? "bg-white text-[#002B4D] border-white shadow-[0_0_20px_rgba(255,255,255,0.2)]" 
                        : "bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/[0.05]"
                    )}
                  >
                    <div className={cn("w-2 h-2 rounded-full", theme === 'light' ? "bg-primary" : "bg-white/20")} />
                    Light Protocol
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={cn(
                      "group h-14 rounded-2xl border transition-all flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest",
                      theme === 'dark' 
                        ? "bg-blue-600 text-white border-blue-500 shadow-[0_0_20px_rgba(37,99,235,0.3)]" 
                        : "bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/[0.05]"
                    )}
                  >
                    <div className={cn("w-2 h-2 rounded-full bg-white", theme === 'dark' ? "animate-pulse" : "opacity-20")} />
                    Silicon Dark
                  </button>
                </div>
              </div>

              {/* Size Selector */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 pl-1">Escala de Renderização</Label>
                <div className="grid grid-cols-3 gap-4">
                  {(['small', 'medium', 'large'] as const).map((s) => (
                    <button 
                      key={s}
                      onClick={() => setSize(s)}
                      className={cn(
                        "h-14 rounded-2xl border transition-all text-[10px] font-black uppercase tracking-widest",
                        size === s 
                          ? "bg-white/10 text-white border-white/20 shadow-inner" 
                          : "bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/[0.05]"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ranking View */}
              <div className="space-y-4">
                <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 pl-1">Visualização de Elite</Label>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowRank(true)} 
                    className={cn(
                      "flex-1 h-14 rounded-2xl border transition-all flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest",
                      showRank 
                        ? "bg-amber-500/10 text-amber-500 border-amber-500/30" 
                        : "bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/[0.05]"
                    )}
                  >
                    <Trophy className={cn("w-4 h-4", showRank ? "fill-amber-500/20" : "")} />
                    Exibir Ranking
                  </button>
                  <button 
                    onClick={() => setShowRank(false)} 
                    className={cn(
                      "flex-1 h-14 rounded-2xl border transition-all flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest",
                      !showRank 
                        ? "bg-white/10 text-white border-white/20" 
                        : "bg-white/[0.02] border-white/5 text-white/40 hover:bg-white/[0.05]"
                    )}
                  >
                    Apenas Reputação
                  </button>
                </div>
              </div>

              {/* Code Snippet */}
              <div className="pt-8 mt-8 border-t border-white/5 space-y-4">
                <div className="flex items-center justify-between">
                   <Label className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 pl-1">Pipeline Snippet (HTML/JS)</Label>
                   <Badge variant="outline" className="border-emerald-500/20 text-emerald-500 text-[8px] font-black">X64 ENCRYPTED</Badge>
                </div>
                <div className="relative group/snippet overflow-hidden">
                  <pre className="p-6 bg-black/50 text-emerald-400 rounded-3xl text-[11px] overflow-x-auto border border-white/5 leading-relaxed font-mono shadow-inner scrollbar-hide">
                    {snippet}
                  </pre>
                  <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-black/60 to-transparent pointer-events-none group-hover/snippet:opacity-0 transition-opacity" />
                  <Button
                    size="icon"
                    className="absolute top-4 right-4 h-12 w-12 bg-emerald-500 hover:bg-emerald-400 text-white rounded-2xl transition-all shadow-xl shadow-emerald-500/20 active:scale-90"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="h-5 w-5" /> : <Copy className="h-5 w-5" />}
                  </Button>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-2xl bg-white/[0.02] border border-white/5 mt-4">
                   <Info className="h-4 w-4 text-blue-400 mt-0.5" />
                   <p className="text-[10px] text-white/40 font-medium leading-relaxed">
                     O script deve ser injetado preferencialmente no rodapé da página para garantir <span className="text-white font-bold">zero latência</span> na renderização do conteúdo principal.
                   </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="clay-precision bg-[#002B4D]/50 backdrop-blur-xl border border-white/5 rounded-[3.5rem] overflow-hidden shadow-2xl sticky top-8">
            <div className="p-8 border-b border-white/5 bg-white/[0.01] flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="h-10 w-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                    <Smartphone className="h-5 w-5 text-emerald-500" />
                 </div>
                 <span className="text-sm font-black text-white uppercase tracking-tighter">Live Monitor</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                 <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Active Link</span>
              </div>
            </div>
            
            <div className="p-12 min-h-[450px] flex flex-col items-center justify-center relative bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]">
               <div className="absolute inset-0 bg-gradient-to-br from-[#002B4D]/80 to-[#0A0E17]/95" />
               <motion.div 
                key={`${theme}-${size}-${showRank}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 p-5 rounded-[2.5rem] bg-white/[0.03] border border-white/10 backdrop-blur-md shadow-3xl"
               >
                  <WidgetBadge companyData={mockCompanyData} theme={theme} />
               </motion.div>
               
               <div className="mt-12 text-center relative z-10 space-y-2">
                  <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Ambiente de Preview v8.2</p>
                  <div className="flex justify-center gap-2">
                     <Monitor className="h-4 w-4 text-white/10" />
                     <Smartphone className="h-4 w-4 text-white/10" />
                     <Layout className="h-4 w-4 text-white/10" />
                  </div>
               </div>
            </div>
            
            <div className="p-8 bg-black/40 border-t border-white/5">
                <Button className="w-full h-14 bg-white text-blue-600 font-black uppercase tracking-widest text-[11px] rounded-[1.5rem] hover:bg-white/90 active:scale-95 shadow-2xl">
                   Simular Integração
                   <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
          </Card>

          <Card className="clay-precision bg-gradient-to-br from-blue-600/20 to-emerald-500/20 border-none rounded-[2.5rem] p-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-20 transition-opacity">
                <ShieldCheck className="h-32 w-32 text-white" />
             </div>
             <h4 className="text-xl font-black text-white uppercase tracking-tighter mb-4 flex items-center gap-3">
               <Trophy className="h-6 w-6 text-amber-500" />
               Elite Distribution
             </h4>
             <p className="text-sm text-white/60 font-medium leading-relaxed mb-6">
               Sua empresa está operando com o protocolo de confiança <span className="text-white font-bold">Nível 1</span>. Ativos verificados aumentam a retenção de usuários no funil.
             </p>
             <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-black text-white/40 uppercase tracking-widest">
                   <span>Resonance Depth</span>
                   <span className="text-emerald-500">Peak Performance</span>
                </div>
                <Progress value={85} className="h-1.5 bg-white/5" />
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
