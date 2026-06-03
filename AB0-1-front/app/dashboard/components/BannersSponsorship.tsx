'use client';

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { Sparkles, Plus, Lock } from 'lucide-react';
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

type CompanyBanner = {
  id: number;
  title: string;
  position: string;
  banner_type: string;
  active: boolean;
  sponsored: boolean;
  link: string | null;
  link_url?: string | null;
  image_url?: string | null;
};



type BannerOffer = {
  id: number;
  name: string;
  price_cents: number;
  currency: string;
  duration_days: number;
  rules_json?: any;
  active: boolean;
};

type BannerCheckoutResponse = {
  subscription: { id: number; status: string; provider: string; checkout_session_id: string };
  message?: string;
  webhook_example?: { url: string; payload: any };
};

function formatMoney(cents: number, currency: string) {
  const value = (cents || 0) / 100;
  try {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: currency || 'BRL' }).format(value);
  } catch {
    return `${value.toFixed(2)} ${currency || 'BRL'}`;
  }
}

function CheckoutDialog({ trigger }: { trigger: ReactNode }) {
  const [open, setOpen] = useState(false);
  const [offers, setOffers] = useState<BannerOffer[]>([]);
  const [loadingOffers, setLoadingOffers] = useState(false);
  const [selectedOfferId, setSelectedOfferId] = useState<string>('');
  const [checkout, setCheckout] = useState<BannerCheckoutResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!open) return;
    const run = async () => {
      setLoadingOffers(true);
      setError(null);
      setCheckout(null);
      try {
        const resp = await fetchApi<{ offers: BannerOffer[] }>('/banner_offers');
        const list = resp?.offers || [];
        setOffers(list);
        if (!selectedOfferId && list[0]?.id) setSelectedOfferId(String(list[0].id));
      } catch (e: any) {
        setError(e?.message || 'Falha ao carregar ofertas');
      } finally {
        setLoadingOffers(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const doCheckout = async () => {
    if (!selectedOfferId) return;
    setSubmitting(true);
    setError(null);
    try {
      const resp = await fetchApi<BannerCheckoutResponse>('/company_dashboard/banner_checkout', {
        method: 'POST',
        body: JSON.stringify({ offer_id: Number(selectedOfferId) }),
      });
      setCheckout(resp);
    } catch (e: any) {
      setError(e?.message || 'Falha ao criar checkout');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>Contratar banner</DialogTitle>
          <DialogDescription>
            Escolha uma oferta e gere um checkout. (Ambiente atual: provider mock via webhook.)
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Oferta</Label>
            <Select value={selectedOfferId} onValueChange={setSelectedOfferId} disabled={loadingOffers || offers.length === 0}>
              <SelectTrigger>
                <SelectValue placeholder={loadingOffers ? 'Carregando...' : 'Selecione uma oferta'} />
              </SelectTrigger>
              <SelectContent>
                {offers.map((o) => (
                  <SelectItem key={o.id} value={String(o.id)}>
                    {o.name} • {formatMoney(o.price_cents, o.currency)} • {o.duration_days} dias
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {error && <div className="text-sm text-destructive">{error}</div>}

          {checkout?.subscription && (
            <div className="rounded-md border p-3 text-sm space-y-2">
              <div>
                <strong>Status:</strong> {checkout.subscription.status}
              </div>
              <div>
                <strong>Checkout Session:</strong> {checkout.subscription.checkout_session_id}
              </div>
              {checkout.webhook_example && (
                <pre className="whitespace-pre-wrap text-xs text-white/40">
{JSON.stringify(checkout.webhook_example, null, 2)}
                </pre>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Fechar
          </Button>
          <Button onClick={doCheckout} disabled={submitting || loadingOffers || !selectedOfferId}>
            {submitting ? 'Criando...' : 'Criar checkout'}
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
  const [banners, setBanners] = useState<CompanyBanner[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!allowed) return;

    const run = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchApi<{ banners: CompanyBanner[] }>('/company_dashboard/banners');
        setBanners(data?.banners || []);
      } catch (e: any) {
        console.error('Error fetching company banners:', e);
        if (e?.status === 403) {
          setError('Acesso restrito ao seu plano atual.');
        } else {
          setError(e.message || 'Falha ao sincronizar pipeline de banners.');
        }
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [allowed, companyId]);

  if (!allowed) {
    return (
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-brand-blue mb-1">
              <Sparkles className="h-4 w-4" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em]">Visibility Protocol</span>
            </div>
            <h2 className="text-4xl font-black tracking-tighter uppercase text-slate-900 dark:text-white leading-none">
              Campanhas <span className="text-brand-blue">Patrocinadas</span>
            </h2>
            <p className="text-sm text-slate-500 dark:text-white/40 max-w-md font-medium leading-relaxed">
              Disponível somente para planos com a funcionalidade de banners.
            </p>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center py-32 bg-slate-50 dark:bg-white/[0.02] rounded-[3rem] border border-dashed border-slate-200 dark:border-white/5">
          <div className="h-24 w-24 rounded-[2rem] bg-rose-500/5 flex items-center justify-center mb-8">
             <Lock className="h-10 w-10 text-rose-500/20" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2">Recurso Bloqueado</h3>
          <p className="text-sm text-slate-500 dark:text-white/30 font-medium max-w-xs text-center mb-8">
            Você pode fazer upgrade do seu plano Enterprise ou contratar banners como um add-on estratégico.
          </p>
          <CheckoutDialog
            trigger={
              <Button className="h-14 px-10 rounded-2xl bg-brand-blue text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-brand-blue/20">
                 Contratar Add-on de Banners
              </Button>
            }
          />
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
            <span className="text-[10px] font-black uppercase tracking-[0.3em]">Visibility Protocol</span>
          </div>
          <h2 className="text-4xl font-black tracking-tighter uppercase text-slate-900 dark:text-white leading-none">
            Campanhas <span className="text-brand-blue">Patrocinadas</span>
          </h2>
          <p className="text-sm text-slate-500 dark:text-white/40 max-w-md font-medium leading-relaxed">
            Gerencie seus banners de destaque, ofertas sazonais e anúncios contextuais dentro da rede Avalia Solar.
          </p>
        </div>
        
        <div className="flex items-center gap-4">

          <CheckoutDialog
            trigger={
              <Button variant="outline" className="h-12 px-8 rounded-2xl border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 font-black uppercase tracking-widest text-[10px] shadow-sm">
                Contratar Add-on
              </Button>
            }
          />
          <Button className="h-12 px-8 rounded-2xl bg-brand-blue hover:bg-blue-700 text-white font-black uppercase tracking-widest text-[10px] shadow-xl shadow-brand-blue/20 transition-all active:scale-95">
            <Plus className="h-4 w-4 mr-2" />
            Novo Banner
          </Button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-64 rounded-3xl bg-slate-100 dark:bg-white/5 animate-pulse" />
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-32 bg-rose-50/50 dark:bg-rose-500/5 rounded-[3rem] border border-rose-100 dark:border-rose-500/10">
          <div className="h-20 w-20 rounded-2xl bg-rose-500/10 flex items-center justify-center mb-6">
            <Lock className="h-10 w-10 text-rose-500" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-tight text-slate-900 dark:text-white">{error}</h3>
          <p className="text-sm text-slate-500 dark:text-white/40 mt-2 max-w-xs text-center font-medium">
            Verifique as configurações do seu plano ou entre em contato com o suporte.
          </p>
          <Button variant="outline" className="mt-8 h-12 rounded-xl px-8 font-black uppercase tracking-widest text-[10px]" onClick={() => window.location.reload()}>
            Tentar Sincronizar
          </Button>
        </div>
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 bg-slate-50 dark:bg-white/[0.02] rounded-[3rem] border border-dashed border-slate-200 dark:border-white/5">
          <div className="h-24 w-24 rounded-[2rem] bg-brand-blue/5 flex items-center justify-center mb-8">
             <Sparkles className="h-10 w-10 text-brand-blue/20" />
          </div>
          <h3 className="text-xl font-black uppercase tracking-widest text-slate-900 dark:text-white mb-2">Nenhum item cadastrado</h3>
          <p className="text-sm text-slate-500 dark:text-white/30 font-medium max-w-xs text-center mb-8">
            Adicione um banner para destacar campanhas, ofertas ou diferenciais no seu perfil.
          </p>
          <Button className="h-14 px-10 rounded-2xl bg-brand-blue text-white font-black uppercase tracking-widest text-[11px] shadow-2xl shadow-brand-blue/20">
             Criar Primeiro Banner
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {banners.map((banner) => (
            <Card key={banner.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold">{banner.title}</h3>
                    </div>
                    <p className="text-sm text-white/40">
                      {banner.banner_type} • {banner.position}
                    </p>
                  </div>
                  <Badge variant={banner.active ? 'default' : 'secondary'}>
                    {banner.active ? 'active' : 'paused'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between text-sm">
                  <span className="text-white/40">
                    Link: {(banner.link_url || banner.link || '').toString().slice(0, 40) || '—'}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => (banner.link_url || banner.link) && window.open((banner.link_url || banner.link) as string, '_blank')}
                    disabled={!(banner.link_url || banner.link)}
                  >
                    Ver
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
