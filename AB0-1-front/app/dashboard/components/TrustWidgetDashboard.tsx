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
          <div className="flex items-center gap-2 text-brand-green mb-1">
            <Globe className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Distribuição de Confiança</span>
          </div>
          <h2 className="text-3xl font-bold tracking-tight uppercase text-slate-900 dark:text-white leading-none">
            Widget de <span className="text-brand-blue">Confiança</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-white/40 max-w-lg font-medium leading-relaxed">
            Distribua sua prova social e reputação certificada em tempo real para qualquer endpoint externo através de nosso protocolo de widget assíncrono.
          </p>
        </div>
        
        <div className="flex items-center gap-4">
           <div className="h-14 w-14 rounded-xl bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 flex items-center justify-center">
              <Code2 className="h-6 w-6 text-slate-400 dark:text-white/20" />
           </div>
           <div>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">API Protocol</p>
              <Badge className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border-slate-200 dark:border-slate-700 font-bold text-[9px] px-3">ACTIVE v2.4</Badge>
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
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <CardHeader className="p-8 border-b border-slate-100 dark:border-slate-800">
              <CardTitle className="text-lg font-bold text-slate-900 dark:text-white uppercase tracking-tight">Configuração de Interface</CardTitle>
              <CardDescription className="text-sm text-slate-500 font-medium">Personalize os parâmetros de visualização do seu nó de autoridade.</CardDescription>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              {/* Theme Selector */}
              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Esquema Digital (Tema)</Label>
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => setTheme('light')}
                    className={cn(
                      "group h-12 rounded-lg border transition-all flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest",
                      theme === 'light' 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400"
                    )}
                  >
                    <div className={cn("w-2 h-2 rounded-full", theme === 'light' ? "bg-primary" : "bg-slate-300 dark:bg-white/20")} />
                    Light Protocol
                  </button>
                  <button 
                    onClick={() => setTheme('dark')}
                    className={cn(
                      "group h-12 rounded-lg border transition-all flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest",
                      theme === 'dark' 
                        ? "bg-brand-blue text-white border-brand-blue shadow-sm" 
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400"
                    )}
                  >
                    <div className={cn("w-2 h-2 rounded-full", theme === 'dark' ? "bg-white" : "bg-slate-300")} />
                    Silicon Dark
                  </button>
                </div>
              </div>

              {/* Size Selector */}
              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Escala de Renderização</Label>
                <div className="grid grid-cols-3 gap-4">
                  {(['small', 'medium', 'large'] as const).map((s) => (
                    <button 
                      key={s}
                      onClick={() => setSize(s)}
                      className={cn(
                        "h-12 rounded-lg border transition-all text-[10px] font-bold uppercase tracking-widest",
                        size === s 
                          ? "bg-slate-900 text-white border-slate-900" 
                          : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400"
                      )}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Ranking View */}
              <div className="space-y-4">
                <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Visualização de Elite</Label>
                <div className="flex gap-4">
                  <button 
                    onClick={() => setShowRank(true)} 
                    className={cn(
                      "flex-1 h-12 rounded-lg border transition-all flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest",
                      showRank 
                        ? "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-500 dark:border-amber-500/30" 
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400"
                    )}
                  >
                    <Trophy className={cn("w-4 h-4", showRank ? "fill-amber-500/20" : "")} />
                    Exibir Ranking
                  </button>
                  <button 
                    onClick={() => setShowRank(false)} 
                    className={cn(
                      "flex-1 h-12 rounded-lg border transition-all flex items-center justify-center gap-3 font-bold text-xs uppercase tracking-widest",
                      !showRank 
                        ? "bg-slate-900 text-white border-slate-900" 
                        : "bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100 dark:bg-slate-800/50 dark:border-slate-700 dark:text-slate-400"
                    )}
                  >
                    Apenas Reputação
                  </button>
                </div>
              </div>

              {/* Code Snippet */}
              <div className="pt-8 mt-8 border-t border-slate-100 dark:border-slate-800 space-y-4">
                <div className="flex items-center justify-between">
                   <Label className="text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-1">Pipeline Snippet (HTML/JS)</Label>
                   <Badge variant="outline" className="border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-[8px] font-bold">X64 ENCRYPTED</Badge>
                </div>
                <div className="relative group/snippet overflow-hidden">
                  <pre className="p-6 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-300 rounded-xl text-[11px] overflow-x-auto border border-slate-200 dark:border-slate-800 leading-relaxed font-mono shadow-inner scrollbar-hide">
                    {snippet}
                  </pre>
                  <div className="absolute inset-y-0 right-0 w-24 bg-gradient-to-l from-slate-50 dark:from-slate-950 to-transparent pointer-events-none group-hover/snippet:opacity-0 transition-opacity" />
                  <Button
                    size="icon"
                    className="absolute top-4 right-4 h-10 w-10 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 rounded-lg transition-all shadow-md hover:bg-slate-800 dark:hover:bg-slate-200 active:scale-90"
                    onClick={handleCopy}
                  >
                    {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  </Button>
                </div>
                <div className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 mt-4">
                   <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                   <p className="text-[10px] text-slate-500 font-medium leading-relaxed">
                     O script deve ser injetado preferencialmente no rodapé da página para garantir <span className="text-slate-900 dark:text-white font-bold">zero latência</span> na renderização do conteúdo principal.
                   </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Preview Column */}
        <div className="lg:col-span-5 space-y-8">
          <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden shadow-sm sticky top-8">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <div className="h-9 w-9 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                    <Smartphone className="h-4 w-4 text-slate-600 dark:text-slate-400" />
                 </div>
                 <span className="text-sm font-bold text-slate-900 dark:text-white uppercase tracking-tight">Monitor em Tempo Real</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-brand-green animate-pulse" />
                 <span className="text-[10px] font-bold text-brand-green uppercase tracking-widest">Active Link</span>
              </div>
            </div>
            
            <div className="p-12 min-h-[400px] flex flex-col items-center justify-center relative bg-slate-100 dark:bg-slate-950">
               <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(#0056d2 0.5px, transparent 0.5px)", backgroundSize: "10px 10px" }} />
               <motion.div 
                key={`${theme}-${size}-${showRank}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="relative z-10 p-4 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
               >
                  <WidgetBadge companyData={mockCompanyData} theme={theme} />
               </motion.div>
                              <div className="mt-8 text-center relative z-10 space-y-2">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Ambiente de Preview v8.2</p>
                   <div className="flex justify-center gap-3">
                     <Monitor className="h-4 w-4 text-slate-300" />
                     <Smartphone className="h-4 w-4 text-slate-300" />
                     <Layout className="h-4 w-4 text-slate-300" />
                   </div>
               </div>
            </div>
            
            <div className="p-6 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
                <Button className="w-full h-12 bg-slate-900 dark:bg-white text-white dark:text-slate-900 font-bold uppercase tracking-widest text-[10px] rounded-lg hover:bg-slate-800 dark:hover:bg-slate-200 active:scale-95 shadow-sm">
                   Simular Integração
                   <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
            </div>
          </Card>

          <Card className="bg-slate-900 dark:bg-slate-800 border-none rounded-xl p-8 relative overflow-hidden group">
             <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShieldCheck className="h-24 w-24 text-white" />
             </div>
             <h4 className="text-xl font-bold text-white uppercase tracking-tight mb-4 flex items-center gap-3">
               <Trophy className="h-6 w-6 text-amber-500" />
               Elite Distribution
             </h4>
             <p className="text-sm text-slate-400 font-medium leading-relaxed mb-6">
               Sua empresa está operando com o protocolo de confiança <span className="text-white font-bold">Nível 1</span>. Ativos Premium aumentam a retenção de usuários no funil.
             </p>
             <div className="space-y-4">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 uppercase tracking-widest">
                   <span>Resonance Depth</span>
                   <span className="text-brand-green">Peak Performance</span>
                </div>
                <Progress value={85} className="h-1.5 bg-white/5" />
             </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
