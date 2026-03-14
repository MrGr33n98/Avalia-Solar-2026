'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
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
  MapPin
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import MetricCard from './MetricCard';

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

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [leadsData, insightsData] = await Promise.all([
          fetchApi<any[]>('/leads', { params: { company_id: companyId } }),
          fetchApi<MarketInsights>('/company_dashboard/market_insights', { params: { company_id: companyId } })
        ]);

        setLeads(Array.isArray(leadsData) ? leadsData : []);
        setMarketData(insightsData);
      } catch (e: any) {
        setError(e?.message || 'Falha ao carregar dados');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [companyId]);

  if (loading) return <LeadsSkeleton />;

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
            <h2 className="text-2xl font-black tracking-tight uppercase text-foreground dark:text-white">
              Pipeline de Vendas
            </h2>
            <p className="text-sm text-muted-foreground/60 font-medium">
              Gerencie seus leads diretos e explore inteligência competitiva
            </p>
          </div>
          
          <TabsList className="bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl h-12 border border-slate-200 dark:border-white/5 backdrop-blur-sm self-start">
            <TabsTrigger 
              value="my-leads" 
              className="rounded-lg px-6 font-bold uppercase text-[10px] tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
            >
              Meus Leads ({leads.length})
            </TabsTrigger>
            <TabsTrigger 
              value="market" 
              className="rounded-lg px-6 font-bold uppercase text-[10px] tracking-widest transition-all data-[state=active]:bg-white dark:data-[state=active]:bg-blue-600 data-[state=active]:text-blue-600 dark:data-[state=active]:text-white data-[state=active]:shadow-sm"
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
                  <LeadCard key={lead.id} lead={lead} delay={idx * 0.05} />
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
                    className="bg-white dark:bg-slate-900/95 p-8 md:p-12 rounded-[2rem] shadow-2xl border border-blue-500/20 text-center max-w-xl backdrop-blur-xl relative overflow-hidden"
                  >
                    {/* Background Decorative Element */}
                    <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-600/10 blur-[60px] rounded-full" />
                    <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-600/10 blur-[60px] rounded-full" />
                    
                    <div className="relative">
                      <div className="w-20 h-20 rounded-3xl bg-blue-600/10 flex items-center justify-center mx-auto mb-6 border border-blue-600/20 shadow-inner">
                        <Lock className="h-10 w-10 text-blue-600" />
                      </div>
                      <h3 className="text-2xl font-black uppercase tracking-tighter mb-4 text-foreground dark:text-white">
                        Acesso Elite ao Mercado
                      </h3>
                      <p className="text-base text-muted-foreground dark:text-slate-400 mb-10 font-medium leading-relaxed">
                        Desbloqueie agora a visibilidade total da categoria <span className="text-blue-600 font-black">{marketData?.category_name}</span>. 
                        Capture leads qualificados antes que eles cheguem aos seus concorrentes com nossa inteligência em tempo real.
                      </p>
                      
                      <div className="grid grid-cols-2 gap-4 mb-10">
                        <div className="p-4 rounded-2xl bg-blue-600/5 border border-blue-600/10 text-left">
                          <Zap className="h-5 w-5 text-blue-600 mb-2" />
                          <p className="text-[10px] font-black uppercase text-blue-600/80">Velocidade Máxima</p>
                          <p className="text-[11px] font-bold text-slate-500">Notificações Instantâneas</p>
                        </div>
                        <div className="p-4 rounded-2xl bg-blue-600/5 border border-blue-600/10 text-left">
                          <Target className="h-5 w-5 text-blue-600 mb-2" />
                          <p className="text-[10px] font-black uppercase text-blue-600/80">Alta Conversão</p>
                          <p className="text-[11px] font-bold text-slate-500">Leads Enriquecidos</p>
                        </div>
                      </div>

                      <Button 
                        onClick={() => window.location.href='/pricing'} 
                        className="w-full rounded-2xl font-black uppercase tracking-widest text-xs bg-blue-600 hover:bg-blue-700 text-white h-16 shadow-xl shadow-blue-600/20 group transition-all"
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
                  <LeadCard key={opp.id} lead={opp} isOpportunity delay={idx * 0.05} />
                ))}
              </div>
            </div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </div>
  );
}

