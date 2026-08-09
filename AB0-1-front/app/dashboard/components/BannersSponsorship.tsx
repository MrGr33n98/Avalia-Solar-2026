'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Sparkles, Plus, Lock, TrendingUp, Users, Target, MousePointerClick, CheckCircle2, AlertCircle, BarChart3 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCompanyFeatures } from '@/hooks/useCompanyFeatures';
import { isFeatureEnabled } from '@/lib/feature-access';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { fetchApi } from '@/lib/api';

interface BannersSponsorshipProps {
  companyId: string;
}

type BannerPerformance = {
  impressions: number;
  clicks: number;
  ctr: number;
  leads: number;
  investment_cents?: number;
  cpc_cents?: number;
  investment?: number;
  cpc?: number;
};

type ActiveAddon = {
  id: number;
  name: string;
  ends_at: string;
  days_remaining: number;
};

type CompanyBanner = {
  id: number;
  title: string;
  thumbnail_url?: string | null;
  operational_status: string;
  moderation_status: string;
  rejected_reason?: string | null;
  position: string;
  slot_key: string;
  starts_at?: string;
  ends_at?: string;
  days_remaining?: number;
  performance: BannerPerformance;
  active_addons: ActiveAddon[];
  allowed_actions: string[];
};

type Quota = {
  used: number;
  limit: number;
  remaining: number;
  can_create: boolean;
};

type DashboardPayload = {
  quota: Quota;
  summary: BannerPerformance;
  banners: CompanyBanner[];
};

type BannerAddon = {
  id: number;
  name: string;
  code: string;
  description: string;
  price_cents: number;
  currency: string;
  duration_days: number;
};

type BannerCheckoutResponse = {
  subscription: { id: number; status: string; payment_provider: string; checkout_session_id: string };
  redirect_url: string;
  message?: string;
};

