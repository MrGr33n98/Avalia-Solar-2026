'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { MessageCircle, Eye, XCircle, ChevronRight, Building, Star } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Lead } from '@/lib/api';
import { cn } from '@/lib/utils';

interface QuotesPanelProps {
  data: Lead[];
  loading?: boolean;
  onViewDetails?: (id: string) => void;
  onCancel?: (id: string) => void;
  onTabChange?: (tabId: string) => void;
}

const statusMap: Record<string, { label: string; color: string; bg: string }> = {
  draft: { label: 'Rascunho', color: 'text-slate-500', bg: 'bg-slate-100' },
  pending_otp: { label: 'Aguardando', color: 'text-amber-700', bg: 'bg-amber-100' },
  premium: { label: 'Premium', color: 'text-blue-700', bg: 'bg-blue-100' },
  proposal_sent: { label: 'Respondido', color: 'text-emerald-700', bg: 'bg-emerald-100' },
  canceled: { label: 'Cancelado', color: 'text-red-700', bg: 'bg-red-100' },
};

export function QuotesPanel({
  data,
  loading,
  onViewDetails,
  onCancel,
  onTabChange,
}: QuotesPanelProps) {
  const [activeTab, setActiveTab] = useState('all');

  const filteredData = data.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'open')
      return ['draft', 'pending_otp', 'verified'].includes(item.status || '');
    if (activeTab === 'replied') return item.status === 'proposal_sent';
    if (activeTab === 'closed') return item.status === 'canceled';
    return true;
  });

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    onTabChange?.(value);
  };

  const getCompanyName = (quote: Lead): string => {
    if (typeof quote.company === 'string' && quote.company.trim().length > 0) {
      return quote.company;
    }

    if (quote.company && typeof quote.company === 'object' && 'name' in quote.company) {
      const objectName = quote.company.name;
      if (typeof objectName === 'string' && objectName.trim().length > 0) {
        return objectName;
      }
    }

    if (quote.company_obj?.name) {
      return quote.company_obj.name;
    }

    return 'Empresa não identificada';
  };

  return (
    <Card className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      <CardHeader className="border-b border-slate-100 bg-white pb-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
          <CardTitle className="text-base font-semibold text-slate-950 md:text-lg">
            Meus Orçamentos
          </CardTitle>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
            <TabsList className="h-9 w-full justify-start overflow-x-auto rounded-xl border border-slate-200 bg-slate-50 p-1 sm:w-auto">
              <TabsTrigger
                value="all"
                className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                Todos
              </TabsTrigger>
              <TabsTrigger
                value="open"
                className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                Abertos
              </TabsTrigger>
              <TabsTrigger
                value="replied"
                className="rounded-lg text-xs font-medium data-[state=active]:bg-white data-[state=active]:text-blue-700 data-[state=active]:shadow-sm"
              >
                Respondidos
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-50">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            ))
          ) : filteredData.length === 0 ? (
            <div className="space-y-3 px-4 py-8 text-center">
              <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-slate-50">
                <Building className="h-6 w-6 text-slate-300" />
              </div>
              <div className="space-y-1">
                <p className="text-sm font-semibold text-slate-900">Nenhum orçamento ainda</p>
                <p className="mx-auto max-w-xs text-xs font-medium text-slate-500">
                  Compare propostas de empresas verificadas.
                </p>
              </div>
              <Button
                variant="default"
                className="h-11 w-full rounded-xl bg-blue-600 font-semibold hover:bg-blue-700 sm:w-auto sm:px-6"
                asChild
              >
                <a href="/empresas">Solicitar orçamento</a>
              </Button>
            </div>
          ) : (
            filteredData.map((quote) => {
              const companyName = getCompanyName(quote);
              const companyInitials = companyName.slice(0, 2).toUpperCase() || 'ES';

              return (
                <div
                  key={quote.id}
                  className="group flex flex-col justify-between gap-3 p-4 transition-all hover:bg-slate-50/50 sm:flex-row sm:items-center"
                >
                  {/* Z-PATTERN: Left (Company) */}
                  <div className="flex min-w-0 items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-11 w-11 rounded-xl border border-slate-100 shadow-sm">
                        <AvatarImage src={quote.company_logo_url || ''} className="object-cover" />
                        <AvatarFallback className="bg-slate-100 text-slate-400 font-semibold">
                          {companyInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div
                        className="absolute -left-1 -top-1 rounded-full border border-slate-50 bg-white p-0.5 shadow-sm"
                        title="Verificada"
                      >
                        <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      </div>
                    </div>
                    <div className="min-w-0">
                      <h4 className="truncate text-sm font-semibold text-slate-900 transition-colors group-hover:text-blue-600">
                        {companyName}
                      </h4>
                      <p className="text-xs font-medium text-slate-500">
                        {quote.product_vertical || 'Energia Solar'} ·{' '}
                        {new Date(quote.created_at).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  </div>

                  {/* Z-PATTERN: Center (Status) */}
                  <div className="flex items-center gap-3">
                    <Badge
                      variant="secondary"
                      className={cn(
                        'rounded-full px-2.5 py-1 text-xs font-semibold',
                        statusMap[quote.status || '']?.bg,
                        statusMap[quote.status || '']?.color
                      )}
                    >
                      {statusMap[quote.status || '']?.label || quote.status}
                    </Badge>
                  </div>

                  {/* Z-PATTERN: Right (CTA) */}
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="hidden h-9 rounded-xl border-slate-200 px-3 font-medium text-slate-600 sm:flex"
                      onClick={() => onViewDetails?.(quote.id.toString())}
                    >
                      Ver detalhes
                    </Button>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm"
                        >
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="end"
                        className="w-48 rounded-2xl border-slate-100 shadow-xl"
                      >
                        <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400">
                          Ações
                        </DropdownMenuLabel>
                        <DropdownMenuItem
                          onClick={() => onViewDetails?.(quote.id.toString())}
                          className="rounded-xl font-bold"
                        >
                          <Eye className="mr-2 h-4 w-4" /> Ver Detalhes
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="rounded-xl font-bold">
                          <a href={`/messages?quoteId=${quote.id}`}>
                            <MessageCircle className="mr-2 h-4 w-4" /> Mensagens
                          </a>
                        </DropdownMenuItem>
                        {['draft', 'pending_otp', 'verified'].includes(quote.status || '') && (
                          <DropdownMenuItem
                            className="text-red-600 focus:text-red-600 rounded-xl font-bold"
                            onClick={() => onCancel?.(quote.id.toString())}
                          >
                            <XCircle className="mr-2 h-4 w-4" /> Cancelar
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </CardContent>
    </Card>
  );
}
