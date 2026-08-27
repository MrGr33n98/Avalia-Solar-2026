'use client';

import type { ReactNode } from 'react';
import { Lock, MapPin, Mail, Phone, Globe, Clock, ShieldAlert } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import type { FeatureAccessEntry } from '@/lib/api';
import { isFeatureEnabledEntry, isFeatureHiddenEntry } from '@/lib/feature-access';
import { cn } from '@/lib/utils';

interface FeatureGuardProps {
  entry?: FeatureAccessEntry | null;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
  featureId?: string;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

function MockLeadsList() {
  const mockLeads = [
    {
      id: 'mock-1',
      name: 'Carlos Henrique Silva',
      city: 'Campinas',
      state: 'SP',
      email: 'c.silva••••@gmail.com',
      phone: '(19) 998••-••••',
      segment: 'Residencial',
      message: 'Gostaria de um orçamento para instalação de painéis solares em minha residência de 150m². Consumo médio de R$ 600/mês.',
      isOpportunity: false,
      date: 'Hoje'
    },
    {
      id: 'mock-2',
      name: 'Condomínio Spazio',
      city: 'Rio de Janeiro',
      state: 'RJ',
      email: 'síndico••••@spazio.com.br',
      phone: '(21) 987••-••••',
      segment: 'Comercial/Condomínio',
      message: 'Busco proposta para instalação de sistema fotovoltaico na área comum do condomínio. Necessário homologação da concessionária.',
      isOpportunity: true,
      date: 'Ontem'
    },
    {
      id: 'mock-3',
      name: 'Mariana Costa',
      city: 'Belo Horizonte',
      state: 'MG',
      email: 'mari.costa••••@outlook.com',
      phone: '(31) 982••-••••',
      segment: 'Residencial',
      message: 'Tenho interesse em sistemas de microgeração distribuída. Gostaria de entender o payback e opções de financiamento.',
      isOpportunity: false,
      date: 'Há 2 dias'
    }
  ];

  return (
    <div className="space-y-6 w-full text-left">
      {/* Metric cards container */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Total na Categoria</p>
              <h3 className="text-3xl font-black mt-2 text-foreground dark:text-white">147</h3>
            </div>
            <div className="p-3 bg-brand-blue/10 rounded-xl text-brand-blue">
              <Globe className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Market Share</p>
              <h3 className="text-3xl font-black mt-2 text-foreground dark:text-white">0%</h3>
            </div>
            <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-500">
              <Clock className="h-5 w-5" />
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Oportunidades Perdidas</p>
              <h3 className="text-3xl font-black mt-2 text-foreground dark:text-white">23</h3>
            </div>
            <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500">
              <ShieldAlert className="h-5 w-5" />
            </div>
          </div>
        </div>
      </div>

      {/* Pipeline section */}
      <div className="space-y-4">
        <div>
          <h4 className="text-xl font-bold uppercase text-foreground dark:text-white">Pipeline de Vendas</h4>
          <p className="text-xs text-muted-foreground/60">Últimos leads recebidos na sua região</p>
        </div>

        {mockLeads.map((lead) => (
          <div 
            key={lead.id} 
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="flex-1 space-y-4">
                <div className="flex items-center flex-wrap gap-2">
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border ${
                    lead.isOpportunity 
                      ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                      : "bg-brand-blue/10 text-brand-blue border-brand-blue/20"
                  }`}>
                    {lead.isOpportunity ? 'Oportunidade Blind' : 'Lead Direto'}
                  </span>
                  <h5 className="font-bold text-lg text-foreground dark:text-white">
                    {lead.name}
                  </h5>
                  <span className="text-[10px] text-muted-foreground/50 ml-auto lg:ml-0 font-medium">
                    {lead.date}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Localização</span>
                    <div className="flex items-center gap-1 text-xs text-foreground/80 dark:text-white/70">
                      <MapPin className="h-3 w-3 text-slate-400" />
                      <span>{lead.city} - {lead.state}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">E-mail</span>
                    <div className="flex items-center gap-1 text-xs text-foreground/80 dark:text-white/70">
                      <Mail className="h-3 w-3 text-slate-400" />
                      <span>{lead.email}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Telefone</span>
                    <div className="flex items-center gap-1 text-xs text-foreground/80 dark:text-white/70">
                      <Phone className="h-3 w-3 text-slate-400" />
                      <span>{lead.phone}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400">Segmento</span>
                    <div className="flex items-center gap-1 text-xs text-foreground/80 dark:text-white/70">
                      <Globe className="h-3 w-3 text-slate-400" />
                      <span>{lead.segment}</span>
                    </div>
                  </div>
                </div>

                <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-lg border border-slate-100 dark:border-white/5">
                  <p className="text-xs text-slate-500 italic pr-6 leading-relaxed">
                    &quot;{lead.message}&quot;
                  </p>
                </div>
              </div>

              <div className="min-w-[150px] flex flex-col gap-2">
                <div className="px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold uppercase text-center text-slate-400 border border-slate-200 dark:border-slate-700">
                  Indisponível no plano
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function MockAnalyticsList() {
  return (
    <div className="space-y-6 w-full text-left">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Cliques no Link</p>
          <h3 className="text-3xl font-black mt-2 text-foreground dark:text-white">1,240</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Visualizações do Perfil</p>
          <h3 className="text-3xl font-black mt-2 text-foreground dark:text-white">4,890</h3>
        </div>
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/60">Conversão de Leads</p>
          <h3 className="text-3xl font-black mt-2 text-foreground dark:text-white">3.2%</h3>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-sm space-y-4">
        <div className="h-6 w-48 rounded-full bg-slate-200 dark:bg-white/10" />
        {/* Simulated Chart */}
        <div className="h-64 w-full flex items-end justify-between gap-2 pt-6 border-b border-slate-100 dark:border-white/5">
          {[40, 60, 45, 90, 120, 80, 110, 130, 95, 140, 160, 180].map((height, i) => (
            <div key={i} className="flex-1 bg-brand-blue/20 dark:bg-brand-cyan/20 rounded-t-lg transition-all duration-300" style={{ height: `${(height / 200) * 100}%` }} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function FeatureGuard({
  entry,
  title,
  description,
  children,
  className,
  loading,
  error,
  onRetry,
  featureId,
}: FeatureGuardProps) {
  if (loading) {
    return (
      <div className="space-y-6 w-full animate-pulse p-6 bg-slate-50 dark:bg-slate-950/20 rounded-3xl border border-slate-200 dark:border-white/10">
        <div className="h-8 w-64 rounded-xl bg-slate-200 dark:bg-white/10" />
        <div className="h-4 w-[350px] rounded-lg bg-slate-200 dark:bg-white/10" />
        <div className="grid gap-4 md:grid-cols-3 mt-6">
          <div className="h-28 rounded-2xl bg-slate-200 dark:bg-white/10" />
          <div className="h-28 rounded-2xl bg-slate-200 dark:bg-white/10" />
          <div className="h-28 rounded-2xl bg-slate-200 dark:bg-white/10" />
        </div>
        <div className="h-56 rounded-3xl bg-slate-200 dark:bg-white/10 mt-4" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full flex flex-col items-center justify-center p-8 bg-slate-50 dark:bg-slate-950/20 rounded-3xl border border-slate-200 dark:border-white/10 text-center min-h-[300px]">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-rose-100 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400 mb-4">
          <ShieldAlert className="h-6 w-6" />
        </div>
        <h3 className="text-lg font-bold text-foreground mb-2">Erro ao carregar permissões</h3>
        <p className="text-sm text-muted-foreground max-w-md mb-6 leading-relaxed">
          Não foi possível verificar os recursos do seu plano. Se o problema continuar, atualize a página.
        </p>
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-6 py-2.5 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-bold text-xs uppercase tracking-wider shadow-md transition-all"
          >
            Tentar novamente
          </button>
        )}
      </div>
    );
  }

  if (isFeatureHiddenEntry(entry)) return null;
  if (entry && isFeatureEnabledEntry(entry)) return <>{children}</>;

  return (
    <div className={cn('relative w-full overflow-hidden rounded-3xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-slate-950/20', className)}>
      {/* Blurred Background Content */}
      <div className="pointer-events-none select-none p-6 blur-[8px] opacity-40 transition-all duration-300">
        {featureId === 'leads' ? (
          <MockLeadsList />
        ) : featureId === 'analytics' ? (
          <MockAnalyticsList />
        ) : (
          <div className="space-y-4">
            <div className="h-6 w-48 rounded-full bg-slate-200 dark:bg-white/10" />
            <div className="grid gap-4 md:grid-cols-3">
              <div className="h-28 rounded-2xl bg-slate-200 dark:bg-white/10" />
              <div className="h-28 rounded-2xl bg-slate-200 dark:bg-white/10" />
              <div className="h-28 rounded-2xl bg-slate-200 dark:bg-white/10" />
            </div>
            <div className="h-56 rounded-3xl bg-slate-200 dark:bg-white/10" />
          </div>
        )}
      </div>

      {/* Absolute Overlaid Lock Card */}
      <div className="absolute inset-0 flex items-center justify-center p-4 md:p-6 bg-slate-900/10 dark:bg-black/20 backdrop-blur-[2px]">
        <Card className="max-w-md border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#002B4D]/95 text-slate-900 dark:text-white shadow-2xl backdrop-blur-md">
          <CardContent className="flex flex-col gap-4 p-6">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-blue/10 dark:bg-white/10 text-brand-blue dark:text-brand-cyan">
                <Lock className="h-6 w-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-lg font-bold tracking-tight uppercase">{title}</h3>
                <p className="text-sm text-slate-600 dark:text-white/60 leading-relaxed">{description}</p>
              </div>
            </div>
            
            <div className="h-[1px] w-full bg-slate-100 dark:bg-white/10" />
            
            <p className="text-xs font-semibold text-slate-500 dark:text-white/70">
              {entry?.upsell_copy || 'Disponivel mediante upgrade de plano.'}
            </p>

            <button 
              onClick={() => window.location.href = '/pricing'}
              className="w-full mt-2 h-11 rounded-xl bg-brand-blue hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-[10px] shadow-lg transition-all flex items-center justify-center gap-2"
            >
              Fazer Upgrade Agora
            </button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
