'use client';

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Award, 
  Copy, 
  ExternalLink, 
  ShieldCheck, 
  Trophy, 
  Check, 
  Zap, 
  Info,
  Layers,
  Activity,
  UserCheck,
  Diamond
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge as UIBadge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';
import { Badge, badgesApi } from '@/lib/api';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { cn } from '@/lib/utils';
import MetricCard from './MetricCard';
import PremiumBadge from '@/components/PremiumBadge';

interface BadgesManagementProps {
  companyId: string | number;
}

export default function BadgesManagement({ companyId }: BadgesManagementProps) {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    async function loadBadges() {
      try {
        setLoading(true);
        const data = await badgesApi.getByCompany(companyId);
        setBadges(data);
      } catch (error) {
        console.error('Error loading badges:', error);
      } finally {
        setLoading(false);
      }
    }
    loadBadges();
  }, [companyId]);

  const copyToClipboard = (text: string, id: number, type: 'url' | 'snippet') => {
    if (typeof window !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(id);
      toast.success(type === 'url' ? 'Link de autoridade copiado!' : 'Snippet HTML sincronizado!');
      setTimeout(() => setCopiedId(null), 2000);
    }
  };

  if (loading) {
    return (
      <div className="space-y-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
             <Skeleton key={i} className="h-32 rounded-xl bg-white/[0.03]" />
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-[450px] w-full rounded-xl bg-white/[0.03]" />
          ))}
        </div>
      </div>
    );
  }

  const verifiableCount = badges.filter(b => b.verifiable_url).length;

  return (
    <div className="space-y-12">
      {/* Strategic Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-primary mb-1">
            <Award className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Authority Assets</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase text-slate-900 dark:text-white leading-none">
            Distinction <span className="text-primary">Vault</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-white/40 max-w-md font-medium leading-relaxed">
            Gerencie seus ativos de autoridade técnica e selos de distinção oficial do Avalia Solar.
          </p>
        </div>
        
        <div className="flex gap-4 p-2 bg-slate-100 dark:bg-white/[0.02] border border-slate-200 dark:border-white/5 rounded-xl backdrop-blur-sm">
           <div className="px-4 py-2 border-r border-slate-200 dark:border-white/5">
              <p className="text-[10px] font-black text-slate-500 dark:text-white/30 uppercase tracking-widest mb-1">Status de Rede</p>
              <div className="flex items-center gap-2 text-brand-green font-bold text-xs">
                 <div className="w-1.5 h-1.5 rounded-full bg-brand-green animate-pulse" />
                 Sincronizado
              </div>
           </div>
           <Button variant="ghost" className="h-10 text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-white/40 hover:text-slate-900 dark:hover:text-white">
              Sugerir Novo Selo
           </Button>
        </div>
      </div>

      {/* KPI Matrix for Badges */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard
          title="Ativos no Vault"
          value={badges.length.toString()}
          icon={Layers}
        />
        <MetricCard
          title="Selo Premium Ativo"
          value={verifiableCount.toString()}
          icon={Diamond}
          color="blue"
        />
        <MetricCard
          title="Poder de Conversão"
          value="+18%"
          icon={Zap}
        />
      </div>

      {badges.length === 0 ? (
        <Card className="clay-precision bg-slate-50 dark:bg-white/[0.01] border-dashed border-2 border-slate-200 dark:border-white/5 rounded-xl overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-32 text-center">
            <div className="h-24 w-24 rounded-xl bg-slate-100 dark:bg-white/5 flex items-center justify-center mb-8 relative">
               <Award className="h-10 w-10 text-slate-400 dark:text-white/20" />
               <div className="absolute inset-0 bg-primary/5 blur-2xl rounded-full" />
            </div>
            <h3 className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-2">Protocolo de Distinção Vazio</h3>
            <p className="text-sm text-slate-500 dark:text-white/30 font-medium max-w-xs mb-8">
              Sua empresa ainda não possui selos de distinção atribuídos pela nossa inteligência de mercado.
            </p>
            <Button variant="outline" className="h-12 border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 hover:bg-slate-50 dark:hover:bg-white/10 text-slate-900 dark:text-white font-black uppercase tracking-widest text-[10px] rounded-xl px-10">
               Solicitar Avaliação Técnica
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {badges.map((badge, index) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="clay-precision bg-white dark:bg-[#002B4D]/50 backdrop-blur-xl border border-slate-200 dark:border-transparent rounded-xl overflow-hidden group transition-all duration-500 hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-2 h-full flex flex-col">
                  {/* Visual Preview */}
                  <div className="h-56 relative flex items-center justify-center overflow-hidden border-b border-slate-200 dark:border-white/5 bg-slate-50 dark:bg-[length:100%_100%] dark:bg-gradient-to-br dark:from-white/[0.03] dark:to-transparent">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.1),transparent)] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                    <OptimizedImage
                      src={badge.image_url || ''}
                      alt={badge.name}
                      width={160}
                      height={160}
                      className="object-contain drop-shadow-[0_0_30px_rgba(255,255,255,0.1)] group-hover:drop-shadow-[0_0_40px_rgba(59,130,246,0.2)] group-hover:scale-110 transition-all duration-700 relative z-10"
                    />
                    <div className="absolute top-6 right-6">
                       <UIBadge className="bg-primary/10 text-primary border-none font-black text-[8px] uppercase tracking-widest py-1 px-3">
                         {badge.category || 'EXCELLENCE'}
                       </UIBadge>
                    </div>
                  </div>

                  <CardHeader className="p-8 pb-4">
                    <CardTitle className="text-2xl font-black text-slate-900 dark:text-white uppercase tracking-tighter mb-2 group-hover:text-primary transition-colors">
                      {badge.name}
                    </CardTitle>
                    <CardDescription className="text-sm font-medium text-slate-500 dark:text-white/40 leading-relaxed min-h-[48px] line-clamp-3">
                      {badge.description || 'Ativo de autoridade técnica oficial concedido pelo ecossistema Avalia Solar para empresas líderes.'}
                    </CardDescription>
                  </CardHeader>

                  <CardContent className="p-8 pt-0 mt-auto space-y-6">
                    {/* Integrated Distribution */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                         <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 dark:text-white/30">Protocolo de Incorporação</label>
                         <ShieldCheck className="h-3.5 w-3.5 text-brand-green/50" />
                      </div>
                      <div className="relative group/snippet">
                        <pre className="p-4 bg-slate-100 dark:bg-black/40 text-blue-600 dark:text-blue-400 rounded-xl text-[10px] overflow-hidden border border-slate-200 dark:border-white/5 leading-relaxed font-mono select-all">
                          {`<a href="${badge.verifiable_url || ''}"><img src="${badge.image_url || ''}" width="150" alt="${badge.name}" /></a>`}
                        </pre>
                        <Button
                          size="icon"
                          variant="ghost"
                          className="absolute right-2 top-2 h-10 w-10 bg-white border border-slate-200 dark:bg-white/5 dark:border-transparent hover:bg-primary hover:text-white rounded-xl text-slate-500 dark:text-white/30 transition-all opacity-0 group-hover/snippet:opacity-100"
                          onClick={() => copyToClipboard(
                            `<a href="${badge.verifiable_url || ''}"><img src="${badge.image_url || ''}" width="150" alt="${badge.name}" /></a>`,
                            badge.id,
                            'snippet'
                          )}
                        >
                          {copiedId === badge.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3">
                        <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-11 rounded-xl border-slate-200 dark:border-white/5 bg-white dark:bg-white/[0.02] hover:bg-slate-50 dark:hover:bg-white/[0.05] text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-white/60 hover:text-slate-900 dark:hover:text-white"
                        onClick={() => copyToClipboard(badge.image_url || '', badge.id, 'url')}
                      >
                        <Activity className="h-3.5 w-3.5 mr-2" />
                        Source Link
                      </Button>
                      <Button asChild size="sm" className="h-11 rounded-xl bg-primary border-none text-white dark:bg-white/[0.02] dark:border dark:border-white/5 hover:bg-primary/90 dark:hover:bg-primary dark:text-white text-[10px] font-black uppercase tracking-widest transition-all">
                        <a href={badge.verifiable_url} target="_blank" rel="noreferrer">
                          <ExternalLink className="h-3.5 w-3.5 mr-2" />
                          Authority
                        </a>
                      </Button>
                    </div>
                  </CardContent>
                  
                  {/* Status Bar */}
                  <div className="px-8 py-4 bg-slate-50 dark:bg-white/[0.01] border-t border-slate-200 dark:border-white/5 flex items-center justify-between">
                     <div className="flex items-center gap-2">
                        <PremiumBadge size="xs" />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-white/30">ATIVO PREMIUM</span>
                     </div>
                     <Trophy className="h-3 w-3 text-amber-500/30" />
                  </div>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
      
      {/* Strategic Insight Footer */}
      <div className="p-8 rounded-xl bg-gradient-to-r from-primary/10 to-transparent border border-slate-200 dark:border-white/5 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-10">
            <Info className="h-24 w-24 text-primary" />
         </div>
         <div className="max-w-2xl relative z-10">
            <h4 className="text-base font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2">Alavancagem de Autoridade</h4>
            <p className="text-sm text-slate-600 dark:text-white/50 leading-relaxed font-medium">
              A exibição destes ativos em seu site institucional aumenta em média <span className="text-slate-900 dark:text-white font-black underline decoration-primary">32% a taxa de conversão</span> de leads orgânicos, ao reduzir a fricção de confiança na fase de descoberta.
            </p>
         </div>
      </div>
    </div>
  );
}
