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
import { fetchApi } from '@/lib/api';
import { cn } from '@/lib/utils';

interface Campaign {
  id: number;
  utm_campaign: string;
  utm_source: string;
  utm_medium: string;
  total_visits: number;
  total_cta_clicks: number;
  total_leads: number;
  conversion_rate: number;
  last_seen_at: string;
}

interface TopCampaignsCardProps {
  companyId: string;
  themeMode?: 'light' | 'dark';
  limit?: number;
}

export default function TopCampaignsCard({
  companyId,
  themeMode = 'dark',
  limit = 5,
}: TopCampaignsCardProps) {
  // Lock to dark theme for consistency with the Silicon foundation
  const isDark = true; 

  const { data: campaigns, isLoading } = useQuery({
    queryKey: ['top-campaigns', companyId, limit],
    queryFn: async () => {
      const response = await fetchApi<{ campaigns: Campaign[] }>(
        `/company_dashboard/analytics/top_campaigns`,
        { params: { company_id: companyId, limit } }
      );
      return response.campaigns || [];
    },
    enabled: Boolean(companyId),
  });

  if (isLoading) {
    return (
      <Card className="bg-[#002B4D] border-white/10 shadow-none">
        <CardHeader className="p-4">
          <Skeleton className="h-6 w-[180px] bg-white/5" />
          <Skeleton className="h-4 w-[240px] mt-2 bg-white/5" />
        </CardHeader>
        <CardContent className="p-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-4">
              <Skeleton className="h-4 w-full mb-2 bg-white/5" />
              <Skeleton className="h-6 w-3/4 bg-white/5" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <Card className="bg-[#002B4D] border-white/10 shadow-none">
        <CardHeader className="p-4">
          <CardTitle className="text-white text-lg font-bold tracking-tight">
            Top Campanhas
          </CardTitle>
          <CardDescription className="text-white/40">
            Nenhuma campanha com UTM rastreada ainda
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px] p-4">
          <div className="text-center">
            <Target className="h-12 w-12 mx-auto mb-3 text-white/20" />
            <p className="text-sm text-white/50">
              Adicione parâmetros UTM aos seus links
            </p>
            <p className="text-[10px] mt-1 text-white/30 font-mono">
              Ex: ?utm_source=google&utm_medium=cpc&utm_campaign=solar2024
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-[#002B4D] border-white/10 shadow-none">
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-2 text-white text-lg font-bold tracking-tight">
          <TrendingUp className="h-5 w-5 text-brand-cyan" />
          Top Campanhas
        </CardTitle>
        <CardDescription className="text-white/40">
          Performance por campanha de marketing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3 p-4">
        {campaigns.map((campaign, index) => {
          const rankColors = [
            { bg: 'bg-brand-blue/10', text: 'text-brand-blue', badge: 'bg-brand-blue' },
            { bg: 'bg-white/5', text: 'text-white/60', badge: 'bg-white/20' },
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
                "p-4 rounded-xl border-[0.5px] transition-all duration-300 hover:bg-white/5",
                "border-white/10 bg-white/5"
              )}
            >
              {/* Campaign Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <span
                      className={cn(
                        "inline-flex items-center justify-center w-6 h-6 rounded-lg text-[10px] font-bold text-white border-[0.5px] border-white/20",
                        color.badge
                      )}
                    >
                      #{index + 1}
                    </span>
                    <h4 className="font-bold text-sm text-white tracking-tight">
                      {campaign.utm_campaign || 'Sem nome'}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-white/10 text-white/50 bg-white/5">
                      {campaign.utm_source}
                    </Badge>
                    {campaign.utm_medium && (
                      <Badge variant="outline" className="text-[10px] uppercase font-bold tracking-wider border-white/10 text-white/50 bg-white/5">
                        {campaign.utm_medium}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-2xl font-bold text-brand-green font-mono tracking-tighter">
                    {campaign.conversion_rate}%
                  </p>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                    conversão
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 rounded-lg bg-white/5 border-[0.5px] border-white/5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Users className="h-3.5 w-3.5 text-brand-blue" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Visitas
                    </p>
                  </div>
                  <p className="text-lg font-bold text-white font-mono">
                    {campaign.total_visits.toLocaleString()}
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border-[0.5px] border-white/5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <ExternalLink className="h-3.5 w-3.5 text-brand-cyan" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                      CTAs
                    </p>
                  </div>
                  <p className="text-lg font-bold text-white font-mono">
                    {campaign.total_cta_clicks}
                  </p>
                  <p className="text-[10px] font-bold text-white/30 font-mono mt-0.5">
                    {ctr}% CTR
                  </p>
                </div>
                <div className="p-3 rounded-lg bg-white/5 border-[0.5px] border-white/5">
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <Target className="h-3.5 w-3.5 text-brand-green" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                      Leads
                    </p>
                  </div>
                  <p className="text-lg font-bold text-white font-mono">
                    {campaign.total_leads}
                  </p>
                </div>
              </div>

              {/* Last Seen */}
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
                <p className="text-[10px] font-bold uppercase tracking-widest text-white/30">
                  Última atividade
                </p>
                <p className="text-[10px] font-bold text-white/40 font-mono">
                  {new Date(campaign.last_seen_at).toLocaleDateString('pt-BR')}
                </p>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
