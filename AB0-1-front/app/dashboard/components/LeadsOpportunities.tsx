'use client';

import { useState, useEffect } from 'react';
import { fetchApi } from '@/lib/api';
import { Target, Mail, Phone, MessageSquare, Calendar } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

import { Skeleton } from '@/components/ui/skeleton';

interface LeadsOpportunitiesProps {
  companyId: string;
  companyName?: string;
}

function LeadsSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <Card key={i}>
          <CardContent className="p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 space-y-3">
                <div className="flex items-center gap-2">
                  <Skeleton className="h-6 w-32" />
                  <Skeleton className="h-5 w-16" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-[18px] w-[18px]8" />
                  <Skeleton className="h-[18px] w-[18px]0" />
                  <Skeleton className="h-4 w-36" />
                </div>
                <Skeleton className="h-20 w-full" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-32" />
              <Skeleton className="h-9 w-28" />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export default function LeadsOpportunities({ companyId, companyName }: LeadsOpportunitiesProps) {
  const [leads, setLeads] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchApi<any[]>(
          '/leads',
          { params: { company_id: companyId, company_name: companyName } }
        );
        const mapped = Array.isArray(data) ? data.map((l: any) => ({
          id: String(l.id),
          name: l.name,
          email: l.email,
          phone: l.phone,
          message: l.message,
          company: l.company,
          status: 'new',
          created_at: l.created_at,
        })) : [];
        setLeads(mapped);
      } catch (e: any) {
        setError(e?.message || 'Falha ao carregar leads');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [companyId, companyName]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Leads e Oportunidades</h2>
          <p className="text-white/40">Gerencie contatos e oportunidades de negócio</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {loading ? (
          [1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-24 w-full rounded-xl" />)
        ) : (() => {
          const total = leads.length;
          const byStatus = {
            new: leads.filter((l) => l.status === 'new').length,
            contacted: leads.filter((l) => l.status === 'contacted').length,
            negotiating: leads.filter((l) => l.status === 'negotiating').length,
            converted: leads.filter((l) => l.status === 'converted').length,
          };
          const stats = [
            { label: 'Novos', count: byStatus.new || total, color: 'bg-blue-500' },
            { label: 'Contatados', count: byStatus.contacted || 0, color: 'bg-green-500' },
            { label: 'Em Negociação', count: byStatus.negotiating || 0, color: 'bg-yellow-500' },
            { label: 'Convertidos', count: byStatus.converted || 0, color: 'bg-purple-500' },
          ];
          return stats.map((stat) => (
            <Card key={stat.label}>
              <CardContent className="p-4">
                <div className={`w-3 h-3 rounded-full ${stat.color} mb-2`}></div>
                <p className="text-2xl font-bold">{stat.count}</p>
                <p className="text-sm text-white/40">{stat.label}</p>
              </CardContent>
            </Card>
          ));
        })()}
      </div>

      <div className="space-y-4">
        {loading && <LeadsSkeleton />}
        {error && (
          <Card>
            <CardContent className="p-4">
              <p className="text-sm text-destructive">{error}</p>
            </CardContent>
          </Card>
        )}
        {!loading && !error && leads.map((lead) => (
          <Card key={lead.id}>
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-lg">{lead.name}</h3>
                    <Badge variant={'default'}>
                      Novo
                    </Badge>
                  </div>
                  <div className="space-y-1 text-sm text-white/40">
                    <p className="flex items-center gap-2">
                      <Mail className="h-[18px] w-[18px]" />
                      {lead.email}
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-[18px] w-[18px]" />
                      {lead.phone}
                    </p>
                    <p className="flex items-center gap-2">
                      <Calendar className="h-[18px] w-[18px]" />
                      {new Date(lead.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                  <p className="text-sm mt-3 p-3 bg-muted rounded-lg">{lead.message}</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm">
                  <Phone className="h-[18px] w-[18px] mr-2" />
                  Ligar
                </Button>
                <Button variant="outline" size="sm">
                  <Mail className="h-[18px] w-[18px] mr-2" />
                  Enviar E-mail
                </Button>
                <Button variant="outline" size="sm">
                  <MessageSquare className="h-[18px] w-[18px] mr-2" />
                  WhatsApp
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {!loading && !error && leads.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Target className="h-12 w-12 text-white/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhum lead recebido</h3>
            <p className="text-white/40 text-center">
              Quando clientes entrarem em contato, os leads aparecerão aqui.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
