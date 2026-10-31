'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Skeleton } from '@/components/ui/skeleton';
import { MunicipalityLocationDTO, SalesLead } from '@/lib/api/sales/types';
import { salesApi } from '@/lib/api/sales/client';
import { salesKeys } from '@/lib/api/sales/queryKeys';
import { OpportunityStatusDropdown } from '@/components/sales/pipeline/OpportunityStatusDropdown';
import { MapPin, User, ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';

interface MunicipalityLeadsSheetProps {
  location: MunicipalityLocationDTO | null;
  open: boolean;
  onClose: () => void;
  onOpenOpportunity: (opportunityId: number) => void;
  pipelineId?: number | null;
  searchQuery?: string;
}

export const MunicipalityLeadsSheet: React.FC<MunicipalityLeadsSheetProps> = ({
  location,
  open,
  onClose,
  onOpenOpportunity,
  pipelineId,
  searchQuery,
}) => {
  const [page, setPage] = useState(1);

  const queryParams = {
    city: location?.city,
    state: location?.state,
    pipeline_id: pipelineId ?? undefined,
    q: searchQuery,
    page,
    per_page: 15,
  };

  const { data, isLoading, isError, refetch } = useQuery<SalesLead[]>({
    queryKey: salesKeys.opportunities(queryParams),
    queryFn: () => salesApi.getOpportunities(queryParams),
    enabled: open && Boolean(location?.city && location?.state),
  });

  const formattedTotalValue = location
    ? `R$ ${(location.value_cents / 100).toLocaleString('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0,
      })}`
    : 'R$ 0';

  const opportunities: SalesLead[] = data || [];
  const total = location?.count || opportunities.length;
  const totalPages = Math.max(1, Math.ceil(total / 15));

  return (
    <Sheet open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md md:max-w-lg p-0 flex flex-col bg-white dark:bg-slate-900 border-l border-slate-200 dark:border-slate-800"
      >
        {/* Header */}
        <SheetHeader className="p-4 sm:p-5 border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-900/80">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-400 font-bold text-xs uppercase tracking-wider">
                <MapPin className="h-3.5 w-3.5" />
                <span>Município Filtrado</span>
              </div>
              <SheetTitle className="text-lg font-extrabold text-slate-900 dark:text-slate-100 mt-0.5">
                {location ? `${location.city}, ${location.state}` : 'Detalhes do Município'}
              </SheetTitle>
            </div>
            <span className="font-mono text-sm font-extrabold px-2.5 py-1 rounded-lg bg-blue-100 text-blue-900 dark:bg-blue-950 dark:text-blue-200">
              {location?.lead_count || 0} {(location?.lead_count || 0) === 1 ? 'lead' : 'leads'}
            </span>
          </div>

          <SheetDescription className="text-xs text-slate-500 dark:text-slate-400 pt-1 flex items-center justify-between">
            <span>
              Valor Total: <strong className="text-slate-800 dark:text-slate-200">{formattedTotalValue}</strong>
            </span>
            <span className="text-[10px] italic">Centroide aproximado</span>
          </SheetDescription>
        </SheetHeader>

        {/* Content Body */}
        <ScrollArea className="flex-1 p-4">
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="p-3 rounded-xl border border-slate-200 dark:border-slate-800 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              ))}
            </div>
          ) : isError ? (
            <div className="text-center py-12 space-y-2">
              <p className="text-xs text-rose-600 font-semibold">Falha ao carregar leads deste município.</p>
              <Button size="sm" variant="outline" onClick={() => refetch()} className="text-xs">
                Tentar Novamente
              </Button>
            </div>
          ) : opportunities.length === 0 ? (
            <div className="text-center py-12 space-y-1 text-slate-400">
              <p className="text-xs font-semibold">Nenhuma oportunidade localizada para os filtros vigentes.</p>
            </div>
          ) : (
            <div className="space-y-2.5" data-testid="municipality-leads-list">
              {opportunities.map((opp) => {
                const oppValue = opp.value_cents
                  ? `R$ ${(opp.value_cents / 100).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}`
                  : 'R$ 0';
                const accountName = opp.account?.name || 'Conta não informada';

                return (
                  <div
                    key={opp.id}
                    onClick={() => onOpenOpportunity(opp.id)}
                    className="group p-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:border-blue-400 dark:hover:border-blue-600 transition-all duration-150 shadow-2xs cursor-pointer flex flex-col gap-1.5"
                    data-testid={`municipality-lead-item-${opp.id}`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-1.5 min-w-0 flex-1">
                        <div className="shrink-0" onClick={(e) => e.stopPropagation()}>
                          <OpportunityStatusDropdown
                            status={opp.status}
                            variant="card"
                            opportunityId={opp.id}
                            opportunityName={opp.name}
                          />
                        </div>
                        <h5 className="truncate text-xs font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                          {accountName}
                        </h5>
                      </div>
                      <span className="text-xs font-extrabold text-blue-950 dark:text-blue-200 shrink-0">
                        {oppValue}
                      </span>
                    </div>

                    {opp.name && opp.name !== accountName && (
                      <p className="truncate text-[11px] text-slate-500 pl-6">
                        {opp.name}
                      </p>
                    )}

                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-100 dark:border-slate-800/80">
                      <div className="flex items-center gap-1 truncate">
                        <User className="h-3 w-3 shrink-0 text-slate-400" />
                        <span className="truncate">{opp.contact_name || 'Sem contato'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-blue-700 dark:text-blue-400 font-semibold group-hover:underline">
                        <span>Abrir</span>
                        <ExternalLink className="h-3 w-3" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ScrollArea>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="p-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between text-xs font-semibold bg-slate-50 dark:bg-slate-900">
            <span className="text-slate-500">
              Página {page} de {totalPages} ({total} no total)
            </span>
            <div className="flex items-center gap-1">
              <Button
                size="sm"
                variant="outline"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="h-7 px-2 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5 mr-0.5" /> Anterior
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                className="h-7 px-2 text-xs"
              >
                Próxima <ChevronRight className="h-3.5 w-3.5 ml-0.5" />
              </Button>
            </div>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
};

