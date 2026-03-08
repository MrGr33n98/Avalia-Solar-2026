/**
 * TopCampaignsCard Component
 * 
 * Displays top performing UTM campaigns
 * Shows: Campaign name, visits, CTAs, leads, conversion rate
 */

'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, ExternalLink, Target, Users } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { fetchApi } from '@/lib/api';

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
  themeMode = 'light',
  limit = 5,
}: TopCampaignsCardProps) {
  const isDark = themeMode === 'dark';

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
      <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
        <CardHeader>
          <Skeleton className="h-6 w-[180px]" />
          <Skeleton className="h-4 w-[240px] mt-2" />
        </CardHeader>
        <CardContent>
          {[...Array(3)].map((_, i) => (
            <div key={i} className="mb-4">
              <Skeleton className="h-4 w-full mb-2" />
              <Skeleton className="h-6 w-3/4" />
            </div>
          ))}
        </CardContent>
      </Card>
    );
  }

  if (!campaigns || campaigns.length === 0) {
    return (
      <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
        <CardHeader>
          <CardTitle className={isDark ? 'text-white' : 'text-foreground'}>
            Top Campanhas
          </CardTitle>
          <CardDescription className={isDark ? 'text-slate-400' : ''}>
            Nenhuma campanha com UTM rastreada ainda
          </CardDescription>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[200px]">
          <div className="text-center">
            <Target className={`h-12 w-12 mx-auto mb-3 ${isDark ? 'text-slate-600' : 'text-gray-400'}`} />
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
              Adicione parâmetros UTM aos seus links
            </p>
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-muted-foreground'}`}>
              Ex: ?utm_source=google&utm_medium=cpc&utm_campaign=solar2024
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={isDark ? 'bg-slate-900 border-slate-800' : 'bg-white'}>
      <CardHeader>
        <CardTitle className={`flex items-center gap-2 ${isDark ? 'text-white' : 'text-foreground'}`}>
          <TrendingUp className="h-5 w-5" />
          Top Campanhas
        </CardTitle>
        <CardDescription className={isDark ? 'text-slate-400' : ''}>
          Performance por campanha de marketing
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {campaigns.map((campaign, index) => {
          const rankColors = [
            { bg: isDark ? 'bg-yellow-900/20' : 'bg-yellow-50', text: 'text-yellow-600', badge: 'bg-yellow-500' },
            { bg: isDark ? 'bg-slate-800' : 'bg-gray-50', text: 'text-gray-600', badge: 'bg-gray-400' },
            { bg: isDark ? 'bg-orange-900/20' : 'bg-orange-50', text: 'text-orange-600', badge: 'bg-orange-500' },
          ];
          const color = index < 3 ? rankColors[index] : rankColors[2];

          const ctr = campaign.total_visits > 0
            ? ((campaign.total_cta_clicks / campaign.total_visits) * 100).toFixed(1)
            : '0.0';

          return (
            <div
              key={campaign.id}
              className={`p-4 rounded-lg border ${
                isDark ? 'border-slate-700 bg-slate-800/50' : 'border-gray-200 bg-gray-50/50'
              }`}
            >
              {/* Campaign Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold text-white ${color.badge}`}
                    >
                      #{index + 1}
                    </span>
                    <h4 className={`font-semibold text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {campaign.utm_campaign || 'Sem nome'}
                    </h4>
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="outline" className="text-xs">
                      {campaign.utm_source}
                    </Badge>
                    {campaign.utm_medium && (
                      <Badge variant="outline" className="text-xs">
                        {campaign.utm_medium}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    {campaign.conversion_rate}%
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                    conversão
                  </p>
                </div>
              </div>

              {/* Metrics Grid */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Users className={`h-3 w-3 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                      Visitas
                    </p>
                  </div>
                  <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {campaign.total_visits.toLocaleString()}
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <ExternalLink className={`h-3 w-3 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                      CTAs
                    </p>
                  </div>
                  <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {campaign.total_cta_clicks}
                  </p>
                  <p className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                    {ctr}% CTR
                  </p>
                </div>
                <div>
                  <div className="flex items-center gap-1 mb-1">
                    <Target className={`h-3 w-3 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                    <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-muted-foreground'}`}>
                      Leads
                    </p>
                  </div>
                  <p className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {campaign.total_leads}
                  </p>
                </div>
              </div>

              {/* Last Seen */}
              <p className={`text-xs mt-3 ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                Última atividade: {new Date(campaign.last_seen_at).toLocaleDateString('pt-BR')}
              </p>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
