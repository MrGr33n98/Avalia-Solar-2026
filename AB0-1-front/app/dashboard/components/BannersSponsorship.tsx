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
        setError(e.message || 'Erro ao carregar banners. Por favor, tente novamente mais tarde.');
      } finally {
        setLoading(false);
      }
    };

    run();
  }, [allowed, companyId]);

  if (!allowed) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold">Banners & Patrocínios</h2>
          <p className="text-white/40">Disponível somente para planos com a funcionalidade de banners.</p>
        </div>

        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12 text-center">
            <div className="mb-4 flex items-center gap-2 text-white/40">
              <Lock className="h-5 w-5" />
              <span>Feature bloqueada pelo plano</span>
            </div>
            <p className="text-white/40 mb-4">
              Você pode fazer upgrade do plano ou contratar banners como add-on.
            </p>
            <CheckoutDialog
              trigger={
                <Button>
                  <Plus className="h-[18px] w-[18px] mr-2" />
                  Contratar Banner
                </Button>
              }
            />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Banners & Patrocínios</h2>
          <p className="text-white/40">Gerencie seus banners publicados na plataforma</p>
        </div>
        <div className="flex items-center gap-2">
          <CheckoutDialog
            trigger={
              <Button variant="outline">
                <Plus className="h-[18px] w-[18px] mr-2" />
                Contratar (Add-on)
              </Button>
            }
          />
          <Button>
            <Plus className="h-[18px] w-[18px] mr-2" />
            Novo Banner
          </Button>
        </div>
      </div>

      {loading ? (
        <Card>
          <CardContent className="p-4 text-white/40">Carregando banners...</CardContent>
        </Card>
      ) : error ? (
        <Card className="border-destructive/50 bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex flex-col items-center justify-center text-center">
              <p className="text-destructive font-medium mb-2">Erro ao carregar dados</p>
              <p className="text-sm text-white/40 mb-4">{error}</p>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Tentar novamente
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : banners.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Sparkles className="h-12 w-12 text-white/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum banner cadastrado</h3>
            <p className="text-white/40 text-center mb-4">
              Crie seu primeiro banner para aumentar sua visibilidade.
            </p>
            <Button>
              <Plus className="h-[18px] w-[18px] mr-2" />
              Criar Primeiro Banner
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