function formatMoney(cents: number, currency: string = 'BRL') {
  const value = (cents || 0) / 100;
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency}`;
  }
}

type DetailedPerformance = {
  banner_id: number;
  metrics: BannerPerformance;
  time_series: {
    day: string;
    impressions: number;
    clicks: number;
    leads: number;
    ctr: number;
  }[];
};

function PerformanceDialog({ banner, trigger }: { banner: CompanyBanner; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DetailedPerformance | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetchApi<DetailedPerformance>(`/company_dashboard/banners/${banner.id}/performance`);
        setData(resp);
      } catch (e: any) {
        setError(e?.message || 'Falha ao carregar performance');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [open, banner.id]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>Performance: {banner.title}</DialogTitle>
          <DialogDescription>Métricas e série temporal do anúncio patrocinado.</DialogDescription>
        </DialogHeader>
        
        {loading ? (
           <div className="py-20 flex justify-center text-slate-400">Carregando métricas...</div>
        ) : error ? (
           <div className="py-10 text-center text-rose-500">{error}</div>
        ) : data ? (
          <div className="space-y-6 mt-4">
             <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
               <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                 <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Views</div>
                 <div className="font-black text-lg">{data.metrics.impressions}</div>
               </div>
               <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                 <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Cliques</div>
                 <div className="font-black text-lg">{data.metrics.clicks}</div>
               </div>
               <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                 <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Leads</div>
                 <div className="font-black text-lg">{data.metrics.leads}</div>
               </div>
               <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                 <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">CTR</div>
                 <div className="font-black text-lg">{data.metrics.ctr}%</div>
               </div>
               <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                 <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Custo</div>
                 <div className="font-black text-lg">{formatMoney(data.metrics.investment_cents || data.metrics.investment * 100)}</div>
               </div>
               <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                 <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">CPC</div>
                 <div className="font-black text-lg">{formatMoney(data.metrics.cpc_cents || data.metrics.cpc * 100)}</div>
               </div>
             </div>

             {/* Simple mini-chart representation */}
             {data.time_series.length > 0 && (
               <div className="p-4 rounded-3xl bg-slate-50 dark:bg-white/5 border border-slate-100 dark:border-white/5 h-48 flex items-end justify-between gap-1">
                 {data.time_series.map((ts, i) => {
                    const max = Math.max(...data.time_series.map(t => t.impressions)) || 1;
                    const height = (ts.impressions / max) * 100;
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center justify-end h-full group relative">
                        <div className="w-full bg-brand-blue/80 hover:bg-brand-blue rounded-t-md transition-all" style={{ height: `${Math.max(4, height)}%` }} />
                        
                        {/* Tooltip */}
                        <div className="absolute -top-10 scale-0 group-hover:scale-100 transition-transform bg-slate-900 text-white text-[10px] px-2 py-1 rounded whitespace-nowrap z-10 pointer-events-none">
                          {new Date(ts.day).toLocaleDateString('pt-BR')}: {ts.impressions} views
                        </div>
                      </div>
                    );
                 })}
               </div>
             )}
          </div>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function AddonCheckoutDialog({ banner, trigger }: { banner: CompanyBanner; trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [addons, setAddons] = useState<BannerAddon[]>([]);
  const [loadingAddons, setLoadingAddons] = useState(false);
  const [selectedAddonId, setSelectedAddonId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const loadAddons = async () => {
      setLoadingAddons(true);
      setError(null);
      try {
        const resp = await fetchApi<{ banner_addons: BannerAddon[] }>('/banner_addons');
        const list = resp?.banner_addons || [];
        setAddons(list);
        if (!selectedAddonId && list[0]?.id) setSelectedAddonId(String(list[0].id));
      } catch (e: any) {
        setError(e?.message || 'Falha ao carregar add-ons');
      } finally {
        setLoadingAddons(false);
      }
    };
    loadAddons();
  }, [open, selectedAddonId]);

  const doCheckout = async () => {
    if (!selectedAddonId) return;
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetchApi<BannerCheckoutResponse>('/company_dashboard/banner_addon_checkout', {
        method: 'POST',
        headers: { 'Idempotency-Key': `PAY-${banner.id}-${selectedAddonId}-${Date.now()}` },
        body: JSON.stringify({ addon_id: Number(selectedAddonId), banner_id: banner.id }),
      });
      if (resp.redirect_url) {
        window.location.href = resp.redirect_url;
      }
    } catch (e: any) {
      setError(e?.message || 'Falha ao criar checkout');
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Impulsionar Banner</DialogTitle>
          <DialogDescription>
            Escolha um pacote de destaque para o banner <strong>{banner.title}</strong>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Pacote</Label>
            <Select value={selectedAddonId} onValueChange={setSelectedAddonId} disabled={loadingAddons || addons.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={loadingAddons ? 'Carregando...' : 'Selecione um pacote'} />
              </SelectTrigger>
              <SelectContent>
                {addons.map((a) => (
                  <SelectItem key={a.id} value={String(a.id)}>
                    {a.name} • {formatMoney(a.price_cents, a.currency)} • {a.duration_days} dias
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {error && <div className="text-sm text-destructive">{error}</div>}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancelar
          </Button>
          <Button onClick={doCheckout} disabled={submitting || loadingAddons || !selectedAddonId}>
            {submitting ? 'Gerando Checkout...' : 'Ir para Pagamento'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BannersSponsorship({ companyId }: BannersSponsorshipProps) {
  const { features } = useCompanyFeatures(companyId);
  const allowed = useMemo(() => isFeatureEnabled(features, 'promo_banner'), [features]);
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<DashboardPayload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;

    const loadData = async () => {
      setLoading(true);
      setError(null);
      try {
        const resp = await fetchApi<DashboardPayload>('/company_dashboard/banners');
        setData(resp);
      } catch (e: any) {
        if (e?.status === 403) {
          setError('Acesso restrito ao seu plano atual.');
        } else {
          setError(e.message || 'Falha ao sincronizar dados.');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [allowed, companyId]);

  if (!allowed) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col items-center justify-center py-32 bg-slate-50 dark:bg-white/[0.02] rounded-[3rem] border border-dashed border-slate-200 dark:border-white/5">
          <div className="h-24 w-24 rounded-[2rem] bg-rose-500/5 flex items-center justify-center mb-8">
             <Lock className="h-10 w-10 text-rose-500/20" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2">Recurso Bloqueado</h3>
          <p className="text-sm text-slate-500 dark:text-white/30 font-medium max-w-xs text-center mb-8">
            Você pode fazer upgrade do seu plano Enterprise para liberar banners.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-brand-blue mb-1">
            <Sparkles className="h-4 w-4" />
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Avalia Solar Ads</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase text-slate-900 dark:text-white leading-none">
            Campanhas <span className="text-brand-blue">Patrocinadas</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-white/40 max-w-md font-medium leading-relaxed">
            Gerencie seus anúncios de destaque. {data?.quota && `Você tem ${data.quota.used} de ${data.quota.limit} anúncios ativos.`}
          </p>
        </div>
        
        <div className="flex items-center gap-4">
          <Button 
            disabled={!data?.quota?.can_create}
            className="h-12 px-8 rounded-2xl bg-brand-blue hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-brand-blue/20 transition-all active:scale-95">
            <Plus className="h-4 w-4 mr-2" />
            Novo Anúncio
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="space-y-8 animate-pulse">
           <div className="h-32 bg-slate-100 dark:bg-white/5 rounded-3xl" />
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => <div key={i} className="h-64 rounded-3xl bg-slate-100 dark:bg-white/5" />)}
           </div>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 bg-rose-50/50 dark:bg-rose-500/5 rounded-[3rem] border border-rose-100 dark:border-rose-500/10">
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">{error}</h3>
        </div>
      ) : data ? (
        <>
          {/* Summary KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
                  <div className="p-2 bg-brand-blue/10 text-brand-blue rounded-xl"><Users className="w-4 h-4" /></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Impressões</span>
                </div>
                <div className="text-3xl font-black tracking-tight">{data.summary.impressions.toLocaleString('pt-BR')}</div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
                  <div className="p-2 bg-emerald-500/10 text-emerald-500 rounded-xl"><MousePointerClick className="w-4 h-4" /></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Cliques (CTR)</span>
                </div>
                <div className="text-3xl font-black tracking-tight">
                  {data.summary.clicks.toLocaleString('pt-BR')} <span className="text-sm font-semibold text-slate-400">({data.summary.ctr}%)</span>
                </div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
                  <div className="p-2 bg-orange-500/10 text-orange-500 rounded-xl"><Target className="w-4 h-4" /></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Leads</span>
                </div>
                <div className="text-3xl font-black tracking-tight">{data.summary.leads.toLocaleString('pt-BR')}</div>
              </CardContent>
            </Card>
            <Card className="rounded-3xl border-none shadow-sm bg-white dark:bg-slate-900 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 text-slate-500 dark:text-slate-400 mb-2">
                  <div className="p-2 bg-purple-500/10 text-purple-500 rounded-xl"><TrendingUp className="w-4 h-4" /></div>
                  <span className="text-xs font-bold uppercase tracking-wider">Investimento</span>
                </div>
                <div className="text-3xl font-black tracking-tight">{formatMoney(data.summary.investment_cents)}</div>
              </CardContent>
            </Card>
          </div>

          {/* Banner List */}
          <div className="space-y-6">
            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">Seus Anúncios</h3>
            {data.banners.length === 0 ? (
               <div className="text-center p-12 bg-slate-50 dark:bg-white/5 rounded-3xl">Nenhum anúncio criado.</div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                {data.banners.map(banner => (
                  <Card key={banner.id} className="rounded-3xl overflow-hidden border-slate-200 dark:border-slate-800">
                    <div className="h-32 bg-slate-100 dark:bg-slate-900 relative">
                       {banner.thumbnail_url && <img src={banner.thumbnail_url} alt={banner.title} className="w-full h-full object-cover" />}
                       <div className="absolute top-4 right-4 flex gap-2">
                         <Badge variant={banner.operational_status === 'active' ? 'default' : 'secondary'} className="uppercase text-[9px] font-black tracking-widest px-3 py-1">
                           {banner.operational_status}
                         </Badge>
                       </div>
                    </div>
                    <CardContent className="p-6">
                      <h4 className="font-bold text-lg mb-1">{banner.title}</h4>
                      <p className="text-xs text-slate-500 uppercase font-semibold tracking-wider mb-6">
                        Posição: {banner.position}
                      </p>

                      {banner.moderation_status === 'rejected' && banner.rejected_reason && (
                        <div className="mb-6 p-3 rounded-xl bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20">
                          <div className="flex items-center gap-2 mb-1">
                            <AlertCircle className="w-4 h-4 text-rose-500" />
                            <span className="text-sm font-bold text-rose-900 dark:text-rose-500">Banner Rejeitado</span>
                          </div>
                          <p className="text-xs text-rose-700 dark:text-rose-400 font-medium">
                            {banner.rejected_reason}
                          </p>
                          <Button variant="outline" className="mt-2 w-full text-[10px] uppercase font-bold text-rose-700 border-rose-200">
                            Corrigir Banner
                          </Button>
                        </div>
                      )}

                      {/* Add-ons */}
                      {banner.active_addons.length > 0 && (
                        <div className="mb-6 space-y-2">
                          {banner.active_addons.map(addon => (
                            <div key={addon.id} className="flex items-center justify-between p-3 rounded-xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20">
                               <div className="flex items-center gap-2">
                                 <Sparkles className="w-4 h-4 text-amber-500" />
                                 <span className="text-sm font-bold text-amber-900 dark:text-amber-500">{addon.name}</span>
                               </div>
                               <span className="text-xs font-semibold text-amber-700 dark:text-amber-400">{addon.days_remaining} dias</span>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Metrics */}
                      <div className="grid grid-cols-3 gap-2 mb-6">
                         <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                           <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Visitas</div>
                           <div className="font-black text-sm">{banner.performance.impressions}</div>
                         </div>
                         <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                           <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Cliques</div>
                           <div className="font-black text-sm">{banner.performance.clicks}</div>
                         </div>
                         <div className="text-center p-3 rounded-2xl bg-slate-50 dark:bg-slate-900">
                           <div className="text-[10px] uppercase font-bold text-slate-400 mb-1">Leads</div>
                           <div className="font-black text-sm">{banner.performance.leads}</div>
                         </div>
                      </div>

                      {/* Actions */}
                      <div className="flex flex-col gap-2">
                        <div className="flex gap-2">
                          {banner.allowed_actions.includes('buy_addon') && (
                            <AddonCheckoutDialog 
                              banner={banner}
                              trigger={
                                <Button className="flex-1 bg-brand-blue hover:bg-blue-700 text-white font-bold uppercase tracking-wider text-[10px] h-10 rounded-xl">
                                  Impulsionar
                                </Button>
                              }
                            />
                          )}
                          {banner.allowed_actions.includes('edit') && (
                              <Button variant="outline" className="flex-1 font-bold uppercase tracking-wider text-[10px] h-10 rounded-xl">
                                Editar
                              </Button>
                          )}
                        </div>
                        
                        <PerformanceDialog banner={banner} trigger={
                          <Button variant="secondary" className="w-full font-bold uppercase tracking-wider text-[10px] h-10 rounded-xl">
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Ver Performance Detalhada
                          </Button>
                        } />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
