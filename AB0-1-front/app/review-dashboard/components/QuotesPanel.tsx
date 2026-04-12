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

export function QuotesPanel({ data, loading, onViewDetails, onCancel, onTabChange }: QuotesPanelProps) {
  const [activeTab, setActiveTab] = useState('all');

  const filteredData = data.filter((item) => {
    if (activeTab === 'all') return true;
    if (activeTab === 'open') return ['draft', 'pending_otp', 'verified'].includes(item.status || '');    
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
    <Card className="rounded-3xl shadow-sm border border-slate-100 overflow-hidden bg-white">
      <CardHeader className="pb-4 bg-slate-50/50">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <CardTitle className="text-xl font-black text-slate-950 uppercase tracking-tight">Meus Orçamentos</CardTitle>
          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full sm:w-auto">
            <TabsList className="bg-white border border-slate-100 p-1 rounded-xl h-10">
              <TabsTrigger value="all" className="rounded-lg text-xs font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">Todos</TabsTrigger>
              <TabsTrigger value="open" className="rounded-lg text-xs font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">Abertos</TabsTrigger>
              <TabsTrigger value="replied" className="rounded-lg text-xs font-bold data-[state=active]:bg-slate-900 data-[state=active]:text-white">Respondidos</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-50">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="p-5 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-12 w-12 rounded-2xl" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-32" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
                <Skeleton className="h-8 w-24 rounded-lg" />
              </div>
            ))
          ) : filteredData.length === 0 ? (
            <div className="py-16 text-center space-y-4">
              <div className="bg-slate-50 h-16 w-16 rounded-full flex items-center justify-center mx-auto">
                <Building className="h-8 w-8 text-slate-300" />
              </div>
              <div className="space-y-1">
                <p className="text-slate-900 font-black uppercase text-sm">Nenhum orçamento ainda</p>
                <p className="text-slate-500 text-xs font-medium">Economize agora solicitando orçamentos para integradores.</p>
              </div>
              <Button variant="default" className="bg-blue-600 hover:bg-blue-700 font-black rounded-xl px-8 shadow-lg shadow-blue-100" asChild>
                <a href="/empresas">Começar Agora</a>
              </Button>
            </div>
          ) : (
            filteredData.map((quote) => {
              const companyName = getCompanyName(quote);
              const companyInitials = companyName.slice(0, 2).toUpperCase() || 'ES';

              return (
              <div key={quote.id} className="p-4 md:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-all group">
                {/* Z-PATTERN: Left (Company) */}
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <Avatar className="h-12 w-12 rounded-2xl border border-slate-100 shadow-sm">
                      <AvatarImage src={quote.company_logo_url || ''} className="object-cover" />
                      <AvatarFallback className="bg-slate-100 text-slate-400 font-black">
                        {companyInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="absolute -top-1 -left-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-50" title="Verificada">
                       <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900 uppercase tracking-tight group-hover:text-blue-600 transition-colors">
                      {companyName}
                    </h4>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      {quote.product_vertical || 'Energia Solar'} • {new Date(quote.created_at).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>

                {/* Z-PATTERN: Center (Status) */}
                <div className="flex items-center gap-3">
                  <Badge variant="secondary" className={cn("text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full", statusMap[quote.status || '']?.bg, statusMap[quote.status || '']?.color)}>
                    {statusMap[quote.status || '']?.label || quote.status}
                  </Badge>
                </div>

                {/* Z-PATTERN: Right (CTA) */}
                <div className="flex items-center gap-2">
                   <Button variant="outline" size="sm" className="h-10 rounded-xl font-bold border-slate-200 text-slate-600 px-4 hidden sm:flex" onClick={() => onViewDetails?.(quote.id.toString())}>
                     Ver Detalhes
                   </Button>
                   <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-10 w-10 rounded-xl hover:bg-white hover:shadow-sm">
                        <ChevronRight className="h-5 w-5 text-slate-400" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48 rounded-2xl border-slate-100 shadow-xl">
                      <DropdownMenuLabel className="text-[10px] font-black uppercase text-slate-400">Ações</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => onViewDetails?.(quote.id.toString())} className="rounded-xl font-bold">
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
