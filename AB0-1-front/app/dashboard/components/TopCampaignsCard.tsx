/**
 * TopCampaignsCard Component
 * 
 * Displays top performing UTM campaigns
 * Aligned with Precision Energy System:
 * - Silicon Dark Palette (#002B4D)
 * - Borders-only depth (0.5px)
 * - Mono fonts for technical data
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, ExternalLink, Target, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { companyDashboardApi, type TopCampaign } from '@/lib/api';
import { cn } from '@/lib/utils';

interface TopCampaignsCardProps {
  companyId: string;
  themeMode?: 'light' | 'dark';
  limit?: number;
  from?: string;
  to?: string;
}

export default function TopCampaignsCard({
  companyId,
  limit = 5,
  from,
  to,
}: TopCampaignsCardProps) {
  const { data, isLoading } = useQuery({
    queryKey: ['top-campaigns', companyId, limit, from ?? null, to ?? null],
    queryFn: async () => {
      return companyDashboardApi.getAnalyticsTopCampaigns(companyId, { from, to, limit });
    },
    enabled: Boolean(companyId),
    staleTime: 30_000,
    refetchOnWindowFocus: false,
  });
  const campaigns = data?.campaigns ?? [];

  if (isLoading) {
    return (
      <Card className="bg-[hsl(var(--dashboard-panel))] border-[hsl(var(--dashboard-border))] shadow-none">
        <CardHeader className="p-4">
          <Skeleton className="h-6 w-[180px] bg-[hsl(var(--dashboard-surface))]" />
          <Skeleton className="h-4 w-[240px] mt-2 bg-[hsl(var(--dashboard-surface))]" />
        </CardHeader>
        <CardContent className="p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-4">
              <Skeleton className="h-4 w-full mb-2 bg-[hsl(var(--dashboard-surface))]" />
              <Skeleton className="h-6 w-3/4 bg-[hsl(var(--dashboard-surface))]" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <Card className="bg-[hsl(var(--dashboard-panel))] border-[hsl(var(--dashboard-border))] shadow-none">
        <CardHeader className="p-4">
          <CardTitle className="text-[hsl(var(--dashboard-ink))] text-lg font-bold tracking-tight">
            Top Campanhas
          </CardTitle>
          <CardDescription className="text-[hsl(var(--dashboard-muted))]">
            Nenhuma campanha com UTM encontrada neste periodo
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-0">
          <div className="rounded-xl border border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))] p-4">
            <p className="text-sm text-[hsl(var(--dashboard-muted))]">
              Use parametros UTM para identificar campanhas e acompanhar visitas, CTAs e leads no periodo selecionado.
            </p>
            <p className="mt-2 text-[10px] text-[hsl(var(--dashboard-ink))]/35 font-mono">
              Ex: ?utm_source=google&utm_medium=cpc&utm_campaign=solar2026
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[hsl(var(--dashboard-panel))] border-[hsl(var(--dashboard-border))] shadow-none">
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-[hsl(var(--dashboard-ink))] text-lg font-bold tracking-tight">
          <TrendingUp className="h-5 w-5 text-brand-cyan" />
          Top Campanhas
        </CardTitle>
        <CardDescription className="text-[hsl(var(--dashboard-muted))]">
          Performance por campanha de marketing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {campaigns.map((campaign: TopCampaign, index) => {
          const rankColors = [
            { bg: 'bg-brand-blue/10', text: 'text-brand-blue', badge: 'bg-brand-blue' },
            { bg: 'bg-[hsl(var(--dashboard-surface))]', text: 'text-[hsl(var(--dashboard-muted))]', badge: 'bg-[hsl(var(--dashboard-border))]' },
            { bg: 'bg-brand-cyan/10', text: 'text-brand-cyan', badge: 'bg-brand-cyan' },
          ];
          const color = index < 3 ? rankColors[index] : rankColors[1];

          const ctr = campaign.total_visits > 0
            ? ((campaign.total_cta_clicks / campaign.total_visits) * 100).toFixed(1)
            : '0.0';

          return (
            <div
              key={campaign.id}
              className={cn(
                "p-4 rounded-xl border-[0.5px] transition-all duration-300 hover:bg-[hsl(var(--dashboard-surface))]",
                "border-[hsl(var(--dashboard-border))] bg-[hsl(var(--dashboard-surface))]"
              )}
            >
              {/* Campaign Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-bold text-[hsl(var(--dashboard-ink))] border-[0.5px] border-[hsl(var(--dashboard-border))]",
                        color.badge
                      )}
                    >
                      #{index + 1}
                    </span>
                    <h4 className="font-bold text-sm text-[hsl(var(--dashboard-ink))] tracking-tight">
                      {campaign.utm_campaign || 'Sem nome'}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-[hsl(var(--dashboard-border))] text-[hsl(var(--dashboard-ink))]/50 bg-[hsl(var(--dashboard-surface))]">
                      {campaign.utm_source || 'origem'}
                    </Badge>
                    {campaign.utm_medium && (
                      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-[hsl(var(--dashboard-border))] text-[hsl(var(--dashboard-ink))]/50 bg-[hsl(var(--dashboard-surface))]">
                        {campaign.utm_medium}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-brand-green font-mono tracking-tighter">
                  {campaign.conversion_rate.toLocaleString('pt-BR', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  })}%
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--dashboard-muted))]">
                    conversão
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-[hsl(var(--dashboard-surface))] border-[0.5px] border-[hsl(var(--dashboard-border))]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Users className="h-3.5 w-3.5 text-brand-blue" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--dashboard-muted))]">
                      Visitas
                    </p>
                  </div>
                  <p className="text-lg font-bold text-[hsl(var(--dashboard-ink))] font-mono">
                    {campaign.total_visits.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[hsl(var(--dashboard-surface))] border-[0.5px] border-[hsl(var(--dashboard-border))]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <ExternalLink className="h-3.5 w-3.5 text-brand-cyan" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--dashboard-muted))]">
                      CTAs
                    </p>
                  </div>
                  <p className="text-lg font-bold text-[hsl(var(--dashboard-ink))] font-mono">
                  {campaign.total_cta_clicks}
                  </p>
                  <p className="text-[10px] font-bold text-[hsl(var(--dashboard-muted)/0.75)] font-mono mt-0.5">
                    {ctr}% CTR
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-[hsl(var(--dashboard-surface))] border-[0.5px] border-[hsl(var(--dashboard-border))]">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Target className="h-3.5 w-3.5 text-brand-green" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--dashboard-muted))]">
                      Leads
                    </p>
                  </div>
                  <p className="text-lg font-bold text-[hsl(var(--dashboard-ink))] font-mono">
                    {campaign.total_leads}
                  </p>
                </div>
              </div>

              {/* Last Seen */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-[hsl(var(--dashboard-border))]">
                <p className="text-[10px] font-bold uppercase tracking-widest text-[hsl(var(--dashboard-muted)/0.75)]">
                  Última atividade
                </p>
                <p className="text-[10px] font-bold text-[hsl(var(--dashboard-muted))] font-mono">
                  {campaign.last_seen_at
                    ? new Date(campaign.last_seen_at).toLocaleDateString('pt-BR')
                    : '—'}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
