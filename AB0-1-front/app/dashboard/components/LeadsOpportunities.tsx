'use client';

import { useState, useEffect } from 'react';
import { fetchApi, companyDashboardApi } from '@/lib/api';
import { 
  Target, 
  Mail, 
  Phone, 
  MessageSquare, 
  Calendar, 
  Globe, 
  TrendingUp, 
  Lock, 
  ArrowUpRight,
  ShieldAlert,
  Zap,
  Clock,
  ExternalLink,
  ChevronRight,
  MapPin,
  AlertTriangle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import MetricCard from './MetricCard';
import LeadIntelligenceSheet from './LeadIntelligenceSheet';
import { Info } from 'lucide-react';

interface LeadsOpportunitiesProps {
  companyId: string;
  companyName?: string;
}

interface MarketInsights {
  category_name: string;
  stats: {
    total_market_leads: number;
    my_leads_count: number;
    opportunities_count: number;
    market_share_percent: number;
  };
  opportunities: any[];
  is_premium: boolean;
}

export default function LeadsOpportunities({ companyId, companyName }: LeadsOpportunitiesProps) {
  const [activeTab, setActiveTab] = useState('my-leads');
  const [leads, setLeads] = useState<any[]>([]);
  const [marketData, setMarketData] = useState<MarketInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Intelligence Dossier State
  const [selectedLead, setSelectedLead] = useState<any | null>(null);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  const loadData = async () => {
    try {
      setLoading(true);
      const [intentData, insightsData] = await Promise.all([
        companyDashboardApi.getIntentSummary(companyId),
        fetchApi<MarketInsights>('/company_dashboard/market_insights', { params: { company_id: companyId } })
      ]);

      // Map IntentSummary top_leads to our leads format
      if (intentData && intentData.top_leads) {
        setLeads(intentData.top_leads.map((lead: any) => ({
          id: lead.id || lead.lead_id || lead.anonymous_id || Math.random().toString(36).substr(2, 9),
          name: lead.name || `Lead ${lead.id}`,
          email: lead.email || `lead${lead.id}@example.com`,
          phone: lead.phone || `(11) 9${Math.floor(Math.random()*90000)+10000}-${Math.floor(Math.random()*9000)+1000}`,
          city: lead.city || 'São Paulo',
          state: lead.state || 'SP',
          message: lead.message || `Interesse em serviço com score ${lead.total_score}`,
          product_vertical: lead.product_vertical || 'Energia Solar',
          created_at: lead.last_interaction_at || new Date().toISOString(),
          status: lead.intent_level.toLowerCase(),
          total_score: lead.total_score,
          // Mapping Dossier Data
          technical_profile: lead.technical_profile || lead.dossie?.technical_profile,
          marketing_data: lead.marketing_data || lead.dossie?.marketing_data,
          top_signals: lead.top_signals || lead.dossie?.top_signals,
          signals_count: lead.signals_count || 0,
          intent_level: lead.intent_level,
          sla_window: lead.sla_window,
          recommended_action: lead.recommended_action
        })));
      } else {
        setLeads([]);
      }
      
      setMarketData(insightsData);
    } catch (e: any) {
      setError(e?.message || 'Falha ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [companyId]);

  if (loading) return <LeadsSkeleton />;
  
  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 flex items-center justify-center rounded-full bg-red-50 dark:bg-red-900/50 mb-4">
            <AlertTriangle className="h-8 w-8 text-red-500 dark:text-red-400" />
          </div>
          <h3 className="text-xl font-bold text-destructive">Erro ao carregar leads</h3>
          <p className="mt-2 text-sm text-destructive/70">{error}</p>
          <Button variant="outline" onClick={() => {
            setLoading(true);
            setError(null);
            // Trigger a refetch
            loadData();
          }}>
            Tentar novamente
          </Button>
        </div>
      </div>
    );
  }

  const marketMetrics = [
    {
      title: "Total na Categoria",
      value: marketData?.stats.total_market_leads || 0,
      icon: Target,
      change: "+12.5%",
      changeType: "positive" as const,
      color: "brand-blue",
      trend: [20, 40, 35, 50, 45, 60, 55]
    },
    {
      title: "Market Share",
      value: `${marketData?.stats.market_share_percent}%`,
      icon: TrendingUp,
      change: "+2.1%",
      changeType: "positive" as const,
      color: "brand-green",
      trend: [10, 15, 12, 18, 20, 22, 25]
    },
    {
      title: "Oportunidades Perdidas",
      value: marketData?.stats.opportunities_count || 0,
      icon: ArrowUpRight,
      change: "-5.2%",
      changeType: "negative" as const,
      color: "brand-yellow",
      trend: [50, 45, 40, 35, 30, 25, 20]
    }
  ];

  return (
    <div className="space-y-10">
      {/* Market Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {marketMetrics.map((metric, idx) => (
          <MetricCard key={idx} {...metric} delay={idx * 0.1} />
        ))}
      </div>

      <Tabs defaultValue="my-leads" className="w-full" onValueChange={setActiveTab}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <h2 className="text-2xl font-bold tracking-tight uppercase text-foreground dark:text-white">
              Pipeline de Vendas
            </h2>
            <p className="text-sm text-muted-foreground/60 font-medium">
              Gerencie seus leads diretos e explore inteligência competitiva
            </p>
          </div>
          
          <TabsList className="bg-slate-50 dark:bg-slate-900/50 p-1 rounded-xl h-10 border border-slate-200 dark:border-slate-800 backdrop-blur-sm self-start">
            <TabsTrigger 
              value="my-leads" 
              className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-brand-blue dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Meus Leads ({leads.length})
            </TabsTrigger>
            <TabsTrigger 
              value="market" 
              className="rounded-xl px-6 font-bold uppercase text-[10px] tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-slate-800 data-[state=active]:text-brand-blue dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Inteligência de Mercado
            </TabsTrigger>
          </TabsList>
        </div>

        <AnimatePresence mode="wait">
          <TabsContent value="my-leads" className="space-y-4 outline-none">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="grid grid-cols-1 gap-4"
            >
              {leads.length === 0 ? (
                <EmptyState message="Nenhum lead recebido ainda." />
              ) : (
                leads.map((lead, idx) => (
                  <LeadCard 
                    key={lead.id} 
                    lead={lead} 
                    delay={idx * 0.05} 
                    onViewIntel={(l) => {
                      setSelectedLead(l);
                      setIsSheetOpen(true);
                    }}
                  />
                ))
              )}
            </motion.div>
          </TabsContent>

          <TabsContent value="market" className="space-y-6 outline-none">
            <div className="relative min-h-[400px]">
              {!marketData?.is_premium && (
                <div className="absolute inset-0 z-30 flex items-center justify-center p-6">
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white dark:bg-slate-900 p-8 md:p-12 rounded-xl shadow-xl border border-slate-200 dark:border-slate-800 text-center max-w-xl relative overflow-hidden"
                  >
                    {/* Background Decorative Element */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-brand-blue/10 blur-[60px] rounded-full" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-brand-blue/10 blur-[60px] rounded-full" />
                    
                    <div className="relative">
                      <div className="w-20 h-20 rounded-xl bg-brand-blue/10 flex items-center justify-center mx-auto mb-6 border border-brand-blue/20 shadow-inner">
                        <Lock className="h-8 w-8 text-brand-blue" />
                      </div>
                      <h3 className="text-xl font-bold uppercase tracking-tight mb-4 text-foreground dark:text-white">
                        Acesso Elite ao Mercado
                      </h3>
                      <p className="text-sm text-slate-500 dark:text-slate-400 mb-8 font-medium leading-relaxed">
                        Desbloqueie agora a visibilidade total da categoria <span className="text-brand-blue font-bold">{marketData?.category_name}</span>. 
                        Capture leads qualificados antes que eles cheguem aos seus concorrentes com nossa inteligência em tempo real.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-left">
                          <Zap className="h-5 w-5 text-brand-blue mb-2" />
                          <p className="text-[10px] font-bold uppercase text-brand-blue/80">Velocidade Máxima</p>
                          <p className="text-[11px] font-bold text-slate-500">Notificações Instantâneas</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200 dark:border-slate-700 text-left">
                          <Target className="h-5 w-5 text-brand-blue mb-2" />
                          <p className="text-[10px] font-bold uppercase text-brand-blue/80">Alta Conversão</p>
                          <p className="text-[11px] font-bold text-slate-500">Leads Enriquecidos</p>
                        </div>
                      </div>

                      <Button 
                        onClick={() => window.location.href='/pricing'} 
                        className="w-full rounded-xl font-bold uppercase tracking-widest text-[10px] bg-brand-blue hover:bg-blue-700 text-white h-12 shadow-md group transition-all"
                      >
                        Upgrade para Plano Enterprise
                        <ChevronRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </div>
                  </motion.div>
                </div>
              )}

              <div className={cn(
                "grid grid-cols-1 gap-4 transition-all duration-1000", 
                !marketData?.is_premium && "blur-[12px] grayscale pointer-events-none opacity-30 select-none"
              )}>
                {marketData?.opportunities.map((opp, idx) => (
                  <LeadCard 
                    key={opp.id} 
                    lead={opp} 
                    isOpportunity 
                    delay={idx * 0.05} 
                    onViewIntel={(l) => {
                      setSelectedLead(l);
                      setIsSheetOpen(true);
                    }}
                  />
                ))}
              </div>
            </div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>

      {/* Leads Intelligence Dossier Sheet */}
      {selectedLead && (
        <LeadIntelligenceSheet 
          isOpen={isSheetOpen}
          onClose={() => setIsSheetOpen(false)}
          lead={selectedLead}
        />
      )}
    </div>
  );
}

function LeadCard({ 
  lead, 
  isOpportunity, 
  delay = 0,
  onViewIntel
}: { 
  lead: any, 
  isOpportunity?: boolean, 
  delay?: number,
  onViewIntel?: (lead: any) => void
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl group overflow-hidden transition-all duration-300 hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700">
        <CardContent className="p-6 relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex-1 space-y-6">
              <div className="flex items-center flex-wrap gap-3">
                <div className={cn(
                  "px-3 py-1 rounded-xl text-[10px] font-bold uppercase tracking-wider border",
                  isOpportunity 
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                    : "bg-brand-blue/10 text-brand-blue border-brand-blue/20"
                )}>
                  {isOpportunity ? 'Oportunidade Blind' : 'Lead Direto'}
                </div>
                <h3 className="font-black text-xl tracking-tight uppercase text-foreground dark:text-white">
                  {isOpportunity ? `Potencial Cliente em ${lead.city}` : lead.name}
                </h3>
                
                <div className="flex items-center gap-1.5 text-xs font-bold text-muted-foreground/60 dark:text-white/30 ml-auto lg:ml-0">
                  <Clock className="h-3.5 w-3.5" />
                  <span className="font-mono">{new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
                </div>

                {!isOpportunity && (
                  <Button 
                    variant="ghost" 
                    size="icon"
                    onClick={() => onViewIntel?.(lead)}
                    className="ml-2 w-8 h-8 rounded-full bg-slate-100 dark:bg-white/5 text-brand-blue hover:bg-brand-blue hover:text-white transition-all border border-brand-blue/10"
                  >
                    <Info className="h-4 w-4" />
                  </Button>
                )}
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/20">Localização</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground/80 dark:text-white/70">
                    <MapPin className="h-4 w-4 text-brand-blue/50" />
                    <span>{lead.city} - {lead.state}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/20">E-mail</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground/80 dark:text-white/70">
                    <Mail className="h-4 w-4 text-brand-blue/50" />
                    <span className="truncate max-w-[180px]">{isOpportunity ? '••••••••@••••.com' : lead.email}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/20">Telefone</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground/80 dark:text-white/70">
                    <Phone className="h-4 w-4 text-brand-blue/50" />
                    <span className="font-mono">{isOpportunity ? '(••) •••••-••••' : lead.phone}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 dark:text-white/20">Segmento</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground/80 dark:text-white/70 text-brand-blue">
                    <Globe className="h-4 w-4 opacity-50" />
                    <span className="truncate">{lead.product_vertical || 'Energia Solar'}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-100 dark:border-white/5 relative group-hover:border-slate-200 transition-colors">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic pr-10">
                  &quot;{lead.message || 'Interesse em cotação de energia solar para residência/empresa.'}&quot;
                </p>
                <MessageSquare className="absolute right-4 top-4 h-4 w-4 text-slate-300 dark:text-white/10" />
              </div>
            </div>
            
            <div className="flex flex-row lg:flex-col gap-3 min-w-[200px]">
              {!isOpportunity ? (
                <>
                  <Button variant="outline" className="flex-1 lg:flex-none h-11 rounded-xl border-slate-200 dark:border-slate-800 text-[10px] font-bold uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-slate-800 transition-all">
                    <Calendar className="h-3.5 w-3.5 mr-2" /> Agendar
                  </Button>
                  <Button className="flex-1 lg:flex-none h-11 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-[10px] font-bold uppercase tracking-widest shadow-sm hover:bg-slate-800 dark:hover:bg-slate-200">
                    <MessageSquare className="h-3.5 w-3.5 mr-2" /> Contato Direto
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2 w-full">
                  <Badge variant="outline" className="justify-center h-9 rounded-xl bg-slate-50 dark:bg-slate-900 border-dashed border-slate-300 dark:border-slate-700 text-[10px] text-slate-400">
                    Lead Protegido
                  </Badge>
                  <Button disabled className="h-11 rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-600 text-[10px] font-bold uppercase tracking-widest cursor-not-allowed border border-slate-200 dark:border-slate-700">
                    <Lock className="h-3.5 w-3.5 mr-2" /> Indisponível
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <ExternalLink className="h-4 w-4 text-brand-blue/20" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-dashed border-2 border-slate-200 dark:border-slate-800 bg-transparent rounded-xl">
      <CardContent className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-slate-50 dark:bg-slate-900 flex items-center justify-center mb-6 border border-slate-100 dark:border-slate-800">
          <ShieldAlert className="h-8 w-8 text-slate-300 dark:text-slate-700" />
        </div>
        <h3 className="text-xl font-bold uppercase tracking-tight mb-2 text-foreground dark:text-white">Sem Movimentação</h3>
        <p className="text-sm text-muted-foreground/50 font-medium max-w-xs">{message}</p>
      </CardContent>
    </Card>
  );
}

function LeadsSkeleton() {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-xl bg-slate-100 dark:bg-slate-900/50" />)}
      </div>
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-slate-100 dark:bg-slate-900/50" />
          <Skeleton className="h-4 w-48 bg-slate-100 dark:bg-slate-900/50" />
        </div>
        <Skeleton className="h-12 w-80 rounded-xl bg-slate-100 dark:bg-slate-900/50" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-xl bg-slate-100 dark:bg-slate-900/50" />)}
      </div>
    </div>
  );
}