function LeadCard({ lead, isOpportunity, delay = 0 }: { lead: any, isOpportunity?: boolean, delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.4 }}
    >
      <Card className="clay-precision bg-card dark:bg-[#0F172A] border-none group overflow-hidden transition-all duration-300 hover:shadow-xl hover:shadow-blue-500/5 hover:-translate-y-1">
        <CardContent className="p-6 relative">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
            <div className="flex-1 space-y-6">
              <div className="flex items-center flex-wrap gap-3">
                <div className={cn(
                  "px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border",
                  isOpportunity 
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20" 
                    : "bg-blue-600/10 text-blue-600 border-blue-600/20"
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
              </div>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6">
                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Localização</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground/80 dark:text-white/70">
                    <MapPin className="h-4 w-4 text-blue-600/50" />
                    <span>{lead.city} - {lead.state}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">E-mail</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground/80 dark:text-white/70">
                    <Mail className="h-4 w-4 text-blue-600/50" />
                    <span className="truncate max-w-[180px]">{isOpportunity ? '••••••••@••••.com' : lead.email}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Telefone</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground/80 dark:text-white/70">
                    <Phone className="h-4 w-4 text-blue-600/50" />
                    <span className="font-mono">{isOpportunity ? '(••) •••••-••••' : lead.phone}</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Segmento</p>
                  <div className="flex items-center gap-2 text-sm font-bold text-foreground/80 dark:text-white/70 text-blue-500">
                    <Globe className="h-4 w-4 opacity-50" />
                    <span className="truncate">{lead.product_vertical || 'Energia Solar'}</span>
                  </div>
                </div>
              </div>
              
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-100 dark:border-white/5 relative group-hover:border-blue-500/10 transition-colors">
                <p className="text-xs font-bold text-slate-600 dark:text-slate-400 leading-relaxed italic pr-10">
                  &quot;{lead.message || 'Interesse em cotação de energia solar para residência/empresa.'}&quot;
                </p>
                <MessageSquare className="absolute right-4 top-4 h-4 w-4 text-slate-300 dark:text-white/10" />
              </div>
            </div>
            
            <div className="flex flex-row lg:flex-col gap-3 min-w-[200px]">
              {!isOpportunity ? (
                <>
                  <Button variant="outline" className="flex-1 lg:flex-none h-12 rounded-xl border-slate-200 dark:border-white/10 text-[10px] font-black uppercase tracking-widest hover:bg-slate-50 dark:hover:bg-white/5 transition-all">
                    <Calendar className="h-3.5 w-3.5 mr-2" /> Agendar
                  </Button>
                  <Button className="flex-1 lg:flex-none h-12 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-black uppercase tracking-widest shadow-lg shadow-blue-600/10">
                    <MessageSquare className="h-3.5 w-3.5 mr-2" /> Contato Direto
                  </Button>
                </>
              ) : (
                <div className="flex flex-col gap-2 w-full">
                  <Badge variant="outline" className="justify-center h-10 rounded-xl bg-slate-100 dark:bg-slate-900 border-dashed border-slate-300 dark:border-white/10 text-[10px] text-muted-foreground/60">
                    Lead Protegido
                  </Badge>
                  <Button disabled className="h-12 rounded-xl bg-slate-200 dark:bg-slate-800 text-slate-400 dark:text-slate-600 text-[10px] font-black uppercase tracking-widest cursor-not-allowed">
                    <Lock className="h-3.5 w-3.5 mr-2" /> Indisponível
                  </Button>
                </div>
              )}
            </div>
          </div>

          <div className="absolute top-0 right-0 p-1 opacity-0 group-hover:opacity-100 transition-opacity">
             <ExternalLink className="h-4 w-4 text-blue-500/20" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-dashed border-2 border-slate-200 dark:border-white/5 bg-transparent rounded-[2rem]">
      <CardContent className="flex flex-col items-center justify-center py-24 text-center">
        <div className="w-20 h-20 rounded-full bg-slate-100 dark:bg-slate-900 flex items-center justify-center mb-6">
          <ShieldAlert className="h-10 w-10 text-slate-300 dark:text-slate-700" />
        </div>
        <h3 className="text-2xl font-black uppercase tracking-tighter mb-2 text-foreground dark:text-white">Sem Movimentação</h3>
        <p className="text-sm text-muted-foreground/50 font-medium max-w-xs">{message}</p>
      </CardContent>
    </Card>
  );
}

function LeadsSkeleton() {
  return (
    <div className="space-y-10">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-40 rounded-[2rem] bg-slate-100 dark:bg-slate-900/50" />)}
      </div>
      <div className="flex justify-between items-end">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64 bg-slate-100 dark:bg-slate-900/50" />
          <Skeleton className="h-4 w-48 bg-slate-100 dark:bg-slate-900/50" />
        </div>
        <Skeleton className="h-12 w-80 rounded-xl bg-slate-100 dark:bg-slate-900/50" />
      </div>
      <div className="space-y-4">
        {[1, 2, 3, 4].map(i => <Skeleton key={i} className="h-64 rounded-[2rem] bg-slate-100 dark:bg-slate-900/50" />)}
      </div>
    </div>
  );
}
