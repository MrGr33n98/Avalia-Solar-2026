'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Target, Mail, Phone, MessageSquare, Calendar, Globe, TrendingUp, Lock, ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

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

  return (
    <div className="space-y-8">
      {/* Market Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-brand-blue/10">
                <Target className="h-5 w-5 text-brand-blue" />
              </div>
              <Badge variant="secondary" className="bg-black/5 dark:bg-white/5 text-[10px] font-black uppercase">Últimos 30d</Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Total na Categoria</p>
            <p className="text-3xl font-black text-foreground dark:text-white tracking-tighter">{marketData?.stats.total_market_leads || 0}</p>
            <p className="text-[10px] font-bold text-brand-blue/60 mt-2 uppercase tracking-widest">{marketData?.category_name}</p>
          </CardContent>
        </Card>

        <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-brand-green/10">
                <TrendingUp className="h-5 w-5 text-brand-green" />
              </div>
              <Badge className="bg-brand-green/10 text-brand-green text-[10px] font-black border-none uppercase">Market Share</Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Sua Participação</p>
            <p className="text-3xl font-black text-foreground dark:text-white tracking-tighter">{marketData?.stats.market_share_percent}%</p>
            <p className="text-[10px] font-bold text-brand-green/60 mt-2 uppercase tracking-widest">{marketData?.stats.my_leads_count} Leads Capturados</p>
          </CardContent>
        </Card>

        <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-xl bg-brand-yellow/10">
                <ArrowUpRight className="h-5 w-5 text-brand-yellow" />
              </div>
              <Badge className="bg-brand-yellow/10 text-brand-yellow text-[10px] font-black border-none uppercase">Potencial</Badge>
            </div>
            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/60 mb-1">Oportunidades Perdidas</p>
            <p className="text-3xl font-black text-foreground dark:text-white tracking-tighter text-brand-yellow">{marketData?.stats.opportunities_count || 0}</p>
            <p className="text-[10px] font-bold text-brand-yellow/60 mt-2 uppercase tracking-widest">Leads distribuídos para concorrentes</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="my-leads" className="w-full" onValueChange={setActiveTab}>
        <TabsList className="bg-black/5 dark:bg-white/5 p-1 rounded-2xl h-12 mb-8 border border-black/5 dark:border-white/5">
          <TabsTrigger value="my-leads" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-card dark:data-[state=active]:bg-brand-blue data-[state=active]:text-white">
            Meus Leads ({leads.length})
          </TabsTrigger>
          <TabsTrigger value="market" className="rounded-xl px-8 font-black uppercase text-[10px] tracking-widest data-[state=active]:bg-card dark:data-[state=active]:bg-brand-blue data-[state=active]:text-white">
            Inteligência de Mercado
          </TabsTrigger>
        </TabsList>

        <TabsContent value="my-leads" className="space-y-4 focus-visible:outline-none">
          {leads.length === 0 ? (
            <EmptyState message="Nenhum lead recebido ainda." />
          ) : (
            leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
          )}
        </TabsContent>

        <TabsContent value="market" className="space-y-6 focus-visible:outline-none">
          <div className="relative">
            {!marketData?.is_premium && (
              <div className="absolute inset-0 z-20 flex items-center justify-center">
                <div className="bg-card dark:bg-[#002B4D]/90 p-8 rounded-3xl shadow-2xl border border-brand-blue/30 text-center max-w-lg mx-4 backdrop-blur-sm">
                  <Lock className="h-12 w-12 text-brand-blue mx-auto mb-4" />
                  <h3 className="text-xl font-black uppercase tracking-tighter mb-3">Acesso Restrito ao Mercado</h3>
                  <p className="text-sm text-muted-foreground dark:text-white/60 mb-8 font-medium leading-relaxed">
                    Você está vendo apenas uma prévia das oportunidades da categoria <strong>{marketData?.category_name}</strong>. 
                    Faça o upgrade para visualizar detalhes dos leads, contatos diretos e capturar essas oportunidades antes da concorrência.
                  </p>
                  <Button onClick={() => window.location.href='/pricing'} className="w-full rounded-2xl font-black uppercase tracking-widest text-xs bg-brand-blue hover:bg-brand-blue/80 text-white h-14 shadow-lg shadow-brand-blue/20">
                    Desbloquear Oportunidades Agora
                  </Button>
                </div>
              </div>
            )}

            <div className={cn("space-y-4", !marketData?.is_premium && "blur-xl grayscale pointer-events-none opacity-40")}>
              {marketData?.opportunities.map((opp) => (
                <LeadCard key={opp.id} lead={opp} isOpportunity />
              ))}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function LeadCard({ lead, isOpportunity }: { lead: any, isOpportunity?: boolean }) {
  return (
    <Card className="clay-precision bg-card dark:bg-[#002B4D] border-none group overflow-hidden transition-all hover:scale-[1.01]">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <h3 className="font-black text-xl tracking-tighter uppercase text-foreground dark:text-white">
                {isOpportunity ? `Oportunidade em ${lead.city}` : lead.name}
              </h3>
              <Badge variant="default" className="bg-brand-blue/10 text-brand-blue text-[9px] font-black uppercase border-none">
                {isOpportunity ? 'Mercado' : 'Direto'}
              </Badge>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 dark:text-white/40">
                <Globe className="h-4 w-4" />
                <span>{lead.city} - {lead.state}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 dark:text-white/40">
                <Calendar className="h-4 w-4" />
                <span>{new Date(lead.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 dark:text-white/40">
                <Mail className="h-4 w-4" />
                <span>{lead.email}</span>
              </div>
              <div className="flex items-center gap-3 text-xs font-bold uppercase tracking-widest text-muted-foreground/60 dark:text-white/40">
                <Phone className="h-4 w-4" />
                <span>{lead.phone}</span>
              </div>
            </div>
            
            <div className="mt-6 p-4 rounded-2xl bg-black/[0.02] dark:bg-white/[0.03] border border-black/5 dark:border-white/5">
              <p className="text-xs font-bold text-foreground/80 dark:text-white/80 leading-relaxed italic">
                "{lead.message || lead.product_vertical || 'Interesse em cotação de energia solar.'}"
              </p>
            </div>
          </div>
          
          <div className="flex flex-row md:flex-col gap-2">
            {!isOpportunity ? (
              <>
                <Button variant="outline" size="sm" className="h-10 rounded-xl border-black/10 dark:border-white/10 text-[10px] font-black uppercase tracking-widest">
                  <Phone className="h-3.5 w-3.5 mr-2" /> Contato
                </Button>
                <Button className="h-10 rounded-xl bg-brand-blue hover:bg-brand-blue/80 text-white text-[10px] font-black uppercase tracking-widest">
                  <MessageSquare className="h-3.5 w-3.5 mr-2" /> WhatsApp
                </Button>
              </>
            ) : (
              <Button disabled className="h-10 rounded-xl bg-muted text-[10px] font-black uppercase tracking-widest opacity-50">
                Indisponível
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <Card className="border-dashed border-2 border-black/10 dark:border-white/10 bg-transparent">
      <CardContent className="flex flex-col items-center justify-center py-20 text-center">
        <Target className="h-16 w-16 text-muted-foreground/20 mb-6" />
        <h3 className="text-xl font-black uppercase tracking-tighter mb-2">Sem Leads no Momento</h3>
        <p className="text-sm text-muted-foreground/60 font-medium">{message}</p>
      </CardContent>
    </Card>
  );
}

function LeadsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-32 rounded-3xl" />)}
      </div>
      <div className="h-12 w-96 bg-black/5 dark:bg-white/5 rounded-2xl mb-8" />
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-48 rounded-3xl" />)}
      </div>
    </div>
  );
}
